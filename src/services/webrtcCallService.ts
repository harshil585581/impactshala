import { supabase, getAuthedClient } from '../lib/supabase';

// ─── Public types ─────────────────────────────────────────────────────────────

export type CallState =
  | 'idle'
  | 'initiating'       // Gathering ICE + sending offer
  | 'ringing'          // Caller: waiting for answer | Callee: showing incoming UI
  | 'connecting'       // Offer/answer exchanged; ICE checks in progress
  | 'active'           // Media flowing — call is live
  | 'ended'            // Teardown done; briefly shows reason text
  | 'permission_denied';

export type CallEndReason =
  | 'hangup'
  | 'remote_ended'
  | 'declined'
  | 'busy'
  | 'timeout'
  | 'network_failure'
  | 'permission_denied'
  | 'error';

// Only signal types needed with Vanilla ICE — no separate 'ice-candidate' rows
type SignalType =
  | 'incoming-call'
  | 'call-ringing'
  | 'call-accepted'
  | 'call-declined'
  | 'call-busy'
  | 'call-ended';

export type IncomingCallData = {
  callerId: string;
  callerName: string;
  callerInitials: string;
  callerAvatarColor: string;
  callerAvatarImg?: string;
  isVideo: boolean;
  offer: RTCSessionDescriptionInit;
};

export type WebRTCCallbacks = {
  onStateChange: (state: CallState, reason?: CallEndReason) => void;
  onIncomingCall: (data: IncomingCallData) => void;
  onLocalStream:  (stream: MediaStream | null) => void;
  onRemoteStream: (stream: MediaStream | null) => void;
};

// ─── ICE configuration ────────────────────────────────────────────────────────
//
// STUN lets each peer discover its public IP.
// TURN (relay) is required when direct P2P is blocked by NAT/firewall.
//
// The open-relay servers below are fine for development/MVP. For production,
// sign up at https://www.metered.ca/stun-turn (free tier) or self-host coturn
// and replace credentials with short-lived tokens generated server-side.

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  // Free public relay — replace with your own in production
  { urls: 'turn:openrelay.metered.ca:80',           username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443',          username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turns:openrelay.metered.ca:443',         username: 'openrelayproject', credential: 'openrelayproject' },
];

const RING_TIMEOUT_MS       = 30_000;  // 30 s before "No Answer"
const RECONNECT_WAIT_MS     = 6_000;   // grace period for 'disconnected' → 'failed'
const ICE_GATHER_TIMEOUT_MS = 6_000;   // max wait for ICE gathering (safety valve)
const CALL_LOCK_KEY         = 'webrtc_call_lock';
const BROADCAST_CH_NAME     = 'webrtc_call_sync';

// ─── Vanilla ICE helper ───────────────────────────────────────────────────────
// Wait for RTCPeerConnection to finish gathering all ICE candidates so they can
// be embedded in the SDP.  This avoids sending dozens of separate trickle-ICE
// DB rows — much more reliable with a database-backed signaling channel.

function waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
  return new Promise((resolve) => {
    if (pc.iceGatheringState === 'complete') { resolve(); return; }
    const check = () => {
      if (pc.iceGatheringState === 'complete') {
        pc.removeEventListener('icegatheringstatechange', check);
        resolve();
      }
    };
    pc.addEventListener('icegatheringstatechange', check);
    // Safety: proceed after timeout even if gathering hasn't fully finished
    setTimeout(() => { pc.removeEventListener('icegatheringstatechange', check); resolve(); }, ICE_GATHER_TIMEOUT_MS);
  });
}

// ─── Service class (singleton) ────────────────────────────────────────────────

class WebRTCCallService {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private ringTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private signalSub: ReturnType<typeof supabase.channel> | null = null;
  private broadcastCh: BroadcastChannel | null = null;

  private myId = '';
  private peerId = '';
  private _state: CallState = 'idle';
  private _ownedCall = false;   // true if THIS tab initiated or accepted the call
  private cb: WebRTCCallbacks | null = null;

  // ── Initialise ───────────────────────────────────────────────────────────────

  init(myUserId: string, callbacks: WebRTCCallbacks) {
    // Re-entrancy guard — just swap callbacks if already subscribed
    if (this.myId === myUserId && this.signalSub) { this.cb = callbacks; return; }
    if (this.signalSub) supabase.removeChannel(this.signalSub);

    this.myId = myUserId;
    this.cb   = callbacks;

    this.signalSub = supabase
      .channel(`call_signals:${myUserId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'call_signals',
        filter: `to_user_id=eq.${myUserId}`,
      }, (payload) => {
        const row = payload.new as {
          to_user_id: string; from_user_id: string;
          signal_type: SignalType; payload: Record<string, unknown>;
        };
        if (row.to_user_id !== myUserId) return; // client-side safety guard
        this._onSignal(row.from_user_id, row.signal_type, row.payload).catch(() => {});
      })
      .subscribe();

    // BroadcastChannel: if a second tab receives the same incoming call, dismiss it
    // once another tab has taken the call.
    try {
      this.broadcastCh = new BroadcastChannel(BROADCAST_CH_NAME);
      this.broadcastCh.onmessage = (e) => {
        if ((e.data as { type: string }).type === 'call-taken'
            && this._state === 'ringing' && !this._ownedCall) {
          this._setState('idle');
          // Signal empty data so the component dismisses the incoming call modal
          this.cb?.onIncomingCall({
            callerId: '', callerName: '', callerInitials: '',
            callerAvatarColor: '', isVideo: false,
            offer: {} as RTCSessionDescriptionInit,
          });
        }
      };
    } catch { /* BroadcastChannel unavailable (e.g. very old browsers) */ }
  }

  // ── Destroy (called on component unmount) ────────────────────────────────────

  destroy() {
    if (this.signalSub) { supabase.removeChannel(this.signalSub); this.signalSub = null; }
    this.broadcastCh?.close();
    this._stopRingTimer();
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    this.pc?.close();
    this.pc = null;
    this._ownedCall = false;
    this._releaseLock();
    this._state = 'idle';
    this.myId = '';
    this.cb = null;
  }

  /** Reset to idle after 'ended' or 'permission_denied' has been displayed. */
  reset() {
    if (this._state === 'ended' || this._state === 'permission_denied') {
      this._state = 'idle';
    }
  }

  // ── Outgoing call ─────────────────────────────────────────────────────────────

  async initiateCall(
    peerId: string,
    callerName: string,
    callerInitials: string,
    callerAvatarColor: string,
    callerAvatarImg: string | undefined,
    isVideo: boolean,
  ): Promise<void> {
    if (this._state !== 'idle') throw new Error('Already in a call');
    this.peerId = peerId;
    this._ownedCall = true;
    this._acquireLock();
    this._setState('initiating');

    // 1. Get local media
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      });
    } catch {
      this._releaseLock();
      this._ownedCall = false;
      this._setState('permission_denied');
      this.cb?.onLocalStream(null);
      return;
    }
    this.localStream = stream;
    this.cb?.onLocalStream(stream);

    // 2. Create peer connection & add tracks
    const pc = this._createPC();
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    // 3. Create offer → setLocalDescription → wait for ALL ICE candidates (Vanilla ICE)
    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: isVideo });
      await pc.setLocalDescription(offer);
      await waitForIceGathering(pc);           // blocks until SDP has all candidates
    } catch {
      this._teardown('error');
      return;
    }

    // 4. Send the complete SDP (offer + all ICE candidates) to the callee
    try {
      await this._send(peerId, 'incoming-call', {
        callerName, callerInitials, callerAvatarColor, callerAvatarImg, isVideo,
        offer: pc.localDescription!,           // complete SDP — no trickle ICE needed
      });
    } catch {
      this._teardown('error');
      return;
    }

    this._setState('ringing');
    this._startRingTimer();
  }

  // ── Accept incoming call ──────────────────────────────────────────────────────

  async acceptCall(data: IncomingCallData): Promise<void> {
    if (this._state !== 'ringing') return;
    this._ownedCall = true;
    this._acquireLock();
    this.broadcastCh?.postMessage({ type: 'call-taken' });

    // 1. Get local media
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: data.isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      });
    } catch {
      await this._send(data.callerId, 'call-declined', { reason: 'permission_denied' }).catch(() => {});
      this._setState('permission_denied');
      this.cb?.onLocalStream(null);
      setTimeout(() => this.reset(), 3000);
      return;
    }
    this.localStream = stream;
    this.cb?.onLocalStream(stream);

    // 2. Create peer connection & add tracks
    const pc = this._createPC();
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    // 3. Apply remote offer → create answer → wait for ICE → send complete answer
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await waitForIceGathering(pc);           // callee gathers all candidates
      await this._send(data.callerId, 'call-accepted', { answer: pc.localDescription! });
      this._setState('connecting');
    } catch {
      this._teardown('error');
    }
  }

  // ── Decline / end ─────────────────────────────────────────────────────────────

  async declineCall(): Promise<void> {
    if (this._state !== 'ringing') return;
    if (this.peerId) await this._send(this.peerId, 'call-declined', {}).catch(() => {});
    this._teardown('declined', false);
  }

  async endCall(reason: CallEndReason = 'hangup'): Promise<void> {
    if (this.peerId) await this._send(this.peerId, 'call-ended', { reason }).catch(() => {});
    this._teardown(reason, false);
  }

  // ── Audio / video mute controls ───────────────────────────────────────────────

  setAudioMuted(muted: boolean) {
    this.localStream?.getAudioTracks().forEach((t) => { t.enabled = !muted; });
  }

  setVideoMuted(muted: boolean) {
    this.localStream?.getVideoTracks().forEach((t) => { t.enabled = !muted; });
  }

  getState(): CallState { return this._state; }
  getPeerId(): string   { return this.peerId; }

  // ── Private: incoming signal router ──────────────────────────────────────────

  private async _onSignal(fromId: string, type: SignalType, payload: Record<string, unknown>) {
    switch (type) {

      case 'incoming-call': {
        // Already busy → politely decline with 'busy'
        if (this._state !== 'idle' || this._isLocked()) {
          await this._send(fromId, 'call-busy', {}).catch(() => {});
          return;
        }
        this.peerId = fromId;
        this._ownedCall = false;
        this._setState('ringing');
        this.cb?.onIncomingCall({
          callerId:        fromId,
          callerName:        payload.callerName        as string,
          callerInitials:    payload.callerInitials    as string,
          callerAvatarColor: payload.callerAvatarColor as string,
          callerAvatarImg:   payload.callerAvatarImg   as string | undefined,
          isVideo:           payload.isVideo           as boolean,
          offer:             payload.offer             as RTCSessionDescriptionInit,
        });
        // Ack so caller resets the ring timer
        await this._send(fromId, 'call-ringing', {}).catch(() => {});
        break;
      }

      case 'call-ringing': {
        // Caller side: callee is alive — reset ring timeout
        if (this._state === 'initiating' || this._state === 'ringing') {
          this._setState('ringing');
          this._stopRingTimer();
          this._startRingTimer();
        }
        break;
      }

      case 'call-accepted': {
        if (this._state !== 'ringing' && this._state !== 'initiating') return;
        this._stopRingTimer();
        const pc = this.pc;
        if (!pc) return;
        try {
          // The answer SDP includes all callee ICE candidates (Vanilla ICE)
          await pc.setRemoteDescription(new RTCSessionDescription(payload.answer as RTCSessionDescriptionInit));
          this._setState('connecting');
          // ICE checks now happen automatically — ontrack / oniceconnectionstatechange
          // will fire when the connection completes.
        } catch {
          this._teardown('error');
        }
        break;
      }

      case 'call-declined': this._teardown('declined',     false); break;
      case 'call-busy':     this._teardown('busy',         false); break;
      case 'call-ended':    this._teardown('remote_ended', false); break;
    }
  }

  // ── Private: RTCPeerConnection factory ───────────────────────────────────────

  private _createPC(): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.pc = pc;

    // Remote tracks arriving → call is live
    pc.ontrack = (e) => {
      if (e.streams[0]) {
        this.cb?.onRemoteStream(e.streams[0]);
        if (this._state !== 'active') this._setState('active');
      }
    };

    // Network health monitoring
    pc.oniceconnectionstatechange = () => {
      const s = pc.iceConnectionState;
      if (s === 'failed') {
        this._teardown('network_failure');
      } else if (s === 'disconnected') {
        // Wait RECONNECT_WAIT_MS before declaring failure (handles brief blips)
        this.reconnectTimer = setTimeout(() => {
          if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
            this._teardown('network_failure');
          }
        }, RECONNECT_WAIT_MS);
      } else if (s === 'connected' || s === 'completed') {
        if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
        if (this._state !== 'active') this._setState('active');
      }
    };

    return pc;
  }

  // ── Private: state + teardown helpers ────────────────────────────────────────

  private _setState(state: CallState, reason?: CallEndReason) {
    this._state = state;
    this.cb?.onStateChange(state, reason);
  }

  private _teardown(reason: CallEndReason, silent = false) {
    this._stopRingTimer();
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    this.pc?.close();
    this.pc = null;
    this._ownedCall = false;
    this.peerId = '';
    this._releaseLock();
    if (!silent) {
      this.cb?.onLocalStream(null);
      this.cb?.onRemoteStream(null);
      this._setState('ended', reason);
    }
  }

  private _startRingTimer() {
    this._stopRingTimer();
    this.ringTimer = setTimeout(() => {
      if (this._state === 'ringing' || this._state === 'initiating') {
        if (this.peerId) this._send(this.peerId, 'call-ended', { reason: 'timeout' }).catch(() => {});
        this._teardown('timeout', false);
      }
    }, RING_TIMEOUT_MS);
  }

  private _stopRingTimer() {
    if (this.ringTimer) { clearTimeout(this.ringTimer); this.ringTimer = null; }
  }

  private async _send(toId: string, type: SignalType, payload: Record<string, unknown>) {
    const db = getAuthedClient();
    const { error } = await db.from('call_signals').insert({
      from_user_id: this.myId,
      to_user_id: toId,
      signal_type: type,
      payload,
    });
    if (error) throw new Error(error.message);
  }

  private _acquireLock() { localStorage.setItem(CALL_LOCK_KEY, `${this.myId}:${Date.now()}`); }
  private _releaseLock() { localStorage.removeItem(CALL_LOCK_KEY); }
  private _isLocked()   { return !!localStorage.getItem(CALL_LOCK_KEY); }
}

export const webrtcCallService = new WebRTCCallService();

// ─── UI helper ────────────────────────────────────────────────────────────────

export function callEndReasonText(reason: CallEndReason): string {
  switch (reason) {
    case 'declined':          return 'Call Declined';
    case 'busy':              return 'User is Busy';
    case 'timeout':           return 'No Answer';
    case 'network_failure':   return 'Network Error';
    case 'permission_denied': return 'Permission Denied';
    case 'remote_ended':      return 'Call Ended';
    case 'error':             return 'Call Failed';
    default:                  return 'Call Ended';
  }
}
