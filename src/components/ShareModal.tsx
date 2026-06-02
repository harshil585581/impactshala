import { useEffect, useRef, useState } from 'react';
import { fetchConnections, type Connection } from '../services/communityService';
import { getOrCreateConversation, sendMessage } from '../services/messageService';

export const SHARED_POST_PREFIX = '__SHARED_POST__:';

export type SharedPostPayload = {
  postId: string;
  postTable: 'posts' | 'discover_posts';
  authorName: string;
  authorAvatar: string | null;
  title: string;
  body: string;
  imageUrl: string | null;
};

export function encodeSharedPost(data: SharedPostPayload): string {
  return `${SHARED_POST_PREFIX}${JSON.stringify(data)}`;
}

export function parseSharedPost(text: string): SharedPostPayload | null {
  if (!text.startsWith(SHARED_POST_PREFIX)) return null;
  try {
    return JSON.parse(text.slice(SHARED_POST_PREFIX.length));
  } catch {
    return null;
  }
}

function buildShareUrl(postId: string, postTable: 'posts' | 'discover_posts') {
  const base = window.location.origin;
  return postTable === 'discover_posts'
    ? `${base}/discover?post=${postId}`
    : `${base}/home?post=${postId}`;
}

function Avatar({ name, url }: { name: string; url?: string | null }) {
  if (url) {
    return <img src={url} alt={name} className="w-10 h-10 rounded-full object-cover shrink-0" />;
  }
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-[#FF9400] flex items-center justify-center text-white font-bold text-sm shrink-0">
      {initials || '?'}
    </div>
  );
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postTable?: 'posts' | 'discover_posts';
  authorName?: string;
  authorAvatar?: string | null;
  postTitle?: string;
  postBody?: string;
  postImageUrl?: string | null;
};

export default function ShareModal({
  isOpen,
  onClose,
  postId,
  postTable = 'posts',
  authorName = '',
  authorAvatar = null,
  postTitle = '',
  postBody = '',
  postImageUrl = null,
}: Props) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [filtered, setFiltered] = useState<Connection[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const shareUrl = buildShareUrl(postId, postTable);
  const title = authorName ? `Send ${authorName}'s Post` : 'Send Post';

  useEffect(() => {
    if (!isOpen) return;
    setSelected(new Set());
    setSearch('');
    setSent(false);
    setLoading(true);
    fetchConnections()
      .then(({ connections: data }) => {
        setConnections(data);
        setFiltered(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    setTimeout(() => searchRef.current?.focus(), 80);
  }, [isOpen]);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    setFiltered(q ? connections.filter((c) => c.name.toLowerCase().includes(q)) : connections);
  }, [search, connections]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSend() {
    if (!selected.size || sending) return;
    setSending(true);
    try {
      const payload: SharedPostPayload = {
        postId,
        postTable,
        authorName,
        authorAvatar,
        title: postTitle,
        body: postBody,
        imageUrl: postImageUrl,
      };
      const msgContent = encodeSharedPost(payload);

      await Promise.all(
        [...selected].map(async (peerId) => {
          const convId = await getOrCreateConversation(peerId);
          await sendMessage(convId, msgContent);
        })
      );
      setSent(true);
      setTimeout(() => { setSent(false); onClose(); }, 1500);
    } catch {
      /* silently ignore */
    } finally {
      setSending(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[440px] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h2 className="text-[#18191c] font-bold text-lg leading-tight">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-[#6b7280]"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pb-3">
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a name"
            className="w-full border-b border-[#e0e0e0] py-2 text-[#18191c] text-sm placeholder:text-[#9199a3] outline-none bg-transparent"
          />
        </div>

        {/* Connections list */}
        <div className="flex-1 overflow-y-auto px-2">
          {loading ? (
            <div className="flex flex-col">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-3 bg-gray-200 rounded w-32" />
                    <div className="h-2.5 bg-gray-100 rounded w-24" />
                  </div>
                  <div className="w-5 h-5 rounded border border-gray-200 bg-gray-100 shrink-0" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-[#9199a3] text-sm text-center py-8">
              {search ? 'No connections found.' : 'No connections yet.'}
            </p>
          ) : (
            filtered.map((conn) => {
              const isChecked = selected.has(conn.id);
              const subtitle = [conn.title, conn.company].filter(Boolean).join(' • ');
              return (
                <button
                  key={conn.id}
                  onClick={() => toggle(conn.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-[#f5f5f5] last:border-b-0"
                >
                  <Avatar name={conn.name} url={conn.avatar_url} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#18191c] text-sm leading-tight truncate">{conn.name}</p>
                    {subtitle && (
                      <p className="text-[#777] text-xs mt-0.5 truncate">{subtitle}</p>
                    )}
                  </div>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isChecked ? 'bg-[#FF9400] border-[#FF9400]' : 'border-[#c0c0c0] bg-white'
                    }`}
                  >
                    {isChecked && (
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#f0f0f0]">
          <button
            onClick={copyLink}
            className="flex items-center gap-2 text-[#FF9400] text-sm font-medium hover:opacity-80 transition-opacity"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="#FF9400" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="#FF9400" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {copied ? 'Copied!' : 'Copy link to post'}
          </button>
          <button
            onClick={handleSend}
            disabled={!selected.size || sending}
            className={`px-7 py-2 rounded-full text-sm font-semibold transition-all ${
              selected.size && !sending
                ? 'bg-[#FF9400] text-white hover:bg-[#e68500]'
                : 'bg-[#f5f5f5] text-[#b0b0b0] cursor-not-allowed'
            }`}
          >
            {sent ? 'Sent!' : sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
