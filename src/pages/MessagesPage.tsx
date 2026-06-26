import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import { useLocation } from "react-router-dom";
import TopBar from "../components/TopBar";
import { supabase } from "../lib/supabase";
import {
  listConversations,
  getOrCreateConversation,
  fetchMessages,
  sendMessage as apiSendMessage,
  editMessage as apiEditMessage,
  deleteMessage as apiDeleteMessage,
  uploadFile,
  getCurrentUserId,
  type DirectMessage,
} from "../services/messageService";
import { fetchConnections, type Connection } from "../services/communityService";
import { fetchCallLogs, logCall, endCall as endCallDB, type CallLogDB } from "../services/callService";
import { webrtcCallService, callEndReasonText, type IncomingCallData, type CallState, type CallEndReason } from "../services/webrtcCallService";
import {
  fetchUserGroups,
  fetchGroupMessages,
  fetchGroupMembers as apiFetchGroupMembers,
  sendGroupMessage as apiSendGroupMessage,
  editGroupMessage as apiEditGroupMessage,
  deleteGroupMessage as apiDeleteGroupMessage,
  leaveGroup as apiLeaveGroup,
  createGroup as apiCreateGroup,
  addGroupMembers as apiAddGroupMembers,
  deleteGroup as apiDeleteGroup,
  removeGroupMember as apiRemoveGroupMember,
  updateGroupName as apiUpdateGroupName,
  type GroupChat as GroupChatDB,
  type GroupMessage as GroupMessageDB,
  type GroupMemberRow as GroupMemberRowDB,
} from "../services/groupService";
import { parseSharedPost, type SharedPostPayload } from "../components/ShareModal";

/* ── Shared Post Card (rendered inside message bubbles) ── */
function SharedPostCard({ data, isSent }: { data: SharedPostPayload; isSent: boolean }) {
  const shareUrl = data.postTable === 'discover_posts'
    ? `${window.location.origin}/discover?post=${data.postId}`
    : `${window.location.origin}/home?post=${data.postId}`;

  const initials = (data.authorName || 'U')
    .split(' ').map((w: string) => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();

  return (
    <div className={`rounded-xl overflow-hidden border ${isSent ? 'border-[#f77f00]/30 bg-white' : 'border-[#e5e7eb] bg-white'} w-[260px]`}>
      {/* Author row */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        {data.authorAvatar ? (
          <img src={data.authorAvatar} alt={data.authorName} className="w-8 h-8 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#FF9400] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
        )}
        <span className="text-[13px] font-semibold text-[#18191c] truncate">{data.authorName || 'Unknown'}</span>
      </div>

      {/* Cover image */}
      {data.imageUrl && (
        <img
          src={data.imageUrl}
          alt=""
          className="w-full h-[130px] object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      )}

      {/* Title + body */}
      <div className="px-3 pt-2 pb-1">
        {data.title && (
          <p className="text-[13px] font-semibold text-[#18191c] leading-snug line-clamp-2">{data.title}</p>
        )}
        {data.body && (
          <p className="text-[12px] text-[#6b7280] mt-0.5 line-clamp-2 leading-snug">{data.body}</p>
        )}
      </div>

      {/* View post link */}
      <div className="px-3 pb-3 pt-1 border-t border-[#f0f0f0] mt-1">
        <a
          href={shareUrl}
          className="text-[12px] text-[#FF9400] font-semibold hover:underline"
        >
          View Post →
        </a>
      </div>
    </div>
  );
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

type ChatItem = {
  id: string;
  peerId?: string;
  name: string;
  initials?: string;
  avatarColor?: string;
  avatarImg?: string;
  lastMessage: string;
  lastMessageType?: "document" | "video" | "audio" | "photo" | "text";
  time: string;
  unread?: number;
  unreadDot?: boolean;
  hasMention?: boolean;
};


type Message = {
  id: string;
  text?: string;
  type?: "image" | "separator" | "attachment";
  separator?: string;
  sender: "me" | "them";
  senderName?: string;
  time: string;
  replies?: number;
  edited?: boolean;
  sticker?: boolean;
  deleted?: boolean;
  replyTo?: { id: string; text: string; sender: "me" | "them" };
  attachmentName?: string;
  attachmentUrl?: string;
  attachmentMime?: string;
  audioUrl?: string;
  audioDuration?: number;
  waveform?: number[];
};

type GroupMember = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  role?: "Owner" | "Admin" | "Moderator";
};

const DEFAULT_MEMBERS: GroupMember[] = [
  { id: "gm1", name: "Alex Mason", initials: "AM", avatarColor: "#4f46e5", role: "Owner" },
  { id: "gm2", name: "Andrew Joseph", initials: "AJ", avatarColor: "#10b981", role: "Admin" },
  { id: "gm3", name: "Avery Quinn", initials: "AQ", avatarColor: "#ec4899", role: "Moderator" },
  { id: "gm4", name: "Brian Michael", initials: "BM", avatarColor: "#f59e0b" },
  { id: "gm5", name: "Carol Davis", initials: "CD", avatarColor: "#0ea5e9" },
  { id: "gm6", name: "David Wilson", initials: "DW", avatarColor: "#8b5cf6" },
  { id: "gm7", name: "Emma Roberts", initials: "ER", avatarColor: "#f77f00" },
  { id: "gm8", name: "Frank Turner", initials: "FT", avatarColor: "#14b8a6" },
];

const MOCK_GROUP_MEMBERS: Record<string, GroupMember[]> = {
  default: DEFAULT_MEMBERS,
};

type Contact = { id: string; name: string; initials: string; avatarColor: string };
const ALL_CONTACTS: Contact[] = [
  { id: "ac1",  name: "Alex Mason",      initials: "AM", avatarColor: "#4f46e5" },
  { id: "ac2",  name: "Andrew Joseph",   initials: "AJ", avatarColor: "#10b981" },
  { id: "ac3",  name: "Avery Quinn",     initials: "AQ", avatarColor: "#ec4899" },
  { id: "ac4",  name: "Brian Michael",   initials: "BM", avatarColor: "#f59e0b" },
  { id: "ac5",  name: "Cameron Lee",     initials: "CL", avatarColor: "#0ea5e9" },
  { id: "ac6",  name: "Charles Dean",    initials: "CD", avatarColor: "#8b5cf6" },
  { id: "ac7",  name: "Dana Cooper",     initials: "DC", avatarColor: "#f77f00" },
  { id: "ac8",  name: "Emily",           initials: "EM", avatarColor: "#14b8a6" },
  { id: "ac9",  name: "George Allen",    initials: "GA", avatarColor: "#4f46e5" },
  { id: "ac10", name: "Jennifer Lynn",   initials: "JL", avatarColor: "#ec4899" },
  { id: "ac11", name: "Jessica",         initials: "JE", avatarColor: "#f59e0b" },
  { id: "ac12", name: "John Paul",       initials: "JP", avatarColor: "#0ea5e9" },
];

const MOCK_GROUP_CHAT_MESSAGES: Record<string, Message[]> = {
  g9: [
    { id: "gc1", text: "Yes, it's available.", sender: "them", time: "4:56 pm", senderName: "George Alan" },
    { id: "gc2", text: "Awesome! Can I see a couple of pictures?", sender: "me", time: "4:56 pm" },
    { id: "gc3", text: "Sure! Sending them over now.", sender: "them", time: "4:56 pm", senderName: "George Alan" },
    { id: "gc4", text: "Thanks! Looks good.", sender: "me", time: "4:56 pm" },
    { id: "gc5", text: "I'll take it. Can you ship it?", sender: "me", time: "4:56 pm" },
    { id: "gc6", text: "Absolutely. Just send your address, and I'll ship it out.", sender: "them", time: "4:56 pm", senderName: "Tessa" },
    { id: "gc7", text: "Great, I'll send it now. Thanks!", sender: "me", time: "4:56 pm" },
    { id: "gc8", text: "Thank you!", sender: "them", time: "4:56 pm", senderName: "George Alan" },
  ],
};


type CallLog = {
  id: string;
  name: string;
  initials?: string;
  avatarColor?: string;
  date: string;
  type: "outgoing" | "missed";
  missedCount?: number;
};

const MOCK_CALLS: CallLog[] = [
  { id: "cl1", name: "John Paul", initials: "JP", avatarColor: "#4f46e5", date: "8 August, 8:14 pm", type: "outgoing" },
  { id: "cl2", name: "Epic Games", initials: "EG", avatarColor: "#8b5cf6", date: "8 August, 8:14 pm", type: "outgoing" },
  { id: "cl3", name: "Tessa", initials: "TE", avatarColor: "#ec4899", date: "8 August, 8:14 pm", type: "missed", missedCount: 2 },
  { id: "cl4", name: "Paul David", initials: "PD", avatarColor: "#0ea5e9", date: "8 August, 8:14 pm", type: "outgoing" },
  { id: "cl5", name: "Robert Allen", initials: "RA", avatarColor: "#10b981", date: "8 August, 8:14 pm", type: "outgoing" },
  { id: "cl6", name: "Safiya Fareena", initials: "SF", avatarColor: "#f59e0b", date: "8 August, 8:14 pm", type: "outgoing" },
  { id: "cl7", name: "Michael Scott", initials: "MS", avatarColor: "#6366f1", date: "8 August, 8:14 pm", type: "missed" },
  { id: "cl8", name: "Scott Franklin", initials: "SF", avatarColor: "#f77f00", date: "8 August, 8:14 pm", type: "outgoing" },
];


type Group = {
  id: string;
  name: string;
  members: number;
  initials: string;
  avatarColor: string;
  online?: boolean;
};

const MOCK_GROUPS: Group[] = [
  { id: "g1", name: "Artistic Design", members: 24, initials: "AD", avatarColor: "#8b5cf6" },
  { id: "g2", name: "Bright Minds Education", members: 233, initials: "BM", avatarColor: "#f77f00" },
  { id: "g3", name: "Code Craze", members: 8, initials: "CC", avatarColor: "#6366f1" },
  { id: "g4", name: "Creative Event", members: 42, initials: "CE", avatarColor: "#ec4899" },
  { id: "g5", name: "Epic Game", members: 33, initials: "EG", avatarColor: "#0ea5e9", online: true },
  { id: "g6", name: "Design Duo", members: 16, initials: "DD", avatarColor: "#10b981" },
  { id: "g7", name: "Future of Digital Technology", members: 11, initials: "FD", avatarColor: "#4f46e5" },
  { id: "g8", name: "Health Haven", members: 35, initials: "HH", avatarColor: "#f77f00" },
  { id: "g9", name: "Innovative Online Shopping", members: 44, initials: "IO", avatarColor: "#f59e0b" },
];

// ─── Avatar helper ───────────────────────────────────────────────────────────

function Avatar({
  initials,
  color,
  img,
  size = 40,
  online,
}: {
  initials?: string;
  color?: string;
  img?: string;
  size?: number;
  online?: boolean;
}) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {img ? (
        <img
          src={img}
          alt=""
          className="rounded-full object-cover w-full h-full bg-gray-100"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div
          className="rounded-full flex items-center justify-center text-white font-bold w-full h-full"
          style={{ backgroundColor: color ?? "#9ca3af", fontSize: size * 0.35 }}
        >
          {initials?.slice(0, 2)}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
      )}
    </div>
  );
}

// ─── Last message preview ─────────────────────────────────────────────────────

function highlightText(text: string, query: string, isActive = false): React.ReactNode {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((part, i) =>
    i % 2 === 1
      ? <mark key={i} className={`rounded-[2px] not-italic ${isActive ? "bg-[#f77f00] text-white" : "bg-[#ffd580] text-[#141414]"}`}>{part}</mark>
      : part
  );
}

function MessagePreview({ item }: { item: ChatItem }) {
  if (item.lastMessageType === "document") {
    return (
      <span className="flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
        Document
      </span>
    );
  }
  if (item.lastMessageType === "video") {
    return (
      <span className="flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polygon points="23 7 16 12 23 17 23 7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" /></svg>
        Video
      </span>
    );
  }
  if (item.lastMessageType === "audio") {
    return (
      <span className="flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" /><circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" /></svg>
        Audio
      </span>
    );
  }
  if (item.lastMessageType === "photo") {
    return (
      <span className="flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" /><polyline points="21 15 16 10 5 21" stroke="currentColor" strokeWidth="1.5" /></svg>
        Photo
      </span>
    );
  }
  if (item.hasMention) {
    const parts = item.lastMessage.split(/@(\w+)/);
    return (
      <span>
        {parts.map((p, i) =>
          i % 2 === 1 ? (
            <span key={i} className="text-[#f77f00] font-medium">@{p}</span>
          ) : (
            p
          )
        )}
      </span>
    );
  }
  if (item.lastMessage.startsWith("__SHARED_POST__:")) {
    return (
      <span className="flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Shared a post
      </span>
    );
  }
  return <span>{item.lastMessage}</span>;
}



// ─── Emoji data ──────────────────────────────────────────────────────────────

const EMOJI_CATEGORIES = [
  {
    id: "recent", label: "Recent",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    emojis: ["😀","😂","🥰","😍","🤩","😊","👍","❤️","😭","🙏","😎","🥳","😘","🤣","😇","😋"],
  },
  {
    id: "smileys", label: "Smiley & People",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M8 13s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="9" y1="9" x2="9.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="15" y1="9" x2="15.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    emojis: ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😙","😚","😋","😛","😝","😜","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","😟","🙁","☹️","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","💩","🤡","👹","👺","👻","👽","👾","🤖","😺","😸","😹","😻","😼","😽","🙀","😿","😾"],
  },
  {
    id: "nature", label: "Animals & Nature",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M6 8c0-1 .5-2 1.5-2.5M18 8c0-1-.5-2-1.5-2.5M12 11c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    emojis: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐒","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🦟","🦗","🕷","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧","🦣","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐕‍🦺","🐈","🐈‍⬛","🐓","🦃","🦤","🦚","🦜","🦢","🕊","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🐿","🦔","🐾","🐉","🐲","🌵","🎄","🌲","🌳","🌴","🪵","🌱","🌿","☘️","🍀","🎋","🍃","🍂","🍁","🪺","🪹","🍄","🌾","💐","🌷","🌹","🥀","🌺","🌸","🌼","🌻","🌞","🌝","🌛","🌜","🌚","🌕","🌖","🌗","🌘","🌑","🌒","🌓","🌔","🌙","🌟","⭐","🌠","🌌","☁️","⛅","🌤","🌦","🌧","⛈","🌩","🌨","❄️","☃️","⛄","🌬","💨","🌪","🌫","🌊","💧","💦","🔥"],
  },
  {
    id: "food", label: "Food & Drink",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><line x1="6" y1="2" x2="6" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="10" y1="2" x2="10" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="14" y1="2" x2="14" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    emojis: ["🍎","🍊","🍋","🍇","🍓","🍒","🍑","🥭","🍍","🥝","🍅","🍆","🥑","🥦","🥕","🌽","🌶","🧄","🧅","🥔","🍠","🥐","🥖","🍞","🥨","🥯","🧀","🥚","🍳","🥞","🧇","🥓","🥩","🍗","🍖","🦴","🌭","🍔","🍟","🍕","🫓","🌮","🌯","🫔","🥙","🧆","🥚","🍲","🫕","🥣","🥗","🍜","🍝","🍛","🍣","🍱","🥟","🦪","🍤","🍙","🍚","🍘","🍥","🥮","🍢","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜","🍯","🧃","🥤","🧋","☕","🍵","🫖","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🍾","🧉","🧊"],
  },
  {
    id: "activity", label: "Activity",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M5.2 5.2l13.6 13.6M18.8 5.2L5.2 18.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    emojis: ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🥊","🥋","🥅","⛳","🪁","🎣","🤿","🎽","🛹","🛼","🛷","⛸","🥌","🎿","⛷","🏂","🪂","🏋","🤼","🤸","🤺","⛹","🤾","🏊","🤽","🚣","🧗","🚵","🚴","🏆","🥇","🥈","🥉","🎖","🏅","🎗","🎫","🎟","🎪","🤹","🎭","🩰","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🪘","🎷","🎺","🎸","🪗","🎻","🪕","🎲","♟","🎯","🎳","🎮","🎰","🧩"],
  },
  {
    id: "travel", label: "Travel & Places",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    emojis: ["🌍","🌎","🌏","🌐","🗺","🧭","🏔","⛰","🌋","🗻","🏕","🏖","🏜","🏝","🏞","🏟","🏛","🏗","🏘","🏚","🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨","🏩","🏪","🏫","🏬","🏭","🏯","🏰","💒","🗼","🗽","⛪","🕌","🛕","🕍","⛩","🕋","⛲","⛺","🏙","🌁","🌃","🏙","🌄","🌅","🌆","🌇","🌉","🌌","🌠","🎇","🎆","🗾","🎑","🏞","🛣","🛤","🛫","🛬","🛩","💺","🚀","🛸","🚁","🛶","⛵","🛥","🚢","🚂","🚃","🚄","🚅","🚆","🚇","🚈","🚉","🚊","🚝","🚞","🚋","🚌","🚍","🚎","🚐","🚑","🚒","🚓","🚔","🚕","🚖","🚗","🚘","🚙","🛻","🚚","🚛","🚜","🏎","🏍","🛵","🚲","🛴","🛹","🛼","🚏","🛣","⛽","🚨","🚥","🚦","🚧","⚓"],
  },
  {
    id: "objects", label: "Objects",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.8V17a1 1 0 001 1h6a1 1 0 001-1v-2.2A7 7 0 0012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    emojis: ["⌚","📱","📲","💻","⌨","🖥","🖨","🖱","🖲","💽","💾","💿","📀","📷","📸","📹","🎥","📞","☎","📺","📻","🧭","⏱","⏲","⏰","🕰","⌛","⏳","📡","🔋","🔌","💡","🔦","🕯","🪔","🧱","🪞","🪟","🛋","🪑","🚿","🛁","🪠","🧴","🧷","🧹","🧺","🧻","🧼","🫧","🪥","🧽","🧯","🛒","🚪","🪣","🏮","🧲","🪜","🧰","🪤","🔑","🗝","🔨","🪓","⛏","⚒","🛠","🗡","⚔","🔫","🪃","🛡","🔧","🔩","⚙","🗜","⚖","🦯","🔗","⛓","🪝","🧲","🔮","🪬","🧿","🪩","💈","⚗","🔭","🔬","🕳","🩺","💊","💉","🩸","🩹","🩼","🩻","🪆","🪅","🪄","🎭","🎨","🖌","🖍","🧵","🪡","🧶","🪢","👓","🕶","🥽","🌂","☂️","🎃","🎄","🎆","🎇","🧨","✨","🎉","🎊","🎈","🎀","🎁","🎗","🎟","🎫","🏆","🥇","🎖","📯","🔔","🔕","🎵","🎶","🔇","🔈","🔉","🔊","📢","📣","🔔","🔕"],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateWaveform(): number[] {
  const count = 40;
  return Array.from({ length: count }, (_, i) => {
    const center = count / 2;
    const envelope = 1 - Math.pow((i - center) / center, 2) * 0.55;
    return Math.max(3, Math.round(22 * envelope * (Math.random() * 0.6 + 0.4)));
  });
}

function nowTimeStr(): string {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "pm" : "am"}`;
}

const AVATAR_COLORS_POOL = ['#8b5cf6','#f77f00','#6366f1','#ec4899','#0ea5e9','#10b981','#4f46e5','#f59e0b'];
function colorFromId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS_POOL[Math.abs(h) % AVATAR_COLORS_POOL.length];
}

function dbMemberToLocal(m: GroupMemberRowDB): GroupMember {
  const u = m.user;
  const name = u ? [u.first_name, u.last_name].filter(Boolean).join(' ') || u.org_name || 'User' : 'User';
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const roleMap: Record<string, GroupMember['role']> = { owner: 'Owner', admin: 'Admin', moderator: 'Moderator' };
  return { id: m.user_id, name, initials, avatarColor: colorFromId(m.user_id), role: roleMap[m.role] };
}

function dbGroupToLocal(g: GroupChatDB): Group {
  const initials = g.name.split(' ').map((w) => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
  return { id: g.id, name: g.name, members: g.member_count, initials, avatarColor: g.avatar_color };
}

function dbGroupMsgToLocal(m: GroupMessageDB, myId: string): Message {
  const isSent = m.sender_id === myId;
  const time = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (m.is_deleted) return { id: m.id, sender: isSent ? 'me' : 'them', time, deleted: true } as Message & { deleted: true };
  if (m.message_type === 'audio') return { id: m.id, sender: isSent ? 'me' : 'them', time, audioUrl: m.file_url ?? '', waveform: generateWaveform(), audioDuration: 0 };
  if (m.message_type === 'image' || m.message_type === 'file') {
    return { id: m.id, type: 'attachment', sender: isSent ? 'me' : 'them', time, attachmentName: m.file_name ?? 'file', attachmentUrl: m.file_url ?? '', attachmentMime: m.message_type === 'image' ? 'image/jpeg' : 'application/octet-stream' };
  }
  return { id: m.id, text: m.content ?? '', sender: isSent ? 'me' : 'them', time, senderName: isSent ? undefined : (m.sender_name ?? 'User') };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "chats" | "calls" | "users" | "groups";

export default function MessagesPage() {
  const location = useLocation();
  const navState = location.state as { userId?: string; userName?: string; userAvatar?: string } | null;

  // ── Real conversation/message state ──────────────────────────────────────────
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [convLoading, setConvLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const currentUserId = getCurrentUserId();

  const [activeTab, setActiveTab] = useState<Tab>("chats");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [addMemberSelected, setAddMemberSelected] = useState<string[]>([]);
  const [addMemberSearch, setAddMemberSearch] = useState("");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [callOverlay, setCallOverlay] = useState<{ name: string; initials: string; avatarColor: string; avatarImg?: string; isVideo?: boolean; peerId?: string } | null>(null);
  const [callMuted, setCallMuted] = useState(false);
  const [callHeld, setCallHeld] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const currentCallIdRef = useRef<string | null>(null);
  const callStartTimeRef = useRef<number>(0);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const incomingCallDataRef = useRef<IncomingCallData | null>(null);
  const callSecondsRef = useRef(0);
  const [webrtcState, setWebrtcState] = useState<CallState>('idle');
  const [callEndReason, setCallEndReason] = useState<CallEndReason | null>(null);

  type IncomingCallInfo = {
    callerId: string;
    callerName: string;
    callerInitials: string;
    callerAvatarColor: string;
    callerAvatarImg?: string;
    isVideo: boolean;
  };
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null);

  const [showChatSearch, setShowChatSearch] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [chatSearchIdx, setChatSearchIdx] = useState(0);
  const [showGroupSearch, setShowGroupSearch] = useState(false);
  const [showGrpHeaderMenu, setShowGrpHeaderMenu] = useState(false);
  const [grpHeaderMenuPos, setGrpHeaderMenuPos] = useState<{ top: number; right: number } | null>(null);
  const grpHeaderMenuRef = useRef<HTMLDivElement>(null);
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [groupSearchIdx, setGroupSearchIdx] = useState(0);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupMsgLoading, setGroupMsgLoading] = useState(false);
  const [groupMessages, setGroupMessages] = useState<Record<string, Message[]>>(MOCK_GROUP_CHAT_MESSAGES);
  const [groupMembers, setGroupMembers] = useState<Record<string, GroupMember[]>>({});
  const [groupMembersLoading, setGroupMembersLoading] = useState(false);
  const [groupInfoTab, setGroupInfoTab] = useState<"members" | "banned">("members");
  const [memberSearch, setMemberSearch] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");

  // ── Resolve raw DB content → sidebar preview fields ──────────────────────────
  function resolvePreview(raw: string | null): { lastMessage: string; lastMessageType: ChatItem["lastMessageType"] } {
    const text = raw ?? "Say hi!";
    if (text.startsWith("__SHARED_POST__:")) return { lastMessage: "Shared a post", lastMessageType: "text" };
    if (text === "[image]")    return { lastMessage: "Photo",    lastMessageType: "photo" };
    if (text === "[file]")     return { lastMessage: "Document", lastMessageType: "document" };
    if (text === "[audio]")    return { lastMessage: "Audio",    lastMessageType: "audio" };
    if (text === "[video]")    return { lastMessage: "Video",    lastMessageType: "video" };
    return { lastMessage: text, lastMessageType: "text" };
  }

  // ── Map API conversation → ChatItem ──────────────────────────────────────────
  function convToChat(c: { id: string; peer_id?: string; peer_name: string; peer_avatar: string | null; last_message: string | null; last_message_at: string | null }): ChatItem {
    const initials = c.peer_name
      .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
    return {
      id: c.id,
      peerId: c.peer_id,
      name: c.peer_name,
      initials,
      avatarColor: "#f77f00",
      avatarImg: c.peer_avatar ?? undefined,
      ...resolvePreview(c.last_message),
      time: c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
    };
  }

  // ── Map DB message → local Message type ──────────────────────────────────────
  function dbMsgToLocal(m: DirectMessage): Message {
    const isSent = m.sender_id === currentUserId;
    const timeStr = new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (m.is_deleted) {
      return { id: m.id, sender: isSent ? "me" : "them", time: timeStr, deleted: true } as Message & { deleted: boolean };
    }
    if (m.message_type === "audio") {
      return { id: m.id, sender: isSent ? "me" : "them", time: timeStr, audioUrl: m.file_url ?? "", waveform: generateWaveform(), audioDuration: 0, edited: m.is_edited };
    }
    if (m.message_type === "image" || m.message_type === "file") {
      return { id: m.id, type: "attachment", sender: isSent ? "me" : "them", time: timeStr, attachmentName: m.file_name ?? "file", attachmentUrl: m.file_url ?? "", attachmentMime: m.message_type === "image" ? "image/jpeg" : "application/octet-stream", edited: m.is_edited };
    }
    return { id: m.id, text: m.content ?? "", sender: isSent ? "me" : "them", time: timeStr, edited: m.is_edited };
  }

  // ── Load conversations on mount ───────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    setConvLoading(true);
    try {
      const convs = await listConversations();
      setChats(convs.map(convToChat));
    } catch {
      // keep empty
    } finally {
      setConvLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const loadGroups = useCallback(async () => {
    setGroupsLoading(true);
    try {
      const g = await fetchUserGroups();
      setGroups(g.map(dbGroupToLocal));
    } catch { /* keep empty */ }
    finally { setGroupsLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  // Convert DB call log → local CallLog type
  function dbCallToLocal(log: CallLogDB): CallLog {
    const myId = currentUserId;
    const isOutgoing = log.caller_id === myId;
    const peer = isOutgoing ? log.callee : log.caller;
    const name = peer ? [peer.first_name, peer.last_name].filter(Boolean).join(' ') || peer.org_name || 'Unknown' : 'Unknown';
    const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
    const d = new Date(log.started_at);
    const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) + ', ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      id: log.id,
      name,
      initials,
      avatarColor: colorFromId(isOutgoing ? log.callee_id : log.caller_id),
      date,
      type: isOutgoing ? 'outgoing' : (log.status === 'missed' ? 'missed' : 'outgoing'),
    };
  }

  useEffect(() => {
    fetchCallLogs()
      .then((logs) => setCallLogs(logs.map(dbCallToLocal)))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialise WebRTC call service and wire up all callbacks
  useEffect(() => {
    if (!currentUserId) return;
    webrtcCallService.init(currentUserId, {
      onStateChange: (state, reason) => {
        setWebrtcState(state);

        if (state === 'active') {
          // Timer starts when the call is actually connected
          callStartTimeRef.current = Date.now();
          if (callTimerRef.current) clearInterval(callTimerRef.current);
          callTimerRef.current = setInterval(() => {
            const secs = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
            callSecondsRef.current = secs;
            setCallSeconds(secs);
          }, 1000);

        } else if (state === 'ended') {
          setCallEndReason(reason ?? null);
          // Stop timer and log duration to DB
          if (callTimerRef.current) { clearInterval(callTimerRef.current); callTimerRef.current = null; }
          const callId = currentCallIdRef.current;
          if (callId) { endCallDB(callId, callSecondsRef.current).catch(() => {}); currentCallIdRef.current = null; }

          // For quick ends (hangup / remote_ended) close overlay immediately;
          // for declines / busy / timeout show the reason for 2.5 s
          const isQuick = reason === 'hangup' || reason === 'remote_ended';
          const close = () => {
            setCallOverlay(null);
            setCallEndReason(null);
            setCallMuted(false);
            setCallHeld(false);
            setCallSeconds(0);
            callSecondsRef.current = 0;
            webrtcCallService.reset();
          };
          if (isQuick) { close(); }
          else { setTimeout(close, 2500); }

        } else if (state === 'permission_denied') {
          // Service already stopped streams; overlay stays open showing the error
        }
      },

      onIncomingCall: (data) => {
        // Empty data = another tab took the call — dismiss modal
        if (!data.callerId) { setIncomingCall(null); incomingCallDataRef.current = null; return; }
        incomingCallDataRef.current = data;
        setIncomingCall({
          callerId:        data.callerId,
          callerName:      data.callerName,
          callerInitials:  data.callerInitials,
          callerAvatarColor: data.callerAvatarColor,
          callerAvatarImg: data.callerAvatarImg,
          isVideo:         data.isVideo,
        });
      },

      onLocalStream: (stream) => {
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      },

      onRemoteStream: (stream) => {
        remoteStreamRef.current = stream;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream ?? null;
      },
    });

    return () => webrtcCallService.destroy();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // When state reaches 'active', the call overlay's video element is now visible.
  // If onRemoteStream fired before the element mounted, attach the saved stream now.
  useEffect(() => {
    if (webrtcState === 'active' && remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
  }, [webrtcState]);

  async function acceptCall() {
    const data = incomingCallDataRef.current;
    if (!data) return;
    setIncomingCall(null);
    incomingCallDataRef.current = null;
    setCallOverlay({ name: data.callerName, initials: data.callerInitials, avatarColor: data.callerAvatarColor, avatarImg: data.callerAvatarImg, isVideo: data.isVideo, peerId: data.callerId });
    setCallMuted(false);
    setCallHeld(false);
    setCallSeconds(0);
    callSecondsRef.current = 0;
    await webrtcCallService.acceptCall(data);
  }

  async function declineCall() {
    setIncomingCall(null);
    incomingCallDataRef.current = null;
    await webrtcCallService.declineCall();
  }

  // Load group members when active group changes
  useEffect(() => {
    if (!activeGroupId) return;
    setGroupMembersLoading(true);
    apiFetchGroupMembers(activeGroupId)
      .then((rows) => setGroupMembers((prev) => ({ ...prev, [activeGroupId]: rows.map(dbMemberToLocal) })))
      .catch(() => {})
      .finally(() => setGroupMembersLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroupId]);

  // Load group messages when active group changes
  useEffect(() => {
    if (!activeGroupId) return;
    setGroupMsgLoading(true);
    fetchGroupMessages(activeGroupId)
      .then((msgs) => setGroupMessages((prev) => ({ ...prev, [activeGroupId]: msgs.map((m) => dbGroupMsgToLocal(m, currentUserId)) })))
      .catch(() => {})
      .finally(() => setGroupMsgLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroupId]);

  // Realtime subscription for active group messages
  useEffect(() => {
    if (!activeGroupId) return;
    const channel = supabase
      .channel(`group_messages:${activeGroupId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${activeGroupId}`,
      }, (payload) => {
        const incoming = payload.new as GroupMessageDB;
        if (incoming.sender_id === currentUserId) return; // already added optimistically
        setGroupMessages((prev) => ({
          ...prev,
          [activeGroupId]: [...(prev[activeGroupId] ?? []), dbGroupMsgToLocal(incoming, currentUserId)],
        }));
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${activeGroupId}`,
      }, (payload) => {
        const updated = payload.new as GroupMessageDB;
        setGroupMessages((prev) => ({
          ...prev,
          [activeGroupId]: (prev[activeGroupId] ?? []).map((m) =>
            m.id === updated.id
              ? (updated.is_deleted
                  ? { id: m.id, sender: m.sender, time: m.time, deleted: true } as Message & { deleted: true }
                  : { ...m, text: updated.content ?? m.text, edited: updated.is_edited })
              : m
          ),
        }));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroupId]);

  useEffect(() => {
    fetchConnections().then((r) => setRealUsers(r.connections)).catch(() => {});
  }, []);

  // ── Load messages when active chat changes ────────────────────────────────────
  useEffect(() => {
    if (!activeChatId) return;
    setMsgLoading(true);
    setMessages([]);
    fetchMessages(activeChatId)
      .then((msgs) => setMessages(msgs.map(dbMsgToLocal)))
      .catch(() => {})
      .finally(() => setMsgLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId]);

  // ── Supabase Realtime: new messages, edits, deletions ────────────────────────
  useEffect(() => {
    if (!activeChatId) return;

    function updateSidebarPreview(raw: string, at: string) {
      const { lastMessage, lastMessageType } = resolvePreview(raw);
      const timeStr = new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setChats((prev) => prev.map((c) =>
        c.id === activeChatId ? { ...c, lastMessage, lastMessageType, time: timeStr } : c
      ));
    }

    const channel = supabase
      .channel(`messages:${activeChatId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages", filter: `conversation_id=eq.${activeChatId}` },
        (payload) => {
          const incoming = payload.new as DirectMessage;
          // Update sidebar preview for all received messages (sent ones already handled optimistically)
          const rawContent = incoming.content ?? "";
          const previewRaw = incoming.message_type !== "text" ? `[${incoming.message_type}]` : rawContent;
          updateSidebarPreview(previewRaw, incoming.created_at);
          if (incoming.sender_id === currentUserId) return; // body already added optimistically
          setMessages((prev) => [...prev, dbMsgToLocal(incoming)]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "direct_messages", filter: `conversation_id=eq.${activeChatId}` },
        (payload) => {
          const updated = payload.new as DirectMessage;
          if (updated.is_deleted) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === updated.id
                  ? { id: m.id, sender: updated.sender_id === currentUserId ? "me" : "them", time: m.time, deleted: true }
                  : m
              )
            );
          } else if (updated.is_edited && updated.content) {
            // Propagate edits made by the other user
            if (updated.sender_id !== currentUserId) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === updated.id ? { ...m, text: updated.content ?? "", edited: true } : m
                )
              );
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId]);

  // ── Navigate from community page: auto-open or create conversation ────────────
  useEffect(() => {
    if (!navState?.userId) return;
    (async () => {
      try {
        const convId = await getOrCreateConversation(navState.userId!);
        await loadConversations();
        setActiveChatId(convId);
        setActiveTab("chats");
      } catch { /* ignore */ }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navState?.userId]);

  // ── Open or create conversation from Users tab ────────────────────────────────
  async function openConversationWith(peerId: string) {
    try {
      const convId = await getOrCreateConversation(peerId);
      await loadConversations();
      setActiveChatId(convId);
      setActiveTab("chats");
    } catch { /* ignore */ }
  }

  // ── Real users for Users tab (loaded from connections) ───────────────────────
  const [realUsers, setRealUsers] = useState<Connection[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupType, setNewGroupType] = useState<"Public" | "Private" | "Password">("Public");
  const [newGroupName, setNewGroupName] = useState("");
  const [createGroupError, setCreateGroupError] = useState("");
  const [createGroupLoading, setCreateGroupLoading] = useState(false);
  const [addMembersLoading, setAddMembersLoading] = useState(false);
  const [addMembersError, setAddMembersError] = useState("");

  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [replyToMsg, setReplyToMsg] = useState<Message | null>(null);

  // Group-specific editing / context-menu state
  const [editingGrpMsgId, setEditingGrpMsgId] = useState<string | null>(null);
  const [editGrpDraft, setEditGrpDraft] = useState("");
  const [grpMenuMsgId, setGrpMenuMsgId] = useState<string | null>(null);
  const [grpMenuPos, setGrpMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [deleteGrpConfirmMsg, setDeleteGrpConfirmMsg] = useState<Message | null>(null);
  const [replyToGrpMsg, setReplyToGrpMsg] = useState<Message | null>(null);
  const grpMenuRef = useRef<HTMLDivElement>(null);

  // Group name editing in Info panel
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [groupNameDraft, setGroupNameDraft] = useState("");
  const [groupNameSaving, setGroupNameSaving] = useState(false);

  // Per-group last message preview for sidebar
  const [groupLastMsg, setGroupLastMsg] = useState<Record<string, { text: string; time: string }>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const grpFileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const inputEmojiPickerRef = useRef<HTMLDivElement>(null);
  const stickerPanelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [menuMsgId, setMenuMsgId] = useState<string | null>(null);
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, string>>({});
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number } | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [showInputEmoji, setShowInputEmoji] = useState(false);
  const [inputEmojiPos, setInputEmojiPos] = useState<{ top: number; left: number } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showStickerPanel, setShowStickerPanel] = useState(false);
  const [stickerPanelPos, setStickerPanelPos] = useState<{ top: number; left: number } | null>(null);
  const [lightboxMsg, setLightboxMsg] = useState<Message | null>(null);
  const [deleteConfirmMsg, setDeleteConfirmMsg] = useState<Message | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [previewWaveform, setPreviewWaveform] = useState<number[]>([]);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  const [playProgress, setPlayProgress] = useState(0);
  const chunksRef = useRef<Blob[]>([]);
  const recordingSecondsRef = useRef(0);
  const sharedAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const groupMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    groupMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupMessages]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuMsgId(null);
      }
    }
    if (menuMsgId) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuMsgId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setEmojiPickerMsgId(null);
      }
    }
    if (emojiPickerMsgId) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [emojiPickerMsgId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (inputEmojiPickerRef.current && !inputEmojiPickerRef.current.contains(e.target as Node)) {
        setShowInputEmoji(false);
      }
    }
    if (showInputEmoji) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showInputEmoji]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (stickerPanelRef.current && !stickerPanelRef.current.contains(e.target as Node)) {
        setShowStickerPanel(false);
      }
    }
    if (showStickerPanel) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showStickerPanel]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (grpMenuRef.current && !grpMenuRef.current.contains(e.target as Node)) {
        setGrpMenuMsgId(null);
      }
    }
    if (grpMenuMsgId) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [grpMenuMsgId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (grpHeaderMenuRef.current && !grpHeaderMenuRef.current.contains(e.target as Node)) {
        setShowGrpHeaderMenu(false);
      }
    }
    if (showGrpHeaderMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showGrpHeaderMenu]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function openEmojiPicker(e: React.MouseEvent, msgId: string, isSent: boolean) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const panelW = 328;
    const panelH = 370;
    const left = isSent ? rect.right - panelW : rect.left;
    const top = rect.top - panelH - 8;
    setPickerPos({
      top: Math.max(8, Math.min(top, window.innerHeight - panelH - 8)),
      left: Math.max(8, Math.min(left, window.innerWidth - panelW - 8)),
    });
    setEmojiPickerMsgId(emojiPickerMsgId === msgId ? null : msgId);
  }

  function openMenu(e: React.MouseEvent, msgId: string, isSent: boolean) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const left = isSent ? rect.left - 196 : rect.right + 8;
    const top = Math.min(rect.bottom + 4, window.innerHeight - 280);
    setMenuPos({ top, left: Math.max(8, left) });
    setMenuMsgId(menuMsgId === msgId ? null : msgId);
  }

  function addReaction(msgId: string, emoji: string) {
    setReactions((prev) => {
      if (prev[msgId] === emoji) {
        const next = { ...prev };
        delete next[msgId];
        return next;
      }
      return { ...prev, [msgId]: emoji };
    });
    setEmojiPickerMsgId(null);
  }

  async function saveEdit(msgId: string) {
    const text = editDraft.trim();
    if (!text) return;
    // optimistic update
    setMessages((prev) =>
      prev.map((m) => m.id === msgId ? { ...m, text, edited: true } : m)
    );
    setEditingMsgId(null);
    try {
      await apiEditMessage(msgId, text);
    } catch { /* UI already updated */ }
  }

  async function sendMessage() {
    if (recordedUrl) { sendVoiceMessage(); return; }
    const text = draft.trim();
    if (!text || !activeChatId) return;
    const timeStr = nowTime();
    const tempId = `temp-${Date.now()}`;
    // optimistic
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        text,
        sender: "me" as const,
        time: timeStr,
        ...(replyToMsg ? { replyTo: { id: replyToMsg.id, text: replyToMsg.text ?? "", sender: replyToMsg.sender } } : {}),
      },
    ]);
    setDraft("");
    setReplyToMsg(null);
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; }
    try {
      const saved = await apiSendMessage(activeChatId, text, {
        reply_to_id: replyToMsg?.id,
      });
      // replace temp id with real id and update conversation list
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, id: saved.id } : m));
      setChats((prev) => prev.map((c) =>
        c.id === activeChatId ? { ...c, ...resolvePreview(text), time: timeStr } : c
      ));
    } catch {
      // remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function toggleAddMember(id: string) {
    setAddMemberSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  async function handleAddMembers() {
    if (!activeGroupId || addMembersLoading || addMemberSelected.length === 0) return;
    setAddMembersLoading(true);
    setAddMembersError("");
    try {
      await apiAddGroupMembers(activeGroupId, addMemberSelected);
      setGroups((prev) =>
        prev.map((g) =>
          g.id === activeGroupId ? { ...g, members: g.members + addMemberSelected.length } : g
        )
      );
      // Refresh member list to show newly added members
      apiFetchGroupMembers(activeGroupId)
        .then((rows) => setGroupMembers((prev) => ({ ...prev, [activeGroupId]: rows.map(dbMemberToLocal) })))
        .catch(() => {});
      setShowAddMembers(false);
      setAddMemberSelected([]);
      setAddMemberSearch("");
    } catch (err) {
      setAddMembersError(err instanceof Error ? err.message : "Failed to add members. Try again.");
    } finally {
      setAddMembersLoading(false);
    }
  }

  async function handleLeaveGroup() {
    const gid = activeGroupId;
    setShowLeaveConfirm(false);
    setShowGroupInfo(false);
    setShowChatInfo(false);
    setActiveGroupId(null);
    if (gid) {
      try {
        await apiLeaveGroup(gid);
        setGroups((prev) => prev.filter((g) => g.id !== gid));
      } catch { /* best-effort */ }
    }
  }

  async function handleDeleteGroup() {
    const gid = activeGroupId;
    setShowDeleteConfirm(false);
    setShowGroupInfo(false);
    setShowChatInfo(false);
    setActiveGroupId(null);
    setActiveChatId(null);
    if (gid) {
      try {
        await apiDeleteGroup(gid);
        setGroups((prev) => prev.filter((g) => g.id !== gid));
      } catch { /* best-effort: group may already be gone */ }
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!activeGroupId) return;
    const gid = activeGroupId;
    try {
      await apiRemoveGroupMember(gid, memberId);
      setGroupMembers((prev) => ({
        ...prev,
        [gid]: (prev[gid] ?? []).filter((m) => m.id !== memberId),
      }));
      setGroups((prev) =>
        prev.map((g) => g.id === gid ? { ...g, members: Math.max(0, g.members - 1) } : g)
      );
    } catch { /* show nothing — non-critical */ }
  }

  async function saveGroupName() {
    if (!activeGroupId || !groupNameDraft.trim()) return;
    const gid = activeGroupId;
    const name = groupNameDraft.trim();
    setGroupNameSaving(true);
    try {
      await apiUpdateGroupName(gid, name);
      setGroups((prev) =>
        prev.map((g) => g.id === gid ? { ...g, name, initials: name.split(' ').map((w) => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() } : g)
      );
      setEditingGroupName(false);
    } catch { /* ignore */ }
    finally { setGroupNameSaving(false); }
  }

  // Group file upload — separate from DM file handler
  function handleGroupFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeGroupId) return;

    async function processGroupFile(file: File) {
      const localUrl = URL.createObjectURL(file);
      const tempId = `gmsg-temp-${Date.now()}-${Math.random()}`;
      const gid = activeGroupId!;
      const time = nowTimeStr();
      const msgType: 'audio' | 'image' | 'file' = file.type.startsWith('audio/')
        ? 'audio'
        : file.type.startsWith('image/')
        ? 'image'
        : 'file';

      setGroupMessages((prev) => ({
        ...prev,
        [gid]: [
          ...(prev[gid] ?? []),
          {
            id: tempId,
            type: 'attachment' as const,
            sender: 'me' as const,
            time,
            attachmentName: file.name,
            attachmentUrl: localUrl,
            attachmentMime: file.type,
            ...(msgType === 'audio' ? { waveform: generateWaveform(), audioDuration: 0 } : {}),
          },
        ],
      }));

      try {
        const { uploadFile: uploadFn } = await import('../services/messageService');
        const { url, name } = await uploadFn(file);
        const saved = await apiSendGroupMessage(gid, `[${msgType}]`, {
          message_type: msgType,
          file_url: url,
          file_name: name,
        });
        URL.revokeObjectURL(localUrl);
        setGroupMessages((prev) => ({
          ...prev,
          [gid]: (prev[gid] ?? []).map((m) =>
            m.id === tempId ? { ...m, id: saved.id, attachmentUrl: url } : m
          ),
        }));
        const preview = msgType === 'image' ? '📷 Photo' : msgType === 'audio' ? '🎤 Voice message' : `📎 ${name}`;
        setGroupLastMsg((prev) => ({ ...prev, [gid]: { text: preview, time } }));
      } catch {
        URL.revokeObjectURL(localUrl);
        setGroupMessages((prev) => ({
          ...prev,
          [gid]: (prev[gid] ?? []).filter((m) => m.id !== tempId),
        }));
      }
    }

    Array.from(files).forEach(processGroupFile);
    e.target.value = '';
  }

  // Group message context menu
  function openGrpMenu(e: React.MouseEvent, msgId: string, isSent: boolean) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const left = isSent ? rect.left - 196 : rect.right + 8;
    const top = Math.min(rect.bottom + 4, window.innerHeight - 200);
    setGrpMenuPos({ top, left: Math.max(8, left) });
    setGrpMenuMsgId(grpMenuMsgId === msgId ? null : msgId);
  }

  async function saveGroupEdit(msgId: string) {
    const text = editGrpDraft.trim();
    if (!text || !activeGroupId) return;
    const gid = activeGroupId;
    setGroupMessages((prev) => ({
      ...prev,
      [gid]: (prev[gid] ?? []).map((m) => m.id === msgId ? { ...m, text, edited: true } : m),
    }));
    setEditingGrpMsgId(null);
    try { await apiEditGroupMessage(msgId, text); } catch { /* UI already updated */ }
  }

  function deleteGroupMsgForMe(msgId: string) {
    if (!activeGroupId) return;
    const gid = activeGroupId;
    setGroupMessages((prev) => ({
      ...prev,
      [gid]: (prev[gid] ?? []).filter((m) => m.id !== msgId),
    }));
    setDeleteGrpConfirmMsg(null);
    setGrpMenuMsgId(null);
  }

  async function deleteGroupMsgForEveryone(msgId: string) {
    if (!activeGroupId) return;
    const gid = activeGroupId;
    setGroupMessages((prev) => ({
      ...prev,
      [gid]: (prev[gid] ?? []).map((m) =>
        m.id === msgId
          ? { id: m.id, sender: m.sender, time: m.time, deleted: true }
          : m
      ),
    }));
    setDeleteGrpConfirmMsg(null);
    setGrpMenuMsgId(null);
    if (msgId.startsWith('gmsg-temp-') || msgId.startsWith('gmsg-')) return;
    try { await apiDeleteGroupMessage(msgId); } catch { /* best-effort */ }
  }

  async function sendGroupSticker(emoji: string) {
    if (!activeGroupId) return;
    const gid = activeGroupId;
    const tempId = `gmsg-temp-${Date.now()}`;
    setGroupMessages((prev) => ({
      ...prev,
      [gid]: [...(prev[gid] ?? []), { id: tempId, text: emoji, sender: 'me' as const, time: nowTimeStr(), sticker: true }],
    }));
    setShowStickerPanel(false);
    try {
      const saved = await apiSendGroupMessage(gid, emoji);
      setGroupMessages((prev) => ({
        ...prev,
        [gid]: (prev[gid] ?? []).map((m) => m.id === tempId ? { ...m, id: saved.id } : m),
      }));
    } catch {
      setGroupMessages((prev) => ({
        ...prev,
        [gid]: (prev[gid] ?? []).filter((m) => m.id !== tempId),
      }));
    }
  }

  // ── Chat search navigation ──────────────────────────────────────────────────
  const chatMatchIds = chatSearchQuery.trim()
    ? messages.filter(m => m.text?.toLowerCase().includes(chatSearchQuery.toLowerCase())).map(m => m.id)
    : [];

  useEffect(() => {
    if (chatMatchIds.length > 0) setChatSearchIdx(chatMatchIds.length - 1);
    else setChatSearchIdx(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatSearchQuery]);

  useEffect(() => {
    if (!chatMatchIds.length) return;
    const idx = Math.min(chatSearchIdx, chatMatchIds.length - 1);
    document.querySelector(`[data-msg-id="${chatMatchIds[idx]}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatSearchIdx, chatSearchQuery]);

  function chatSearchPrev() {
    if (!chatMatchIds.length) return;
    setChatSearchIdx(i => (i - 1 + chatMatchIds.length) % chatMatchIds.length);
  }
  function chatSearchNext() {
    if (!chatMatchIds.length) return;
    setChatSearchIdx(i => (i + 1) % chatMatchIds.length);
  }

  // ── Group search navigation ─────────────────────────────────────────────────
  const groupMatchIds = groupSearchQuery.trim() && activeGroupId
    ? (groupMessages[activeGroupId] ?? []).filter(m => m.text?.toLowerCase().includes(groupSearchQuery.toLowerCase())).map(m => m.id)
    : [];

  useEffect(() => {
    if (groupMatchIds.length > 0) setGroupSearchIdx(groupMatchIds.length - 1);
    else setGroupSearchIdx(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupSearchQuery]);

  useEffect(() => {
    if (!groupMatchIds.length) return;
    const idx = Math.min(groupSearchIdx, groupMatchIds.length - 1);
    document.querySelector(`[data-grp-msg-id="${groupMatchIds[idx]}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupSearchIdx, groupSearchQuery]);

  function groupSearchPrev() {
    if (!groupMatchIds.length) return;
    setGroupSearchIdx(i => (i - 1 + groupMatchIds.length) % groupMatchIds.length);
  }
  function groupSearchNext() {
    if (!groupMatchIds.length) return;
    setGroupSearchIdx(i => (i + 1) % groupMatchIds.length);
  }

  async function sendGroupMessage() {
    if (!activeGroupId) return;

    // Voice message
    if (recordedUrl) {
      if (audioPreviewRef.current) { audioPreviewRef.current.pause(); audioPreviewRef.current.src = ""; }
      const gid = activeGroupId;
      const tempId = `gmsg-temp-${Date.now()}`;
      const wf = previewWaveform; const dur = recordedDuration;
      setGroupMessages(prev => ({
        ...prev,
        [gid]: [...(prev[gid] ?? []), { id: tempId, sender: "me" as const, time: nowTime(), audioUrl: recordedUrl!, waveform: wf, audioDuration: dur }],
      }));
      const blobUrl = recordedUrl;
      setRecordedUrl(null); setRecordedDuration(0); setPreviewWaveform([]);
      setIsPreviewPlaying(false); setPreviewProgress(0);
      try {
        const blob = await fetch(blobUrl).then((r) => r.blob());
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type || 'audio/webm' });
        const { uploadFile: uploadGroupFile } = await import('../services/messageService');
        const { url } = await uploadGroupFile(file);
        const saved = await apiSendGroupMessage(gid, '[audio]', { message_type: 'audio', file_url: url, file_name: file.name });
        setGroupMessages(prev => ({ ...prev, [gid]: (prev[gid] ?? []).map((m) => m.id === tempId ? { ...m, id: saved.id, audioUrl: url } : m) }));
      } catch {
        setGroupMessages(prev => ({ ...prev, [gid]: (prev[gid] ?? []).filter((m) => m.id !== tempId) }));
      }
      return;
    }

    const text = draft.trim();
    if (!text) return;
    const gid = activeGroupId;
    const time = nowTime();
    const tempId = `gmsg-temp-${Date.now()}`;
    const replySnap = replyToGrpMsg;
    setGroupMessages(prev => ({
      ...prev,
      [gid]: [...(prev[gid] ?? []), {
        id: tempId, text, sender: "me" as const, time,
        ...(replySnap ? { replyTo: { id: replySnap.id, text: replySnap.text ?? "", sender: replySnap.sender } } : {}),
      }],
    }));
    setGroupLastMsg(prev => ({ ...prev, [gid]: { text, time } }));
    setDraft("");
    setReplyToGrpMsg(null);
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; }
    try {
      const saved = await apiSendGroupMessage(gid, text, replySnap ? { reply_to_id: replySnap.id } : undefined);
      setGroupMessages(prev => ({ ...prev, [gid]: (prev[gid] ?? []).map((m) => m.id === tempId ? { ...m, id: saved.id } : m) }));
    } catch {
      setGroupMessages(prev => ({ ...prev, [gid]: (prev[gid] ?? []).filter((m) => m.id !== tempId) }));
    }
  }

  function handleGroupKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendGroupMessage(); }
  }


  const nowTime = nowTimeStr;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeChatId) return;

    async function processFile(file: File) {
      const localUrl = URL.createObjectURL(file);
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const time = nowTime();
      const isAudio = file.type.startsWith("audio/");
      const msgType: "audio" | "image" | "file" = isAudio ? "audio"
        : file.type.startsWith("image/") ? "image" : "file";

      // Optimistic: show with local URL
      setMessages((prev) => [...prev, {
        id: tempId, type: "attachment" as const, sender: "me" as const, time,
        attachmentName: file.name, attachmentUrl: localUrl, attachmentMime: file.type,
        ...(isAudio ? { waveform: generateWaveform(), audioDuration: 0 } : {}),
      }]);

      try {
        const { url, name } = await uploadFile(file);
        const saved = await apiSendMessage(activeChatId!, `[${msgType}]`, {
          message_type: msgType,
          file_url: url,
          file_name: name,
        });
        URL.revokeObjectURL(localUrl);
        setMessages((prev) => prev.map((m) =>
          m.id === tempId ? { ...m, id: saved.id, attachmentUrl: url } : m
        ));
        setChats((prev) => prev.map((c) =>
          c.id === activeChatId ? { ...c, ...resolvePreview(`[${msgType}]`), time } : c
        ));
      } catch {
        URL.revokeObjectURL(localUrl);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    }

    Array.from(files).forEach(processFile);
    e.target.value = "";
  }

  function openInputEmojiPicker(e: React.MouseEvent) {
    if (showInputEmoji) { setShowInputEmoji(false); return; }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const panelW = 320; const panelH = 380;
    setInputEmojiPos({
      top: Math.max(8, rect.top - panelH - 8),
      left: Math.max(8, Math.min(rect.left, window.innerWidth - panelW - 8)),
    });
    setShowInputEmoji(true);
  }

  function appendEmoji(emoji: string) {
    setDraft((prev) => prev + emoji);
    setShowInputEmoji(false);
  }

  function formatDuration(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  async function toggleRecording() {
    if (isRecording) {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
      setRecordingSeconds(0);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        chunksRef.current = [];
        recordingSecondsRef.current = 0;
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
          const url = URL.createObjectURL(blob);
          setRecordedUrl(url);
          setRecordedDuration(recordingSecondsRef.current);
          setPreviewWaveform(generateWaveform());
          chunksRef.current = [];
        };

        recorder.start(100);
        setIsRecording(true);
        setRecordingSeconds(0);
        recordingTimerRef.current = setInterval(() => {
          recordingSecondsRef.current += 1;
          setRecordingSeconds((s) => s + 1);
        }, 1000);
      } catch {
        setMessages((prev) => [...prev, {
          id: `msg-${Date.now()}`,
          text: "🎤 Microphone access denied",
          sender: "me",
          time: nowTime(),
        }]);
      }
    }
  }

  function discardRecording() {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    if (audioPreviewRef.current) { audioPreviewRef.current.pause(); audioPreviewRef.current.src = ""; }
    setRecordedUrl(null);
    setRecordedDuration(0);
    setPreviewWaveform([]);
    setIsPreviewPlaying(false);
    setPreviewProgress(0);
  }

  function togglePreviewPlay() {
    const audio = audioPreviewRef.current;
    if (!audio || !recordedUrl) return;
    if (isPreviewPlaying) {
      audio.pause();
      setIsPreviewPlaying(false);
    } else {
      audio.src = recordedUrl;
      audio.ontimeupdate = () => setPreviewProgress(audio.currentTime / (audio.duration || 1));
      audio.onended = () => { setIsPreviewPlaying(false); setPreviewProgress(0); };
      audio.play();
      setIsPreviewPlaying(true);
    }
  }

  async function sendVoiceMessage() {
    if (!recordedUrl || !activeChatId) return;
    if (audioPreviewRef.current) { audioPreviewRef.current.pause(); audioPreviewRef.current.src = ""; }
    const wf = previewWaveform;
    const dur = recordedDuration;
    const tempId = `temp-${Date.now()}`;
    // Show optimistic message with local blob URL
    setMessages((prev) => [...prev, {
      id: tempId,
      sender: "me" as const,
      time: nowTime(),
      audioUrl: recordedUrl,
      audioDuration: dur,
      waveform: wf,
    }]);
    setRecordedUrl(null);
    setRecordedDuration(0);
    setPreviewWaveform([]);
    setIsPreviewPlaying(false);
    setPreviewProgress(0);
    try {
      // Convert blob URL → File → upload
      const blob = await fetch(recordedUrl!).then((r) => r.blob());
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type || "audio/webm" });
      const { url } = await uploadFile(file);
      const saved = await apiSendMessage(activeChatId, "[Audio]", { message_type: "audio", file_url: url, file_name: file.name });
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, id: saved.id, audioUrl: url } : m));
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  }

  function toggleMsgPlay(msgId: string, audioUrl: string) {
    const audio = sharedAudioRef.current;
    if (!audio) return;
    if (playingMsgId === msgId) {
      audio.pause();
      setPlayingMsgId(null);
      setPlayProgress(0);
    } else {
      if (playingMsgId) { audio.pause(); }
      audio.src = audioUrl;
      audio.ontimeupdate = () => setPlayProgress(audio.currentTime / (audio.duration || 1));
      audio.onended = () => { setPlayingMsgId(null); setPlayProgress(0); };
      audio.play();
      setPlayingMsgId(msgId);
    }
  }

  function openStickerPanel(e: React.MouseEvent) {
    if (showStickerPanel) { setShowStickerPanel(false); return; }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const panelW = 288; const panelH = 180;
    setStickerPanelPos({
      top: Math.max(8, rect.top - panelH - 8),
      left: Math.max(8, Math.min(rect.left, window.innerWidth - panelW - 8)),
    });
    setShowStickerPanel(true);
  }

  function deleteForMe(msgId: string) {
    // Remove from this user's view only — no DB change
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    setDeleteConfirmMsg(null);
    setMenuMsgId(null);
  }

  async function deleteForEveryone(msgId: string) {
    // Show "This message was deleted" tombstone to all participants
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { id: m.id, sender: m.sender, time: m.time, deleted: true }
          : m
      )
    );
    setDeleteConfirmMsg(null);
    setMenuMsgId(null);
    if (msgId.startsWith("temp-")) return; // not saved to DB yet
    try { await apiDeleteMessage(msgId); } catch { /* best-effort */ }
  }

  async function sendSticker(emoji: string) {
    if (!activeChatId) return;
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempId, text: emoji, sender: "me" as const, time: nowTime(), sticker: true }]);
    setShowStickerPanel(false);
    try {
      const saved = await apiSendMessage(activeChatId, emoji);
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, id: saved.id } : m));
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  }

  async function startCall(name: string, initials: string, avatarColor: string, isVideo = false, avatarImg?: string, peerId?: string) {
    if (!peerId) return;
    setCallOverlay({ name, initials, avatarColor, avatarImg, isVideo, peerId });
    setCallMuted(false);
    setCallHeld(false);
    setCallSeconds(0);
    callSecondsRef.current = 0;

    // Delegate all WebRTC logic to the service
    try {
      await webrtcCallService.initiateCall(peerId, name, initials, avatarColor, avatarImg, isVideo);
    } catch { /* service already set permission_denied state */ }

    // Log to call history (best-effort)
    try {
      const callId = await logCall(peerId, isVideo ? 'video' : 'audio');
      currentCallIdRef.current = callId;
      setCallLogs((prev) => [{
        id: callId, name, initials, avatarColor,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'outgoing',
      }, ...prev]);
    } catch { /* non-critical */ }
  }

  function toggleMute() {
    const next = !callMuted;
    webrtcCallService.setAudioMuted(next);
    setCallMuted(next);
  }

  async function handleEndCall() {
    // Service fires onStateChange('ended','hangup') → onStateChange callback handles
    // timer stop, DB logging, and overlay close
    await webrtcCallService.endCall('hangup');
  }

  const activeChat = chats.find((c) => c.id === activeChatId);
  const activeCall = callLogs.find((c) => c.id === activeCallId);
  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? null;
  const currentGroupMessages = activeGroupId ? (groupMessages[activeGroupId] ?? []) : [];
  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(groupSearch.toLowerCase())
  );
  const filteredUsers = realUsers.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      <TopBar onMenuToggle={() => {}} />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden pt-[64px] sm:pt-[72px] lg:pt-[78px]">
        {/* ── Left panel ── */}
        <div className="w-[420px] shrink-0 bg-white border-r border-[#e5e7eb] flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
            <h2 className="text-[18px] font-bold text-[#18191c] capitalize">{activeTab}</h2>
            {activeTab === "chats" && (
              <button className="text-[#9ca3af] hover:text-[#f77f00] transition-colors p-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
                </svg>
              </button>
            )}
            {activeTab === "groups" && (
              <button
                onClick={() => setShowNewGroupModal(true)}
                className="text-[#9ca3af] hover:text-[#f77f00] transition-colors p-1"
                aria-label="Create group"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M20 8v6M17 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {/* CHATS */}
            {activeTab === "chats" && (
              convLoading ? (
                <div className="flex flex-col gap-0">
                  {[0,1,2,3,4].map((i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-10 h-10 rounded-full bg-[#f2f2f3] animate-pulse shrink-0" />
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="h-3 w-28 bg-[#f2f2f3] animate-pulse rounded" />
                        <div className="h-2.5 w-40 bg-[#f2f2f3] animate-pulse rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : chats.length === 0 ? (
                <ChatsEmptyState />
              ) : (
                <div>
                  {chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => { setActiveChatId(chat.id); setActiveCallId(null); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f9fafb] transition-colors text-left ${activeChatId === chat.id ? "bg-[#fff6ed]" : ""}`}
                    >
                      <Avatar initials={chat.initials} color={chat.avatarColor} img={chat.avatarImg} size={42} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[14px] text-[#18191c] truncate">{chat.name}</span>
                          <span className="text-[12px] text-[#9ca3af] shrink-0">{chat.time}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <span className="text-[13px] text-[#9ca3af] truncate flex items-center gap-1">
                            <MessagePreview item={chat} />
                          </span>
                          {chat.unread && chat.unread > 0 ? (
                            <span className="shrink-0 min-w-[20px] h-5 bg-[#f77f00] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                              {chat.unread}
                            </span>
                          ) : chat.unreadDot ? (
                            <span className="shrink-0 w-2.5 h-2.5 bg-[#f77f00] rounded-full" />
                          ) : null}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )
            )}

            {/* CALLS */}
            {activeTab === "calls" && (
              callLogs.length === 0 ? (
                <CallsEmptyState />
              ) : (
                <div>
                  {callLogs.map((call) => (
                    <button
                      key={call.id}
                      onClick={() => { setActiveCallId(call.id); setActiveChatId(null); }}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#f9fafb] transition-colors text-left ${activeCallId === call.id ? "bg-[#fff6ed]" : ""}`}
                    >
                      <Avatar initials={call.initials} color={call.avatarColor} size={42} />
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-[14px] truncate ${call.type === "missed" ? "text-red-500" : "text-[#18191c]"}`}>
                          {call.type === "missed" && call.missedCount ? `${call.name} (${call.missedCount})` : call.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {call.type === "outgoing" ? (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2 10L10 2M10 2H4M10 2v6" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M10 2L2 10M2 10H8M2 10V4" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                          <span className="text-[12px] text-[#9ca3af]">{call.date}</span>
                        </div>
                      </div>
                      <button className="shrink-0 text-[#9ca3af] hover:text-[#f77f00] transition-colors p-1">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </button>
                  ))}
                </div>
              )
            )}

            {/* USERS */}
            {activeTab === "users" && (
              <div>
                <div className="px-4 py-3">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <input
                      type="search"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search"
                      className="w-full pl-9 pr-4 py-2 rounded-full bg-[#f5f5f5] text-sm text-[#374151] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#f77f00] transition-colors"
                    />
                  </div>
                </div>
                {filteredUsers.length === 0 && (
                  <p className="px-4 py-6 text-sm text-[#9ca3af] text-center">
                    {userSearch ? "No connections match your search." : "No connections yet. Add people from My Community."}
                  </p>
                )}
                {filteredUsers.map((user) => {
                  const initials = user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                  return (
                    <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f9fafb] transition-colors">
                      <Avatar initials={initials} img={user.avatar_url ?? undefined} color="#f77f00" size={42} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[14px] text-[#18191c] truncate">{user.name}</p>
                        <p className="text-[12px] text-[#9ca3af]">{user.title || user.company || "Community member"}</p>
                      </div>
                      <button
                        onClick={() => openConversationWith(user.id)}
                        className="shrink-0 px-3 py-1.5 border border-[#f77f00] text-[#f77f00] text-[12px] font-semibold rounded-full hover:bg-[#fff6ed] transition-colors"
                      >
                        Message
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* GROUPS */}
            {activeTab === "groups" && (
              <div>
                <div className="px-4 py-3">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <input
                      type="search"
                      value={groupSearch}
                      onChange={(e) => setGroupSearch(e.target.value)}
                      placeholder="Search"
                      className="w-full pl-9 pr-4 py-2 rounded-full bg-[#f5f5f5] text-sm text-[#374151] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#f77f00] transition-colors"
                    />
                  </div>
                </div>
                {groupsLoading ? (
                  [0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-10 h-10 rounded-full bg-[#f2f2f3] animate-pulse shrink-0" />
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="h-3 w-28 bg-[#f2f2f3] animate-pulse rounded" />
                        <div className="h-2.5 w-20 bg-[#f2f2f3] animate-pulse rounded" />
                      </div>
                    </div>
                  ))
                ) : filteredGroups.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-[#9ca3af]">
                    {groupSearch ? "No groups match your search." : "No groups yet. Create one with the button above."}
                  </p>
                ) : filteredGroups.map((group) => {
                  const last = groupLastMsg[group.id];
                  return (
                    <button
                      key={group.id}
                      onClick={() => setActiveGroupId(group.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f9fafb] transition-colors text-left ${activeGroupId === group.id ? "bg-[#fff6ed]" : ""}`}
                    >
                      <Avatar initials={group.initials} color={group.avatarColor} size={42} online={group.online} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-[14px] text-[#18191c] truncate">{group.name}</p>
                          {last && <span className="text-[11px] text-[#9ca3af] shrink-0">{last.time}</span>}
                        </div>
                        <p className="text-[12px] text-[#9ca3af] truncate">{last ? last.text : `${group.members} Members`}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom tab bar */}
          <div className="border-t border-[#e5e7eb] flex">
            {(["chats", "calls", "users", "groups"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setActiveChatId(null); setActiveCallId(null); setActiveGroupId(null); }}
                className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors text-[11px] font-medium capitalize ${activeTab === tab ? "text-[#f77f00]" : "text-[#9ca3af] hover:text-[#f77f00]"}`}
              >
                <TabIcon tab={tab} active={activeTab === tab} />
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 bg-[#f5f5f5] flex flex-col overflow-hidden">
          {/* Chats: active conversation */}
          {activeTab === "chats" && activeChat && (() => {
            const chatGroupMembers = (activeChatId ? groupMembers[activeChatId] : null) ?? [];
            const filteredChatMembers = chatGroupMembers.filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase()));
            return (
            <div className="flex h-full">
              {/* ── Chat column ── */}
              <div className="flex flex-col flex-1 min-w-0">
              {/* Chat header */}
              <div className="bg-white border-b border-[#e5e7eb] px-5 py-3.5 flex items-center gap-3 shrink-0">
                <Avatar initials={activeChat.initials} color={activeChat.avatarColor} img={activeChat.avatarImg} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[15px] text-[#18191c]">{activeChat.name}</p>
                  <p className="text-[12px] text-[#9ca3af]">{activeChat.time ? `Last seen ${activeChat.time}` : "Community member"}</p>
                </div>
                <div className="flex items-center gap-3 text-[#9ca3af]">
                  <button onClick={() => startCall(activeChat.name, activeChat.initials ?? activeChat.name.slice(0,2).toUpperCase(), activeChat.avatarColor ?? "#f77f00", true, activeChat.avatarImg, activeChat.peerId)} className="hover:text-[#f77f00] transition-colors p-1" aria-label="Video call">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><polygon points="23 7 16 12 23 17 23 7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" /></svg>
                  </button>
                  <button onClick={() => startCall(activeChat.name, activeChat.initials ?? activeChat.name.slice(0,2).toUpperCase(), activeChat.avatarColor ?? "#f77f00", false, activeChat.avatarImg, activeChat.peerId)} className="hover:text-[#f77f00] transition-colors p-1" aria-label="Audio call">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <button onClick={() => { setShowChatSearch(v => !v); setChatSearchQuery(""); }} className={`transition-colors p-1 ${showChatSearch ? "text-[#f77f00]" : "hover:text-[#f77f00]"}`} aria-label="Search">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" /><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </button>
                  <button className="hover:text-[#f77f00] transition-colors p-1" aria-label="More">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
                  </button>
                </div>
              </div>

              {/* Chat search bar */}
              {showChatSearch && (
                <div className="bg-white border-b border-[#e5e7eb] px-4 py-2 flex items-center gap-2 shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#9ca3af] shrink-0"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <input
                    autoFocus
                    type="text"
                    value={chatSearchQuery}
                    onChange={e => setChatSearchQuery(e.target.value)}
                    placeholder="Search in conversation…"
                    className="flex-1 text-[14px] text-[#18191c] placeholder:text-[#9ca3af] bg-transparent focus:outline-none"
                  />
                  {chatSearchQuery && (
                    <span className="text-[12px] text-[#9ca3af] shrink-0">
                      {chatMatchIds.length > 0 ? `${chatMatchIds.length - chatSearchIdx} of ${chatMatchIds.length}` : "0 found"}
                    </span>
                  )}
                  {chatSearchQuery && chatMatchIds.length > 0 && (
                    <>
                      <button onClick={chatSearchPrev} className="text-[#9ca3af] hover:text-[#f77f00] transition-colors shrink-0 p-0.5" title="Previous match">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
                      </button>
                      <button onClick={chatSearchNext} className="text-[#9ca3af] hover:text-[#f77f00] transition-colors shrink-0 p-0.5" title="Next match">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                      </button>
                    </>
                  )}
                  <button onClick={() => { setShowChatSearch(false); setChatSearchQuery(""); }} className="text-[#9ca3af] hover:text-[#374151] transition-colors shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-2">
                {msgLoading && (
                  <div className="flex flex-col gap-3 w-full">
                    {[0,1,2].map((i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                        <div className={`h-9 rounded-2xl bg-[#f2f2f3] animate-pulse ${i % 2 === 0 ? "w-48" : "w-36"}`} />
                      </div>
                    ))}
                  </div>
                )}
                {!msgLoading && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-[#9ca3af] text-sm">
                    No messages yet. Say hi!
                  </div>
                )}
                {messages.map((msg) => {
                  if (msg.type === "separator") {
                    return (
                      <div key={msg.id} className="flex items-center gap-3 my-2">
                        <div className="flex-1 h-px bg-[#e5e7eb]" />
                        <span className="text-[12px] text-[#9ca3af] font-medium px-2">{msg.separator}</span>
                        <div className="flex-1 h-px bg-[#e5e7eb]" />
                      </div>
                    );
                  }

                  /* Deleted message */
                  if (msg.deleted) {
                    const isSent = msg.sender === "me";
                    return (
                      <div key={msg.id} className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
                        <div className={`flex flex-col ${isSent ? "items-end" : "items-start"}`}>
                          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${isSent ? "rounded-tr-sm border-[#f77f00]/30 bg-[#fff6ed]" : "rounded-tl-sm border-[#e5e7eb] bg-white"}`}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-[#9ca3af] shrink-0">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                              <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              <circle cx="12" cy="16" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="1"/>
                            </svg>
                            <p className="text-[13px] italic text-[#9ca3af]">This message was deleted</p>
                          </div>
                          <p className={`text-[11px] text-[#9ca3af] mt-0.5 ${isSent ? "pr-1" : "pl-1"}`}>{msg.time}</p>
                        </div>
                      </div>
                    );
                  }

                  /* Audio / voice message */
                  if (msg.audioUrl) {
                    const isSent = msg.sender === "me";
                    const isPlaying = playingMsgId === msg.id;
                    const menuBtn = (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                        <button onClick={(e) => openMenu(e, msg.id, isSent)} className="w-7 h-7 rounded-full bg-white border border-[#e5e7eb] flex items-center justify-center text-[#9ca3af] hover:text-[#f77f00] hover:border-[#f77f00] transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
                        </button>
                      </div>
                    );
                    return (
                      <div key={msg.id} className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
                        <div className={`group flex flex-col ${isSent ? "items-end" : "items-start"}`}>
                          <div className={`flex items-center gap-1.5 ${isSent ? "flex-row" : "flex-row-reverse"}`}>
                            {menuBtn}
                            <AudioBubble
                              msgId={msg.id}
                              audioUrl={msg.audioUrl}
                              waveform={msg.waveform ?? []}
                              audioDuration={msg.audioDuration ?? 0}
                              isSent={isSent}
                              isPlaying={isPlaying}
                              playProgress={isPlaying ? playProgress : 0}
                              onToggle={toggleMsgPlay}
                            />
                          </div>
                          <p className={`text-[11px] text-[#9ca3af] mt-0.5 ${isSent ? "pr-1" : "pl-1"}`}>{msg.time}</p>
                        </div>
                      </div>
                    );
                  }

                  /* Attachment message (user-sent file) */
                  if (msg.type === "attachment") {
                    const isImg = msg.attachmentMime?.startsWith("image/");
                    const isVid = msg.attachmentMime?.startsWith("video/");
                    const isAudio = msg.attachmentMime?.startsWith("audio/");

                    /* Audio file → render as waveform player (same as voice message) */
                    if (isAudio && msg.attachmentUrl) {
                      const isSent = msg.sender === "me";
                      const isPlaying = playingMsgId === msg.id;
                      const menuBtn = (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                          <button onClick={(e) => openMenu(e, msg.id, isSent)} className="w-7 h-7 rounded-full bg-white border border-[#e5e7eb] flex items-center justify-center text-[#9ca3af] hover:text-[#f77f00] hover:border-[#f77f00] transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
                          </button>
                        </div>
                      );
                      return (
                        <div key={msg.id} className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
                          <div className={`group flex flex-col ${isSent ? "items-end" : "items-start"}`}>
                            <div className={`flex items-center gap-1.5 ${isSent ? "flex-row" : "flex-row-reverse"}`}>
                              {menuBtn}
                              <AudioBubble
                                msgId={msg.id}
                                audioUrl={msg.attachmentUrl}
                                waveform={msg.waveform ?? []}
                                audioDuration={msg.audioDuration ?? 0}
                                isSent={isSent}
                                isPlaying={isPlaying}
                                playProgress={isPlaying ? playProgress : 0}
                                onToggle={toggleMsgPlay}
                              />
                            </div>
                            <p className={`text-[11px] text-[#9ca3af] mt-0.5 ${isSent ? "pr-1" : "pl-1"}`}>{msg.time}</p>
                          </div>
                        </div>
                      );
                    }
                    const isSentAttachment = msg.sender === "me";
                    return (
                      <div key={msg.id} className={`flex ${isSentAttachment ? "justify-end" : "justify-start"}`}>
                        <div className="group flex flex-col max-w-[60%]" style={{ alignItems: isSentAttachment ? "flex-end" : "flex-start" }}>
                          <div className={`flex items-center gap-1.5 ${isSentAttachment ? "flex-row" : "flex-row-reverse"}`}>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                              <button onClick={(e) => openMenu(e, msg.id, isSentAttachment)} className="w-7 h-7 rounded-full bg-white border border-[#e5e7eb] flex items-center justify-center text-[#9ca3af] hover:text-[#f77f00] hover:border-[#f77f00] transition-colors">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
                              </button>
                            </div>
                            {isImg && msg.attachmentUrl ? (
                              <div className="relative group/img">
                                <button
                                  onClick={() => setLightboxMsg(msg)}
                                  className="rounded-2xl overflow-hidden border border-[#e5e7eb] bg-white block focus:outline-none"
                                >
                                  <img src={msg.attachmentUrl} alt={msg.attachmentName} className="max-w-[260px] max-h-[200px] object-cover block hover:opacity-95 transition-opacity" />
                                </button>
                                <button
                                  onClick={() => downloadAttachment(msg.attachmentUrl!, msg.attachmentName || "image")}
                                  className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70"
                                  title="Download"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                </button>
                              </div>
                            ) : isVid && msg.attachmentUrl ? (
                              <div className="relative group/vid">
                                <button
                                  onClick={() => setLightboxMsg(msg)}
                                  className="relative rounded-2xl overflow-hidden border border-[#e5e7eb] bg-black block focus:outline-none"
                                >
                                  <video src={msg.attachmentUrl} className="max-w-[260px] max-h-[200px] block object-cover" preload="metadata" />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                    </div>
                                  </div>
                                </button>
                                <button
                                  onClick={() => downloadAttachment(msg.attachmentUrl!, msg.attachmentName || "video")}
                                  className="absolute top-2 right-2 opacity-0 group-hover/vid:opacity-100 transition-opacity w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70"
                                  title="Download"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                </button>
                              </div>
                            ) : (
                              <div className="bg-[#ffeacc] rounded-2xl px-4 py-3 flex items-center gap-3 min-w-[200px]">
                                <div className="w-9 h-9 rounded-xl bg-[#f77f00]/20 flex items-center justify-center shrink-0">
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="#f77f00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-semibold text-[#18191c] truncate max-w-[140px]">{msg.attachmentName}</p>
                                  <p className="text-[11px] text-[#9ca3af]">Document</p>
                                </div>
                                {msg.attachmentUrl && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); downloadAttachment(msg.attachmentUrl!, msg.attachmentName || "file"); }}
                                    className="shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#f77f00] hover:bg-[#fff6ed] transition-colors border border-[#f77f00]/30"
                                    title="Download"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          <p className={`text-[11px] text-[#9ca3af] mt-0.5 ${isSentAttachment ? "pr-1" : "pl-1"}`}>{msg.time}</p>
                        </div>
                      </div>
                    );
                  }

                  /* Image message */
                  if (msg.type === "image") {
                    return (
                      <div key={msg.id} className="flex justify-start">
                        <div className="group flex flex-col items-start">
                          <div className="flex items-center gap-1.5">
                            <div className="bg-white rounded-2xl overflow-hidden border border-[#e5e7eb]">
                              <div className="w-[260px] h-[180px] bg-gradient-to-br from-[#c9a882] to-[#8b5cf6] flex items-center justify-center">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="white" strokeWidth="1.5" /><circle cx="8.5" cy="8.5" r="1.5" fill="white" /><polyline points="21 15 16 10 5 21" stroke="white" strokeWidth="1.5" /></svg>
                              </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                              <button onClick={(e) => openEmojiPicker(e, msg.id, false)} className="w-7 h-7 rounded-full bg-white border border-[#e5e7eb] flex items-center justify-center text-[#9ca3af] hover:text-[#f77f00] hover:border-[#f77f00] transition-colors text-[14px]">😊</button>
                              <button onClick={(e) => openMenu(e, msg.id, false)} className="w-7 h-7 rounded-full bg-white border border-[#e5e7eb] flex items-center justify-center text-[#9ca3af] hover:text-[#f77f00] hover:border-[#f77f00] transition-colors">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
                              </button>
                            </div>
                          </div>
                          {reactions[msg.id] && (
                            <button
                              onClick={() => addReaction(msg.id, reactions[msg.id])}
                              className="mt-1 ml-1 bg-white border border-[#e5e7eb] rounded-full px-2 py-0.5 text-[13px] shadow-sm hover:bg-red-50 transition-colors"
                            >
                              {reactions[msg.id]}
                            </button>
                          )}
                          <p className="text-[11px] text-[#9ca3af] pl-1 mt-0.5">{msg.time}</p>
                          {msg.replies && (
                            <button className="text-[12px] text-[#9ca3af] hover:text-[#f77f00] transition-colors flex items-center gap-1 pl-1 mt-0.5">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
                              {msg.replies} Replies
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  /* Received message */
                  if (msg.sender === "them") {
                    const sharedPost = msg.text ? parseSharedPost(msg.text) : null;
                    return (
                      <div key={msg.id} data-msg-id={msg.id} className="flex justify-start">
                        <div className="group flex flex-col items-start max-w-[55%] min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {sharedPost ? (
                              <SharedPostCard data={sharedPost} isSent={false} />
                            ) : (
                            <div className="bg-white border border-[#e5e7eb] rounded-2xl rounded-tl-sm px-4 py-2.5 min-w-0 overflow-hidden">
                              {msg.replyTo && (
                                <div className="border-l-2 border-[#f77f00] pl-2 mb-2 opacity-70">
                                  <p className="text-[10px] font-semibold text-[#f77f00]">{msg.replyTo.sender === "me" ? "You" : activeChat?.name}</p>
                                  <p className="text-[12px] text-[#9ca3af] truncate max-w-[200px]">{msg.replyTo.text}</p>
                                </div>
                              )}
                              <p className="text-[14px] text-[#18191c] leading-snug whitespace-pre-wrap" style={{ overflowWrap: "anywhere" }}>{highlightText(msg.text ?? "", chatSearchQuery, chatMatchIds[chatSearchIdx] === msg.id)}</p>
                            </div>
                            )}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                              <button onClick={(e) => openEmojiPicker(e, msg.id, false)} className="w-7 h-7 rounded-full bg-white border border-[#e5e7eb] flex items-center justify-center text-[#9ca3af] hover:text-[#f77f00] hover:border-[#f77f00] transition-colors text-[14px]">😊</button>
                              <button onClick={(e) => openMenu(e, msg.id, false)} className="w-7 h-7 rounded-full bg-white border border-[#e5e7eb] flex items-center justify-center text-[#9ca3af] hover:text-[#f77f00] hover:border-[#f77f00] transition-colors">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
                              </button>
                            </div>
                          </div>
                          {reactions[msg.id] && (
                            <button
                              onClick={() => addReaction(msg.id, reactions[msg.id])}
                              className="mt-1 ml-1 bg-white border border-[#e5e7eb] rounded-full px-2 py-0.5 text-[13px] shadow-sm hover:bg-red-50 transition-colors"
                            >
                              {reactions[msg.id]}
                            </button>
                          )}
                          <p className="text-[11px] text-[#9ca3af] pl-1 mt-0.5">{msg.time}</p>
                        </div>
                      </div>
                    );
                  }

                  /* Sent message */
                  const sentSharedPost = msg.text ? parseSharedPost(msg.text) : null;
                  return (
                    <div key={msg.id} data-msg-id={msg.id} className="flex justify-end">
                      <div className="group flex flex-col items-end max-w-[55%] min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                            <button onClick={(e) => openMenu(e, msg.id, true)} className="w-7 h-7 rounded-full bg-white border border-[#e5e7eb] flex items-center justify-center text-[#9ca3af] hover:text-[#f77f00] hover:border-[#f77f00] transition-colors">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
                            </button>
                            <button onClick={(e) => openEmojiPicker(e, msg.id, true)} className="w-7 h-7 rounded-full bg-white border border-[#e5e7eb] flex items-center justify-center text-[#9ca3af] hover:text-[#f77f00] hover:border-[#f77f00] transition-colors text-[14px]">😊</button>
                          </div>
                          {sentSharedPost ? (
                            <SharedPostCard data={sentSharedPost} isSent={true} />
                          ) : msg.sticker ? (
                            <div className="text-[48px] leading-none select-none px-1 py-0.5">{msg.text}</div>
                          ) : (
                            <div className="bg-[#ffeacc] rounded-2xl rounded-tr-sm px-4 py-2.5 min-w-0 overflow-hidden">
                              {msg.replyTo && (
                                <div className="border-l-2 border-[#f77f00] pl-2 mb-2 opacity-70">
                                  <p className="text-[10px] font-semibold text-[#f77f00]">{msg.replyTo.sender === "me" ? "You" : activeChat?.name}</p>
                                  <p className="text-[12px] text-[#9ca3af] truncate max-w-[200px]">{msg.replyTo.text}</p>
                                </div>
                              )}
                              <p className="text-[14px] text-[#18191c] leading-snug whitespace-pre-wrap" style={{ overflowWrap: "anywhere" }}>{highlightText(msg.text ?? "", chatSearchQuery, chatMatchIds[chatSearchIdx] === msg.id)}</p>
                              {msg.edited && <span className="text-[10px] text-[#9ca3af] ml-1">(edited)</span>}
                            </div>
                          )}
                        </div>
                        {reactions[msg.id] && (
                          <button
                            onClick={() => addReaction(msg.id, reactions[msg.id])}
                            className="mt-1 mr-1 bg-white border border-[#e5e7eb] rounded-full px-2 py-0.5 text-[13px] shadow-sm hover:bg-red-50 transition-colors"
                          >
                            {reactions[msg.id]}
                          </button>
                        )}
                        <p className="text-[11px] text-[#9ca3af] pr-1 mt-0.5">{msg.time}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Full emoji picker (escapes overflow-y-auto clip) */}
              {emojiPickerMsgId && pickerPos && (
                <div ref={emojiPickerRef} className="fixed z-[200]" style={{ top: pickerPos.top, left: pickerPos.left }}>
                  <EmojiPicker onSelect={(emoji) => addReaction(emojiPickerMsgId, emoji)} />
                </div>
              )}

              {/* Fixed-position context menu */}
              {menuMsgId && menuPos && (
                <div ref={menuRef} className="fixed z-[200]" style={{ top: menuPos.top, left: menuPos.left }}>
                  <MessageContextMenu
                    msg={messages.find(m => m.id === menuMsgId)!}
                    onClose={() => setMenuMsgId(null)}
                    onEdit={(msg) => { setEditingMsgId(msg.id); setEditDraft(msg.text ?? ""); setMenuMsgId(null); }}
                    onReply={(msg) => { setReplyToMsg(msg); setMenuMsgId(null); }}
                    onDeleteRequest={(msg) => {
                      // Temp messages (not yet saved to DB) — just remove locally, no confirmation needed
                      if (msg.id.startsWith("temp-")) {
                        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
                        setMenuMsgId(null);
                        return;
                      }
                      setDeleteConfirmMsg(msg);
                      setMenuMsgId(null);
                    }}
                  />
                </div>
              )}

              {/* Input emoji picker — inserts into draft */}
              {showInputEmoji && inputEmojiPos && (
                <div ref={inputEmojiPickerRef} className="fixed z-[200]" style={{ top: inputEmojiPos.top, left: inputEmojiPos.left }}>
                  <EmojiPicker onSelect={appendEmoji} />
                </div>
              )}

              {/* Sticker panel */}
              {showStickerPanel && stickerPanelPos && (
                <div ref={stickerPanelRef} className="fixed z-[200]" style={{ top: stickerPanelPos.top, left: stickerPanelPos.left }}>
                  <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-[#e5e7eb] w-[288px] p-3">
                    <p className="text-[13px] font-semibold text-[#374151] mb-2 px-1">Stickers</p>
                    <div className="grid grid-cols-6 gap-1">
                      {["🥰","😂","😎","🥳","😭","🤩","👍","❤️","🙏","🎉","🔥","💯","😅","🤔","😤","🥺","😴","🤯","👋","✨","🎊","💪","🫂","😇"].map((s) => (
                        <button
                          key={s}
                          onClick={() => sendSticker(s)}
                          className="w-10 h-10 flex items-center justify-center text-[28px] rounded-xl hover:bg-[#f5f5f5] transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Edit message modal */}
              {editingMsgId && (
                <EditMessageModal
                  draft={editDraft}
                  onChange={setEditDraft}
                  onSave={() => saveEdit(editingMsgId)}
                  onClose={() => setEditingMsgId(null)}
                />
              )}

              {/* Reply bar */}
              {replyToMsg && (
                <div className="flex items-center gap-3 px-4 py-2 bg-[#fff6ed] border-t border-[#f77f00]/20">
                  <div className="w-0.5 h-8 bg-[#f77f00] rounded-full shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-[#f77f00] mb-0.5">
                      {replyToMsg.sender === "me" ? "You" : activeChat?.name}
                    </p>
                    <p className="text-[12px] text-[#9ca3af] truncate">{replyToMsg.text}</p>
                  </div>
                  <button onClick={() => setReplyToMsg(null)} className="shrink-0 text-[#9ca3af] hover:text-[#374151] transition-colors p-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              )}

              {/* Input bar */}
              <div className="bg-white border-t border-[#e5e7eb] px-4 py-3">
                <input ref={fileInputRef} type="file" className="hidden" multiple accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.txt" onChange={handleFileSelect} />
                <div className="border border-[#e5e7eb] rounded-2xl overflow-hidden">

                  {/* ── State 1: Normal text input ── */}
                  {!isRecording && !recordedUrl && (
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={draft}
                      onChange={(e) => {
                        setDraft(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your message..."
                      className="w-full px-4 pt-3 pb-2 bg-transparent text-[14px] text-[#18191c] placeholder:text-[#9ca3af] focus:outline-none resize-none overflow-hidden leading-relaxed"
                    />
                  )}

                  {/* ── State 2: Recording in progress ── */}
                  {isRecording && (
                    <div className="flex items-center gap-3 px-4 pt-3 pb-2">
                      <span className="w-3 h-3 bg-red-500 rounded-full shrink-0 animate-pulse" />
                      <span className="text-[14px] text-red-500 font-medium flex-1 tabular-nums">
                        Recording… {String(Math.floor(recordingSeconds / 60)).padStart(2, "0")}:{String(recordingSeconds % 60).padStart(2, "0")}
                      </span>
                    </div>
                  )}

                  {/* ── State 3: Preview recorded audio before sending ── */}
                  {recordedUrl && (
                    <div className="flex items-center gap-3 px-3 pt-3 pb-2">
                      <button
                        onClick={togglePreviewPlay}
                        className="w-8 h-8 rounded-full bg-[#f77f00] flex items-center justify-center shrink-0 hover:bg-[#e06c00] transition-colors"
                      >
                        {isPreviewPlaying ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        )}
                      </button>
                      <div className="flex items-center gap-[2px] flex-1 h-8">
                        {previewWaveform.map((h, i) => {
                          const lit = isPreviewPlaying && (i / previewWaveform.length) < previewProgress;
                          return (
                            <div
                              key={i}
                              className="rounded-full transition-colors"
                              style={{ width: 3, height: `${Math.max(4, h)}px`, backgroundColor: lit ? "#f77f00" : "#fcd2a0" }}
                            />
                          );
                        })}
                      </div>
                      <span className="text-[12px] text-[#f77f00] font-medium tabular-nums shrink-0">
                        {isPreviewPlaying
                          ? formatDuration(Math.round(recordedDuration * previewProgress))
                          : formatDuration(recordedDuration)}
                      </span>
                      <button
                        onClick={discardRecording}
                        className="shrink-0 text-[#9ca3af] hover:text-red-500 transition-colors p-1"
                        title="Discard"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  )}

                  {/* ── Toolbar row ── */}
                  <div className="flex items-center justify-between px-3 pb-2.5 pt-1 border-t border-[#f3f4f6]">
                    {recordedUrl ? (
                      /* Preview mode: only show discard hint on left */
                      <p className="text-[12px] text-[#9ca3af] pl-1">Voice message ready</p>
                    ) : (
                      <div className="flex items-center gap-1 text-[#9ca3af]">
                        <button onClick={() => fileInputRef.current?.click()} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f5f5] hover:text-[#f77f00] transition-colors" title="Attach file">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        </button>
                        <button
                          onClick={toggleRecording}
                          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isRecording ? "bg-red-50 text-red-500 hover:bg-red-100" : "hover:bg-[#f5f5f5] hover:text-[#f77f00]"}`}
                          title={isRecording ? "Stop recording" : "Voice message"}
                        >
                          {isRecording ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5"/><path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          )}
                        </button>
                        <button onClick={openInputEmojiPicker} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${showInputEmoji ? "bg-[#fff6ed] text-[#f77f00]" : "hover:bg-[#f5f5f5] hover:text-[#f77f00]"}`} title="Emoji">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M8 13s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><line x1="9" y1="9" x2="9.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="15" y1="9" x2="15.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        </button>
                        <button onClick={openStickerPanel} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${showStickerPanel ? "bg-[#fff6ed] text-[#f77f00]" : "hover:bg-[#f5f5f5] hover:text-[#f77f00]"}`} title="Sticker">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2v-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 2l7 7M13 2v7h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      </div>
                    )}
                    <button
                      onClick={sendMessage}
                      className="w-9 h-9 rounded-full bg-[#f77f00] flex items-center justify-center hover:bg-[#e06c00] transition-colors shrink-0"
                      aria-label="Send"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              </div>{/* end flex-col chat column */}

              {/* ── Chat Info sidebar ── */}
              {showChatInfo && chatGroup && (
              <div className="w-[340px] shrink-0 bg-white border-l border-[#e5e7eb] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-white border-b border-[#f5f5f5] h-[64px] flex items-center gap-3 px-4 shrink-0">
                  <button onClick={() => setShowChatInfo(false)} className="text-[#9ca3af] hover:text-[#374151] transition-colors p-1 shrink-0" aria-label="Close">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                  <p className="font-bold text-[20px] text-[#141414]">Group Info</p>
                </div>
                {/* Profile */}
                <div className="flex flex-col items-center px-5 pt-7 pb-5 border-b border-[#f5f5f5]">
                  <div className="w-[88px] h-[88px] rounded-full flex items-center justify-center font-bold text-[28px]" style={{ backgroundColor: chatGroup.avatarColor, color: "#fff" }}>
                    {chatGroup.initials}
                  </div>
                  <p className="font-bold text-[16px] text-[#141414] mt-3 text-center leading-snug">{chatGroup.name}</p>
                  <p className="text-[13px] text-[#9ca3af] mt-0.5">{chatGroup.members} Members</p>
                </div>
                {/* Actions — hidden when Add Members panel is open */}
                {!showAddMembers && (<>
                <div className="border-b border-[#f5f5f5]">
                  <button onClick={() => { setShowAddMembers(true); setAddMemberSelected([]); setAddMemberSearch(""); }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#fff6ed] transition-colors text-left">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-[#f77f00] shrink-0"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/><circle cx="19" cy="8" r="3.5" fill="white"/><line x1="19" y1="6" x2="19" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="17" y1="8" x2="21" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    <span className="text-[15px] text-[#ff9400]">Add Members</span>
                  </button>
                  <button onClick={() => setShowLeaveConfirm(true)} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 transition-colors text-left">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-[#f44649] shrink-0"><path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5a2 2 0 00-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" fill="currentColor"/></svg>
                    <span className="text-[15px] text-[#f44649]">Leave</span>
                  </button>
                  <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 transition-colors text-left">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-[#f44649] shrink-0"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
                    <span className="text-[15px] text-[#f44649] font-normal">Delete and Exit</span>
                  </button>
                </div>
                {/* Members tabs */}
                <div className="flex border-b border-[#e5e7eb] shrink-0">
                  <button onClick={() => setGroupInfoTab("members")} className={`flex-1 py-2.5 text-[13px] font-medium transition-colors border-b-2 ${groupInfoTab === "members" ? "text-[#f77f00] border-[#f77f00]" : "text-[#9ca3af] border-transparent hover:text-[#374151]"}`}>View Members</button>
                  <button onClick={() => setGroupInfoTab("banned")} className={`flex-1 py-2.5 text-[13px] font-medium transition-colors border-b-2 ${groupInfoTab === "banned" ? "text-[#f77f00] border-[#f77f00]" : "text-[#9ca3af] border-transparent hover:text-[#374151]"}`}>Banned Members</button>
                </div>
                {/* Members search */}
                <div className="px-4 py-2.5 shrink-0">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    <input type="search" value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search" className="w-full pl-8 pr-3 py-1.5 rounded-full bg-[#f5f5f5] text-[13px] text-[#374151] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#f77f00] transition-colors" />
                  </div>
                </div>
                {/* Members list */}
                <div className="flex-1 overflow-y-auto">
                  {groupInfoTab === "members" ? (
                    filteredChatMembers.length === 0 ? (
                      <p className="text-center text-[13px] text-[#9ca3af] py-6">No members found</p>
                    ) : filteredChatMembers.map(member => (
                      <div key={member.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#f5f5f5] hover:bg-[#fafafa] transition-colors">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-[13px] shrink-0" style={{ backgroundColor: member.avatarColor }}>{member.initials}</div>
                        <p className="flex-1 font-medium text-[14px] text-[#141414] truncate">{member.name}</p>
                        {member.role === "Owner" && <span className="shrink-0 bg-[#ff9400] text-white text-[11px] px-2.5 py-0.5 rounded-full">{member.role}</span>}
                        {(member.role === "Admin" || member.role === "Moderator") && <span className="shrink-0 border border-[#ff9400] text-[#ff9400] text-[11px] px-2.5 py-0.5 rounded-full">{member.role}</span>}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-[13px] text-[#9ca3af] py-6">No banned members</p>
                  )}
                </div>
                </>)}

                {/* Add Members panel */}
                {showAddMembers && (
                  <AddMembersPanel
                    contacts={realUsers.map((u) => ({ id: u.id, name: u.name, initials: u.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(), avatarColor: colorFromId(u.id) }))}
                    selected={addMemberSelected}
                    search={addMemberSearch}
                    onSearchChange={setAddMemberSearch}
                    onToggle={toggleAddMember}
                    onBack={() => { setShowAddMembers(false); setAddMembersError(""); }}
                    onAdd={handleAddMembers}
                    loading={addMembersLoading}
                    error={addMembersError}
                  />
                )}
              </div>
              )}

            </div>
            );
          })()}

          {/* Calls: call detail */}
          {activeTab === "calls" && activeCall && (
            <CallDetailView call={activeCall} />
          )}

          {/* Groups: active group chat — chat area + info sidebar */}
          {activeTab === "groups" && activeGroup && (() => {
            const members = (activeGroupId ? groupMembers[activeGroupId] : null) ?? [];
            const filteredMembers = members.filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase()));
            return (
            <div className="flex h-full">

              {/* ── Chat column ── */}
              <div className="flex flex-col flex-1 min-w-0">

                {/* Group chat header */}
                <div className="bg-white border-b border-[#e5e7eb] px-5 py-3.5 flex items-center gap-3 shrink-0">
                  <Avatar initials={activeGroup.initials} color={activeGroup.avatarColor} size={40} />
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => setShowGroupInfo((v) => !v)}
                      className="font-bold text-[15px] text-[#18191c] hover:text-[#f77f00] transition-colors text-left truncate max-w-full"
                    >
                      {activeGroup.name}
                    </button>
                    <p className="text-[12px] text-[#9ca3af]">{activeGroup.members} Members</p>
                  </div>
                  <div className="flex items-center gap-3 text-[#9ca3af]">
                    <button onClick={() => setCallOverlay({ name: activeGroup.name, initials: activeGroup.initials, avatarColor: activeGroup.avatarColor, isVideo: true })} className="hover:text-[#f77f00] transition-colors p-1" aria-label="Video call">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><polygon points="23 7 16 12 23 17 23 7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" /></svg>
                    </button>
                    <button onClick={() => setCallOverlay({ name: activeGroup.name, initials: activeGroup.initials, avatarColor: activeGroup.avatarColor })} className="hover:text-[#f77f00] transition-colors p-1" aria-label="Voice call">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.02 2.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
                    </button>
                    <button onClick={() => { setShowGroupSearch(v => !v); setGroupSearchQuery(""); }} className={`transition-colors p-1 ${showGroupSearch ? "text-[#f77f00]" : "hover:text-[#f77f00]"}`} aria-label="Search">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setGrpHeaderMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
                          setShowGrpHeaderMenu((v) => !v);
                        }}
                        className={`transition-colors p-1 ${showGrpHeaderMenu ? "text-[#f77f00]" : "hover:text-[#f77f00]"}`}
                        aria-label="More"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/></svg>
                      </button>
                      {showGrpHeaderMenu && grpHeaderMenuPos && (
                        <div
                          ref={grpHeaderMenuRef}
                          className="fixed z-[300] bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.14)] border border-[#e5e7eb] py-1.5 min-w-[200px] overflow-hidden"
                          style={{ top: grpHeaderMenuPos.top, right: grpHeaderMenuPos.right }}
                        >
                          <button onClick={() => { setShowGroupInfo(true); setShowGrpHeaderMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors text-left">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#9ca3af]"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            Group Info
                          </button>
                          <button onClick={() => { setShowGroupSearch(true); setShowGrpHeaderMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors text-left">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#9ca3af]"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            Search in Chat
                          </button>
                          <button onClick={() => { setShowAddMembers(true); setShowGrpHeaderMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors text-left">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#9ca3af]"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/><line x1="19" y1="8" x2="19" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="22" y1="11" x2="16" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            Add Members
                          </button>
                          <div className="h-px bg-[#f3f4f6] my-1" />
                          <button onClick={() => { setShowLeaveConfirm(true); setShowGrpHeaderMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors text-left">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#9ca3af]"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            Leave Group
                          </button>
                          {members.find(m => m.id === currentUserId)?.role === 'Owner' && (
                            <button onClick={() => { setShowDeleteConfirm(true); setShowGrpHeaderMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors text-left">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-red-400"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              Delete Group
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Group search bar */}
                {showGroupSearch && (
                  <div className="bg-white border-b border-[#e5e7eb] px-4 py-2 flex items-center gap-2 shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#9ca3af] shrink-0"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    <input
                      autoFocus
                      type="text"
                      value={groupSearchQuery}
                      onChange={e => setGroupSearchQuery(e.target.value)}
                      placeholder="Search in conversation…"
                      className="flex-1 text-[14px] text-[#18191c] placeholder:text-[#9ca3af] bg-transparent focus:outline-none"
                    />
                    {groupSearchQuery && (
                      <span className="text-[12px] text-[#9ca3af] shrink-0">
                        {groupMatchIds.length > 0 ? `${groupMatchIds.length - groupSearchIdx} of ${groupMatchIds.length}` : "0 found"}
                      </span>
                    )}
                    {groupSearchQuery && groupMatchIds.length > 0 && (
                      <>
                        <button onClick={groupSearchPrev} className="text-[#9ca3af] hover:text-[#f77f00] transition-colors shrink-0 p-0.5" title="Previous match">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
                        </button>
                        <button onClick={groupSearchNext} className="text-[#9ca3af] hover:text-[#f77f00] transition-colors shrink-0 p-0.5" title="Next match">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                      </>
                    )}
                    <button onClick={() => { setShowGroupSearch(false); setGroupSearchQuery(""); }} className="text-[#9ca3af] hover:text-[#374151] transition-colors shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                )}

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-2">
                  {groupMsgLoading && (
                    <div className="flex flex-col gap-3 w-full">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                          <div className={`h-9 rounded-2xl bg-[#f2f2f3] animate-pulse ${i % 2 === 0 ? "w-48" : "w-36"}`} />
                        </div>
                      ))}
                    </div>
                  )}
                  {!groupMsgLoading && currentGroupMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <p className="text-[14px] text-[#9ca3af]">No messages yet. Start the conversation!</p>
                    </div>
                  )}
                  {currentGroupMessages.map((msg) => {
                    const isSent = msg.sender === "me";

                    // Deleted message
                    if (msg.deleted) {
                      return (
                        <div key={msg.id} className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
                          <div className={`px-4 py-2 rounded-2xl italic text-[13px] text-[#9ca3af] border border-dashed border-[#e5e7eb] ${isSent ? "bg-[#fafafa]" : "bg-white"}`}>
                            This message was deleted
                          </div>
                        </div>
                      );
                    }

                    // Shared three-dot button (used by all message types)
                    const GrpMenuBtn = () => (
                      <button
                        onClick={(e) => openGrpMenu(e, msg.id, isSent)}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-white border border-[#e5e7eb] flex items-center justify-center text-[#9ca3af] hover:text-[#f77f00] hover:border-[#f77f00] transition-colors shrink-0"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
                      </button>
                    );

                    // Audio message
                    if (msg.audioUrl) {
                      return (
                        <div key={msg.id} className={`flex items-center gap-1.5 group ${isSent ? "justify-end" : "justify-start"}`}>
                          {!isSent && <GrpMenuBtn />}
                          <AudioBubble msgId={msg.id} audioUrl={msg.audioUrl} waveform={msg.waveform ?? []} audioDuration={msg.audioDuration ?? 0} isSent={isSent} isPlaying={playingMsgId === msg.id} playProgress={playProgress} onToggle={toggleMsgPlay} />
                          {isSent && <GrpMenuBtn />}
                        </div>
                      );
                    }

                    // Attachment (image / file)
                    if (msg.type === "attachment") {
                      const isImg = msg.attachmentMime?.startsWith("image/");
                      return (
                        <div key={msg.id} data-grp-msg-id={msg.id} className={`flex flex-col ${isSent ? "items-end" : "items-start"} group`}>
                          {!isSent && msg.senderName && <p className="text-[11px] font-medium text-[#9ca3af] mb-0.5 px-1">{msg.senderName}</p>}
                          <div className={`flex items-center gap-1.5 ${isSent ? "flex-row-reverse" : ""}`}>
                            <div className={`max-w-[260px] rounded-2xl overflow-hidden ${isSent ? "rounded-tr-sm" : "rounded-tl-sm"}`}>
                              {isImg ? (
                                <button onClick={() => setLightboxMsg(msg)} className="block w-full">
                                  <img src={msg.attachmentUrl} alt={msg.attachmentName} className="max-w-[260px] max-h-[260px] object-cover rounded-2xl" onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.4'; }} />
                                </button>
                              ) : (
                                <a href={msg.attachmentUrl} download={msg.attachmentName} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 px-4 py-3 ${isSent ? "bg-[#ffeacc]" : "bg-white border border-[#e5e7eb]"}`}>
                                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-[#f77f00] shrink-0"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5"/></svg>
                                  <div className="min-w-0">
                                    <p className="text-[13px] font-medium text-[#18191c] truncate max-w-[160px]">{msg.attachmentName}</p>
                                    <p className="text-[11px] text-[#9ca3af]">Tap to download</p>
                                  </div>
                                </a>
                              )}
                            </div>
                            <GrpMenuBtn />
                          </div>
                          <p className="text-[11px] text-[#9ca3af] mt-0.5 px-1">{msg.time}</p>
                        </div>
                      );
                    }

                    // Text / sticker message
                    return (
                      <div key={msg.id} data-grp-msg-id={msg.id} className={`flex flex-col ${isSent ? "items-end" : "items-start"} group`}>
                        {!isSent && msg.senderName && (
                          <p className="text-[11px] font-medium text-[#9ca3af] mb-0.5 px-1">{msg.senderName}</p>
                        )}
                        {editingGrpMsgId === msg.id ? (
                          <div className="flex items-center gap-2 max-w-[45%]">
                            <input
                              autoFocus
                              value={editGrpDraft}
                              onChange={(e) => setEditGrpDraft(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') saveGroupEdit(msg.id); if (e.key === 'Escape') setEditingGrpMsgId(null); }}
                              className="flex-1 border border-[#f77f00] rounded-xl px-3 py-2 text-[14px] focus:outline-none"
                            />
                            <button onClick={() => saveGroupEdit(msg.id)} className="text-[#22c55e] p-1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg></button>
                            <button onClick={() => setEditingGrpMsgId(null)} className="text-[#9ca3af] p-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                          </div>
                        ) : (
                          <div className={`flex items-center gap-1.5 ${isSent ? "flex-row-reverse" : ""}`}>
                            <div className={`max-w-[55%] min-w-0 px-4 py-2.5 rounded-2xl ${isSent ? "bg-[#ffeacc] rounded-tr-sm" : "bg-white border border-[#e5e7eb] rounded-tl-sm"} ${msg.sticker ? "!bg-transparent !border-none !px-1 !py-1" : ""}`}>
                              <p className={`leading-snug whitespace-pre-wrap ${msg.sticker ? "text-[40px]" : "text-[14px] text-[#18191c]"}`} style={{ overflowWrap: "anywhere" }}>{highlightText(msg.text ?? "", groupSearchQuery, groupMatchIds[groupSearchIdx] === msg.id)}</p>
                              {!msg.sticker && <p className={`text-[11px] mt-0.5 ${isSent ? "text-right" : ""} text-[#9ca3af]`}>{msg.time}{msg.edited ? ' · edited' : ''}</p>}
                            </div>
                            {!msg.sticker && <GrpMenuBtn />}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={groupMessagesEndRef} />
                </div>

                {/* Input emoji picker */}
                {showInputEmoji && inputEmojiPos && (
                  <div ref={inputEmojiPickerRef} className="fixed z-[200]" style={{ top: inputEmojiPos.top, left: inputEmojiPos.left }}>
                    <EmojiPicker onSelect={appendEmoji} />
                  </div>
                )}

                {/* Sticker panel */}
                {showStickerPanel && stickerPanelPos && (
                  <div ref={stickerPanelRef} className="fixed z-[200]" style={{ top: stickerPanelPos.top, left: stickerPanelPos.left }}>
                    <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-[#e5e7eb] w-[288px] p-3">
                      <p className="text-[13px] font-semibold text-[#374151] mb-2 px-1">Stickers</p>
                      <div className="grid grid-cols-6 gap-1">
                        {["🥰","😂","😎","🥳","😭","🤩","👍","❤️","🙏","🎉","🔥","💯","😅","🤔","😤","🥺","😴","🤯","👋","✨","🎊","💪","🫂","😇"].map((s) => (
                          <button key={s} onClick={() => sendGroupSticker(s)} className="w-10 h-10 flex items-center justify-center text-[28px] rounded-xl hover:bg-[#f5f5f5] transition-colors">{s}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Group message context menu */}
                {grpMenuMsgId && grpMenuPos && (() => {
                  const msg = currentGroupMessages.find(m => m.id === grpMenuMsgId);
                  if (!msg) return null;
                  return (
                    <div ref={grpMenuRef} className="fixed z-[200]" style={{ top: grpMenuPos.top, left: grpMenuPos.left }}>
                      <MessageContextMenu
                        msg={msg}
                        onClose={() => setGrpMenuMsgId(null)}
                        onEdit={(m) => { setEditingGrpMsgId(m.id); setEditGrpDraft(m.text ?? ""); setGrpMenuMsgId(null); }}
                        onReply={(m) => { setReplyToGrpMsg(m); setGrpMenuMsgId(null); }}
                        onDeleteRequest={(m) => { setDeleteGrpConfirmMsg(m); setGrpMenuMsgId(null); }}
                      />
                    </div>
                  );
                })()}

                {/* Group reply bar */}
                {replyToGrpMsg && (
                  <div className="flex items-center gap-3 px-4 py-2 bg-[#fff6ed] border-t border-[#f77f00]/20">
                    <div className="w-0.5 h-8 bg-[#f77f00] rounded-full shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-[#f77f00] mb-0.5">
                        {replyToGrpMsg.sender === "me" ? "You" : (replyToGrpMsg.senderName ?? "Member")}
                      </p>
                      <p className="text-[12px] text-[#9ca3af] truncate">{replyToGrpMsg.text ?? (replyToGrpMsg.audioUrl ? "Voice message" : "Attachment")}</p>
                    </div>
                    <button onClick={() => setReplyToGrpMsg(null)} className="shrink-0 text-[#9ca3af] hover:text-[#374151] transition-colors p-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                )}

                {/* Input bar */}
                <div className="bg-white border-t border-[#e5e7eb] px-4 py-3">
                  <input ref={grpFileInputRef} type="file" className="hidden" multiple accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.txt" onChange={handleGroupFileSelect} />
                  <div className="border border-[#e5e7eb] rounded-2xl overflow-hidden">
                    {!isRecording && !recordedUrl && (
                      <textarea ref={textareaRef} rows={1} value={draft} onChange={(e) => { setDraft(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }} onKeyDown={handleGroupKeyDown} placeholder="Type your message..." className="w-full px-4 pt-3 pb-2 bg-transparent text-[14px] text-[#18191c] placeholder:text-[#9ca3af] focus:outline-none resize-none overflow-hidden leading-relaxed" />
                    )}
                    {isRecording && (
                      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full shrink-0 animate-pulse" />
                        <span className="text-[14px] text-red-500 font-medium flex-1 tabular-nums">Recording… {String(Math.floor(recordingSeconds / 60)).padStart(2, "0")}:{String(recordingSeconds % 60).padStart(2, "0")}</span>
                      </div>
                    )}
                    {recordedUrl && (
                      <div className="flex items-center gap-3 px-3 pt-3 pb-2">
                        <button onClick={togglePreviewPlay} className="w-8 h-8 rounded-full bg-[#f77f00] flex items-center justify-center shrink-0 hover:bg-[#e06c00] transition-colors">
                          {isPreviewPlaying ? <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg> : <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
                        </button>
                        <div className="flex items-center gap-[2px] flex-1 h-8">
                          {previewWaveform.map((h, i) => { const lit = isPreviewPlaying && (i / previewWaveform.length) < previewProgress; return <div key={i} className="rounded-full transition-colors" style={{ width: 3, height: `${Math.max(4, h)}px`, backgroundColor: lit ? "#f77f00" : "#fcd2a0" }} />; })}
                        </div>
                        <span className="text-[12px] text-[#f77f00] font-medium tabular-nums shrink-0">{isPreviewPlaying ? formatDuration(Math.round(recordedDuration * previewProgress)) : formatDuration(recordedDuration)}</span>
                        <button onClick={discardRecording} className="shrink-0 text-[#9ca3af] hover:text-red-500 transition-colors p-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                      </div>
                    )}
                    <div className="flex items-center justify-between px-3 pb-2.5 pt-1 border-t border-[#f3f4f6]">
                      {recordedUrl ? <p className="text-[12px] text-[#9ca3af] pl-1">Voice message ready</p> : (
                        <div className="flex items-center gap-1 text-[#9ca3af]">
                          <button onClick={() => grpFileInputRef.current?.click()} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f5f5] hover:text-[#f77f00] transition-colors" title="Attach file"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button>
                          <button onClick={toggleRecording} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isRecording ? "bg-red-50 text-red-500 hover:bg-red-100" : "hover:bg-[#f5f5f5] hover:text-[#f77f00]"}`}>{isRecording ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5"/><path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}</button>
                          <button onClick={openInputEmojiPicker} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${showInputEmoji ? "bg-[#fff6ed] text-[#f77f00]" : "hover:bg-[#f5f5f5] hover:text-[#f77f00]"}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M8 13s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><line x1="9" y1="9" x2="9.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="15" y1="9" x2="15.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
                          <button onClick={openStickerPanel} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${showStickerPanel ? "bg-[#fff6ed] text-[#f77f00]" : "hover:bg-[#f5f5f5] hover:text-[#f77f00]"}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2v-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 2l7 7M13 2v7h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                        </div>
                      )}
                      <button onClick={sendGroupMessage} className="w-9 h-9 rounded-full bg-[#f77f00] flex items-center justify-center hover:bg-[#e06c00] transition-colors shrink-0"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Info sidebar ── */}
              {showGroupInfo && (
              <div className="w-[340px] shrink-0 bg-white border-l border-[#e5e7eb] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="bg-white border-b border-[#f5f5f5] h-[64px] flex items-center gap-3 px-4 shrink-0">
                  <button onClick={() => setShowGroupInfo(false)} className="text-[#9ca3af] hover:text-[#374151] transition-colors p-1 shrink-0" aria-label="Close">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                  <p className="font-bold text-[20px] text-[#141414]">Group Info</p>
                </div>

                {/* Profile */}
                <div className="flex flex-col items-center px-5 pt-7 pb-5 border-b border-[#f5f5f5]">
                  <div className="w-[88px] h-[88px] rounded-full flex items-center justify-center text-white font-bold text-[28px]" style={{ backgroundColor: activeGroup.avatarColor }}>
                    {activeGroup.initials}
                  </div>
                  {editingGroupName ? (
                    <div className="mt-3 flex items-center gap-2 w-full max-w-[240px]">
                      <input
                        autoFocus
                        value={groupNameDraft}
                        onChange={(e) => setGroupNameDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveGroupName(); if (e.key === 'Escape') setEditingGroupName(false); }}
                        className="flex-1 text-[15px] font-bold text-[#141414] border-b-2 border-[#f77f00] bg-transparent focus:outline-none text-center"
                        maxLength={80}
                      />
                      <button onClick={saveGroupName} disabled={groupNameSaving} className="text-[#22c55e] hover:text-[#16a34a] shrink-0 p-1 transition-colors">
                        {groupNameSaving ? <span className="text-[12px]">…</span> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
                      </button>
                      <button onClick={() => setEditingGroupName(false)} className="text-[#9ca3af] hover:text-[#374151] shrink-0 p-1 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setGroupNameDraft(activeGroup.name); setEditingGroupName(true); }}
                      className="mt-3 font-bold text-[16px] text-[#141414] hover:text-[#f77f00] transition-colors text-center leading-snug group flex items-center gap-1.5"
                      title="Edit group name"
                    >
                      {activeGroup.name}
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-[#9ca3af] group-hover:text-[#f77f00] shrink-0"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  )}
                  <p className="text-[13px] text-[#9ca3af] mt-0.5">{activeGroup.members} Members</p>
                </div>

                {/* Actions — hidden when Add Members panel is open */}
                {!showAddMembers && (<>
                <div className="border-b border-[#f5f5f5]">
                  <button onClick={() => { setShowAddMembers(true); setAddMemberSelected([]); setAddMemberSearch(""); }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#fff6ed] transition-colors text-left">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-[#f77f00] shrink-0"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/><circle cx="19" cy="8" r="3.5" fill="white"/><line x1="19" y1="6" x2="19" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="17" y1="8" x2="21" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    <span className="text-[15px] text-[#ff9400] font-normal">Add Members</span>
                  </button>
                  <button onClick={() => setShowLeaveConfirm(true)} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 transition-colors text-left">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-[#f44649] shrink-0"><path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5a2 2 0 00-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" fill="currentColor"/></svg>
                    <span className="text-[15px] text-[#f44649] font-normal">Leave Group</span>
                  </button>
                  <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 transition-colors text-left">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-[#f44649] shrink-0"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
                    <span className="text-[15px] text-[#f44649] font-normal">Delete and Exit</span>
                  </button>
                </div>

                {/* Members tabs */}
                <div className="flex border-b border-[#e5e7eb] shrink-0">
                  <button onClick={() => setGroupInfoTab("members")} className={`flex-1 py-2.5 text-[13px] font-medium transition-colors border-b-2 ${groupInfoTab === "members" ? "text-[#f77f00] border-[#f77f00]" : "text-[#9ca3af] border-transparent hover:text-[#374151]"}`}>Members ({members.length})</button>
                  <button onClick={() => setGroupInfoTab("banned")} className={`flex-1 py-2.5 text-[13px] font-medium transition-colors border-b-2 ${groupInfoTab === "banned" ? "text-[#f77f00] border-[#f77f00]" : "text-[#9ca3af] border-transparent hover:text-[#374151]"}`}>Banned</button>
                </div>

                {/* Members search */}
                <div className="px-4 py-2.5 shrink-0">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    <input type="search" value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search members" className="w-full pl-8 pr-3 py-1.5 rounded-full bg-[#f5f5f5] text-[13px] text-[#374151] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#f77f00] transition-colors" />
                  </div>
                </div>

                {/* Members list */}
                <div className="flex-1 overflow-y-auto">
                  {groupInfoTab === "members" ? (
                    groupMembersLoading ? (
                      [1,2,3].map(i => (
                        <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#f5f5f5]">
                          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse shrink-0" />
                          <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse" />
                        </div>
                      ))
                    ) : filteredMembers.length === 0 ? (
                      <p className="text-center text-[13px] text-[#9ca3af] py-6">No members found</p>
                    ) : filteredMembers.map(member => {
                      const isOwner = member.role === 'Owner';
                      const iMe = member.id === currentUserId;
                      const amOwner = members.find(m => m.id === currentUserId)?.role === 'Owner';
                      return (
                        <div key={member.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#f5f5f5] hover:bg-[#fafafa] transition-colors group">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-[13px] shrink-0" style={{ backgroundColor: member.avatarColor }}>
                            {member.initials}
                          </div>
                          <p className="flex-1 font-medium text-[14px] text-[#141414] truncate">{member.name}{iMe ? ' (You)' : ''}</p>
                          {isOwner && <span className="shrink-0 bg-[#ff9400] text-white text-[11px] font-normal px-2.5 py-0.5 rounded-full">Owner</span>}
                          {(member.role === 'Admin' || member.role === 'Moderator') && <span className="shrink-0 border border-[#ff9400] text-[#ff9400] text-[11px] font-normal px-2.5 py-0.5 rounded-full">{member.role}</span>}
                          {amOwner && !iMe && !isOwner && (
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="shrink-0 opacity-0 group-hover:opacity-100 text-[#9ca3af] hover:text-[#f44649] transition-all p-1"
                              title="Remove from group"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-[13px] text-[#9ca3af] py-6">No banned members</p>
                  )}
                </div>
                </>)}

                {/* Add Members panel — filters out existing members */}
                {showAddMembers && (
                  <AddMembersPanel
                    contacts={realUsers
                      .filter((u) => !(members ?? []).some((m) => m.id === u.id))
                      .map((u) => ({ id: u.id, name: u.name, initials: u.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(), avatarColor: colorFromId(u.id) }))}
                    selected={addMemberSelected}
                    search={addMemberSearch}
                    onSearchChange={setAddMemberSearch}
                    onToggle={toggleAddMember}
                    onBack={() => { setShowAddMembers(false); setAddMembersError(""); }}
                    onAdd={handleAddMembers}
                    loading={addMembersLoading}
                    error={addMembersError}
                  />
                )}
              </div>
              )}

            </div>
            );
          })()}

          {/* Default empty states */}
          {((activeTab === "chats" && !activeChat) ||
            (activeTab === "calls" && !activeCall) ||
            activeTab === "users" ||
            (activeTab === "groups" && !activeGroup)) && (
            <RightEmptyState tab={activeTab} />
          )}
        </div>
      </div>

      {/* Delete confirm modal (DM) */}
      {deleteConfirmMsg && (
        <DeleteConfirmModal
          msg={deleteConfirmMsg}
          onDeleteForMe={() => deleteForMe(deleteConfirmMsg.id)}
          onDeleteForEveryone={() => deleteForEveryone(deleteConfirmMsg.id)}
          onCancel={() => setDeleteConfirmMsg(null)}
        />
      )}

      {/* Delete confirm modal (Group message) */}
      {deleteGrpConfirmMsg && (
        <div className="fixed inset-0 bg-black/40 z-[500] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-[340px] shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-[#e5e7eb]">
              <p className="font-bold text-[17px] text-[#18191c]">Delete Message?</p>
              <p className="text-[13px] text-[#9ca3af] mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex flex-col">
              <button onClick={() => deleteGroupMsgForMe(deleteGrpConfirmMsg.id)} className="px-6 py-3.5 text-[14px] text-[#374151] hover:bg-[#f9fafb] text-left transition-colors border-b border-[#f3f4f6]">Delete for me</button>
              <button onClick={() => deleteGroupMsgForEveryone(deleteGrpConfirmMsg.id)} className="px-6 py-3.5 text-[14px] text-[#f44649] font-medium hover:bg-red-50 text-left transition-colors border-b border-[#f3f4f6]">Delete for everyone</button>
              <button onClick={() => setDeleteGrpConfirmMsg(null)} className="px-6 py-3.5 text-[14px] text-[#9ca3af] hover:bg-[#f9fafb] text-left transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* New Group Modal */}
      {showNewGroupModal && (
        <div className="fixed inset-0 bg-black/40 z-[500] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-[420px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] shrink-0">
              <p className="font-bold text-[17px] text-[#18191c]">Create New Group</p>
              <button onClick={() => { setShowNewGroupModal(false); setNewGroupName(""); setCreateGroupError(""); setAddMemberSelected([]); }} className="text-[#9ca3af] hover:text-[#374151] transition-colors p-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Group name */}
              <div className="px-6 pt-5 pb-4">
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Group Name <span className="text-[#f44649]">*</span></label>
                <input
                  autoFocus
                  type="text"
                  value={newGroupName}
                  onChange={(e) => { setNewGroupName(e.target.value); setCreateGroupError(""); }}
                  placeholder="e.g. Design Team, Study Group…"
                  maxLength={80}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e5e7eb] text-[14px] text-[#18191c] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#f77f00]/30 focus:border-[#f77f00] transition-colors"
                />
                {createGroupError && <p className="text-[12px] text-[#f44649] mt-1.5">{createGroupError}</p>}
              </div>

              {/* Members */}
              <div className="px-6 pb-4">
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Add Members ({addMemberSelected.length} selected)</label>
                <div className="relative mb-3">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <input type="search" value={addMemberSearch} onChange={(e) => setAddMemberSearch(e.target.value)} placeholder="Search connections…" className="w-full pl-9 pr-4 py-2 rounded-full bg-[#f5f5f5] text-[13px] text-[#374151] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#f77f00] transition-colors" />
                </div>
                <div className="flex flex-col gap-0 max-h-[240px] overflow-y-auto rounded-xl border border-[#e5e7eb]">
                  {realUsers
                    .filter((u) => u.name.toLowerCase().includes(addMemberSearch.toLowerCase()))
                    .map((u) => {
                      const initials = u.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
                      const selected = addMemberSelected.includes(u.id);
                      return (
                        <button key={u.id} onClick={() => toggleAddMember(u.id)} className={`flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${selected ? "bg-[#fff6ed]" : "hover:bg-[#f9fafb]"}`}>
                          <Avatar initials={initials} img={u.avatar_url ?? undefined} color={colorFromId(u.id)} size={36} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[14px] text-[#18191c] truncate">{u.name}</p>
                            <p className="text-[12px] text-[#9ca3af]">{u.title || u.company || 'Community member'}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-[#f77f00] border-[#f77f00]" : "border-[#d1d5db]"}`}>
                            {selected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
                          </div>
                        </button>
                      );
                    })
                  }
                  {realUsers.filter((u) => u.name.toLowerCase().includes(addMemberSearch.toLowerCase())).length === 0 && (
                    <p className="text-center text-[13px] text-[#9ca3af] py-6">No connections found</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#e5e7eb] flex items-center justify-between gap-3 shrink-0">
              <button onClick={() => { setShowNewGroupModal(false); setNewGroupName(""); setCreateGroupError(""); setAddMemberSelected([]); setAddMemberSearch(""); }} className="px-5 py-2 rounded-xl border border-[#e5e7eb] text-[14px] text-[#374151] hover:bg-[#f5f5f5] transition-colors">Cancel</button>
              <button
                onClick={async () => {
                  if (!newGroupName.trim()) { setCreateGroupError("Group name is required."); return; }
                  setCreateGroupLoading(true); setCreateGroupError("");
                  try {
                    const newGroup = await apiCreateGroup(newGroupName.trim(), addMemberSelected);
                    setGroups((prev) => [dbGroupToLocal(newGroup), ...prev]);
                    setActiveGroupId(newGroup.id);
                    setActiveTab("groups");
                    setShowNewGroupModal(false);
                    setNewGroupName("");
                    setAddMemberSelected([]);
                    setAddMemberSearch("");
                  } catch (err) {
                    setCreateGroupError(err instanceof Error ? err.message : "Failed to create group.");
                  } finally {
                    setCreateGroupLoading(false);
                  }
                }}
                disabled={createGroupLoading || !newGroupName.trim()}
                className="flex-1 px-5 py-2 rounded-xl bg-[#f77f00] text-white text-[14px] font-semibold hover:bg-[#e06c00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createGroupLoading ? "Creating…" : `Create Group${addMemberSelected.length > 0 ? ` (${addMemberSelected.length + 1})` : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image lightbox */}
      {lightboxMsg && (
        <div
          className="fixed inset-0 z-[500] bg-black/85 flex flex-col"
          onClick={() => setLightboxMsg(null)}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <Avatar
                initials={lightboxMsg.sender === "me" ? "Me" : activeChat?.initials}
                color={lightboxMsg.sender === "me" ? "#f77f00" : activeChat?.avatarColor}
                img={lightboxMsg.sender !== "me" ? activeChat?.avatarImg : undefined}
                size={40}
              />
              <div>
                <p className="text-white font-semibold text-[15px]">
                  {lightboxMsg.sender === "me" ? "You" : activeChat?.name}
                </p>
                <p className="text-[#9ca3af] text-[12px]">
                  {new Date().toLocaleDateString("en-GB")} at {lightboxMsg.time}
                </p>
              </div>
            </div>
            <button
              onClick={() => setLightboxMsg(null)}
              className="text-white/70 hover:text-white transition-colors p-2"
              aria-label="Close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          {/* Media */}
          <div className="flex-1 flex items-center justify-center px-6 pb-6 min-h-0" onClick={(e) => e.stopPropagation()}>
            {lightboxMsg.attachmentMime?.startsWith("video/") ? (
              <video
                src={lightboxMsg.attachmentUrl}
                controls
                autoPlay
                className="max-w-full max-h-full rounded-xl shadow-2xl"
              />
            ) : (
              <img
                src={lightboxMsg.attachmentUrl}
                alt={lightboxMsg.attachmentName}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              />
            )}
          </div>
        </div>
      )}

      {/* Incoming call modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/50 z-[450] flex items-center justify-center">
          <div className="bg-white rounded-[28px] w-[340px] flex flex-col items-center gap-5 p-7 shadow-2xl">
            {/* Pulsing avatar */}
            <div className="relative flex items-center justify-center w-[110px] h-[110px]">
              <div className="absolute w-[110px] h-[110px] rounded-full animate-ping opacity-20"
                style={{ backgroundColor: incomingCall.callerAvatarColor }} />
              <div className="absolute w-[95px] h-[95px] rounded-full animate-ping opacity-10 [animation-delay:0.4s]"
                style={{ backgroundColor: incomingCall.callerAvatarColor }} />
              <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center text-white text-3xl font-bold relative z-10 shadow-lg"
                style={{ backgroundColor: incomingCall.callerAvatarColor }}>
                {incomingCall.callerAvatarImg ? (
                  <img src={incomingCall.callerAvatarImg} alt={incomingCall.callerName} className="w-full h-full object-cover rounded-full" />
                ) : incomingCall.callerInitials}
              </div>
            </div>
            <div className="text-center">
              <p className="font-bold text-[22px] text-[#141414]">{incomingCall.callerName}</p>
              <p className="text-[14px] text-[#9ca3af] mt-1">{incomingCall.isVideo ? "Incoming video call..." : "Incoming call..."}</p>
            </div>
            <div className="flex items-center gap-10">
              {/* Decline */}
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={declineCall}
                  className="w-[60px] h-[60px] rounded-full bg-[#f44649] flex items-center justify-center hover:bg-[#d93d40] transition-colors shadow-lg"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                    <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.27 11.36 11.36 0 003.54.56 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.56 3.54 1 1 0 01-.27 1.11z" transform="rotate(135 12 12)"/>
                  </svg>
                </button>
                <span className="text-[12px] text-[#9ca3af]">Decline</span>
              </div>
              {/* Accept */}
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={acceptCall}
                  className="w-[60px] h-[60px] rounded-full bg-[#22c55e] flex items-center justify-center hover:bg-[#16a34a] transition-colors shadow-lg"
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 015.13 12.8 19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                </button>
                <span className="text-[12px] text-[#9ca3af]">Accept</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calling overlay */}
      {callOverlay && (
        <div className="fixed inset-0 bg-black/40 z-[400] flex items-center justify-center">
          <div className="bg-white rounded-[24px] w-[380px] flex flex-col items-center gap-0 shadow-2xl border border-[#e8e8e8] overflow-hidden" style={{ height: 560 }}>

            {/* Top bar */}
            <div className="w-full flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
              <span className="text-[13px] font-semibold text-[#9ca3af] uppercase tracking-wide">
                {callOverlay.isVideo ? "Video Call" : "Voice Call"}
              </span>
              {webrtcState === 'active' && (
                <span className="text-[15px] font-mono font-bold text-[#f77f00]">
                  {String(Math.floor(callSeconds / 60)).padStart(2, '0')}:{String(callSeconds % 60).padStart(2, '0')}
                </span>
              )}
            </div>

            {/* Video / audio / error content */}
            <div className="flex-1 flex items-center justify-center w-full relative">
              {webrtcState === 'permission_denied' ? (
                /* ── Permission denied ── */
                <div className="flex flex-col items-center gap-3 px-6">
                  <div className="w-[80px] h-[80px] rounded-full bg-red-100 flex items-center justify-center">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-red-500">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                      <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="16" r="1" fill="currentColor"/>
                    </svg>
                  </div>
                  <p className="text-[13px] text-[#6b7280] text-center leading-relaxed">
                    {callOverlay.isVideo ? 'Camera and microphone' : 'Microphone'} access was denied.<br/>
                    Allow access in your browser settings and try again.
                  </p>
                </div>
              ) : callOverlay.isVideo ? (
                /* ── Video call ── */
                <div className="relative w-full h-full bg-[#0f0f1a]">
                  {/* Remote video: visible once active */}
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover transition-opacity duration-300 ${webrtcState === 'active' ? 'opacity-100' : 'opacity-0'}`}
                  />
                  {/* Waiting placeholder */}
                  {webrtcState !== 'active' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-bold animate-pulse"
                        style={{ backgroundColor: callOverlay.avatarColor }}>
                        {callOverlay.initials}
                      </div>
                      {webrtcState === 'ended' && callEndReason && (
                        <span className="text-white/70 text-[13px]">{callEndReasonText(callEndReason)}</span>
                      )}
                    </div>
                  )}
                  {/* Local camera PIP */}
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="absolute bottom-3 right-3 w-24 h-32 rounded-xl object-cover border-2 border-white/80 shadow-lg bg-black"
                  />
                </div>
              ) : (
                /* ── Audio call ── */
                <div className="relative flex items-center justify-center">
                  {/* Hidden video element plays remote audio */}
                  <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />
                  {/* Pulsing rings */}
                  <div className="absolute w-[200px] h-[200px] rounded-full animate-ping opacity-20"
                    style={{ backgroundColor: callOverlay.avatarColor }} />
                  <div className="absolute w-[175px] h-[175px] rounded-full animate-ping opacity-10 [animation-delay:0.3s]"
                    style={{ backgroundColor: callOverlay.avatarColor }} />
                  <div className="w-[150px] h-[150px] rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-lg relative z-10"
                    style={{ backgroundColor: callOverlay.avatarImg ? undefined : callOverlay.avatarColor }}>
                    {callOverlay.avatarImg ? (
                      <img src={callOverlay.avatarImg} alt={callOverlay.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[56px] font-bold text-white leading-none">{callOverlay.initials}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Name + status */}
            <div className="flex flex-col items-center gap-1 pb-2 shrink-0">
              <p className="text-[22px] font-bold text-[#141414]">{callOverlay.name}</p>
              <p className={`text-[13px] ${webrtcState === 'ended' && callEndReason && callEndReason !== 'hangup' && callEndReason !== 'remote_ended' ? 'text-[#f44649]' : 'text-[#9ca3af]'}`}>
                {callHeld ? 'On Hold'
                  : webrtcState === 'active' ? 'Connected'
                  : webrtcState === 'connecting' ? 'Connecting...'
                  : webrtcState === 'ringing' ? 'Ringing...'
                  : webrtcState === 'permission_denied' ? 'Permission Denied'
                  : webrtcState === 'ended' && callEndReason ? callEndReasonText(callEndReason)
                  : 'Calling...'}
              </p>
            </div>

            {/* Action buttons — hide while showing end-reason or permission error */}
            <div className={`flex items-center justify-center gap-6 py-5 shrink-0 ${webrtcState === 'ended' || webrtcState === 'permission_denied' ? 'opacity-0 pointer-events-none' : ''}`}>
              {/* Mute */}
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={toggleMute}
                  className={`w-[54px] h-[54px] rounded-full flex items-center justify-center transition-all ${callMuted ? "bg-[#f77f00] text-white shadow-md" : "bg-[#f3f4f6] text-[#374151] hover:bg-[#e5e7eb]"}`}
                  aria-label={callMuted ? "Unmute" : "Mute"}
                >
                  {callMuted ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" fill="currentColor"/>
                      <path d="M19 10v2a7 7 0 01-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" fill="currentColor"/>
                      <path d="M19 10v2a7 7 0 01-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  )}
                </button>
                <span className="text-[11px] text-[#9ca3af]">{callMuted ? "Unmute" : "Mute"}</span>
              </div>

              {/* End call */}
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={handleEndCall}
                  className="w-[64px] h-[64px] rounded-full bg-[#f44649] flex items-center justify-center hover:bg-[#d93d40] transition-colors shadow-lg"
                  aria-label="End call"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                    <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.27 11.36 11.36 0 003.54.56 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.56 3.54 1 1 0 01-.27 1.11z" transform="rotate(135 12 12)"/>
                  </svg>
                </button>
                <span className="text-[11px] text-[#9ca3af]">End</span>
              </div>

              {/* Hold */}
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={() => setCallHeld((v) => !v)}
                  className={`w-[54px] h-[54px] rounded-full flex items-center justify-center transition-all ${callHeld ? "bg-[#f77f00] text-white shadow-md" : "bg-[#f3f4f6] text-[#374151] hover:bg-[#e5e7eb]"}`}
                  aria-label={callHeld ? "Resume" : "Hold"}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="5" width="4" height="14" rx="1.5"/>
                    <rect x="14" y="5" width="4" height="14" rx="1.5"/>
                  </svg>
                </button>
                <span className="text-[11px] text-[#9ca3af]">{callHeld ? "Resume" : "Hold"}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Delete & Exit confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[400px] p-8 flex flex-col items-center shadow-2xl">
            {/* Icon */}
            <div className="w-[80px] h-[80px] rounded-full bg-[#fafafa] flex items-center justify-center mb-5 shrink-0">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-[#f44649]">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
              </svg>
            </div>
            <h2 className="text-[20px] font-semibold text-[#141414] mb-2 text-center">Delete and Exit?</h2>
            <p className="text-[14px] text-[#727272] text-center mb-8 leading-relaxed">
              Are you sure you want to delete this chat and exit the group? This action cannot be undone.
            </p>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-10 rounded-lg border border-[#dcdcdc] text-[14px] font-medium text-[#141414] hover:bg-[#f5f5f5] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                className="flex-1 h-10 rounded-lg bg-[#f44649] text-white text-[14px] font-medium hover:bg-[#d93d40] transition-colors"
              >
                Delete &amp; Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Group confirm modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/40 z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[400px] p-8 flex flex-col items-center shadow-2xl">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[#f44649]">
                <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5a2 2 0 00-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" fill="currentColor"/>
              </svg>
            </div>
            <h2 className="text-[20px] font-bold text-[#18191c] mb-2 text-center">Leave this group?</h2>
            <p className="text-[14px] text-[#6b7280] text-center mb-8 leading-relaxed">
              You won't be able to receive messages from this group anymore.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 py-3 rounded-full border border-[#e5e7eb] text-[15px] font-semibold text-[#374151] hover:bg-[#f5f5f5] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveGroup}
                className="flex-1 py-3 rounded-full bg-[#f44649] text-white text-[15px] font-semibold hover:bg-[#d93d40] transition-colors"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden audio elements */}
      <audio ref={(el) => { sharedAudioRef.current = el; }} className="hidden" />
      <audio ref={(el) => { audioPreviewRef.current = el; }} className="hidden" />

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AudioBubble({
  msgId,
  audioUrl,
  waveform,
  audioDuration,
  isSent,
  isPlaying,
  playProgress,
  onToggle,
}: {
  msgId: string;
  audioUrl: string;
  waveform: number[];
  audioDuration: number;
  isSent: boolean;
  isPlaying: boolean;
  playProgress: number;
  onToggle: (id: string, url: string) => void;
}) {
  const bars = waveform.length ? waveform : Array.from({ length: 40 }, () => 10);
  const elapsed = isPlaying ? Math.round(audioDuration * playProgress) : audioDuration;
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className={`flex items-center gap-2.5 rounded-full px-3 py-2.5 ${isSent ? "bg-[#ffeacc]" : "bg-white border border-[#e5e7eb]"}`}
         style={{ minWidth: 220, maxWidth: 320 }}>
      <button
        onClick={() => onToggle(msgId, audioUrl)}
        className="w-9 h-9 rounded-full bg-[#f77f00] flex items-center justify-center shrink-0 hover:bg-[#e06c00] transition-colors"
      >
        {isPlaying ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <rect x="6" y="5" width="4" height="14" rx="1"/>
            <rect x="14" y="5" width="4" height="14" rx="1"/>
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <polygon points="6 3 20 12 6 21 6 3"/>
          </svg>
        )}
      </button>

      <div className="flex items-center gap-[1.5px] flex-1" style={{ height: 28 }}>
        {bars.map((h, i) => {
          const lit = isPlaying && (i / bars.length) < playProgress;
          return (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: 2.5,
                height: Math.max(3, h),
                backgroundColor: lit ? "#f77f00" : isSent ? "#e8956d" : "#c4b5a5",
                alignSelf: "center",
              }}
            />
          );
        })}
      </div>

      <span className="text-[12px] text-[#9ca3af] shrink-0 tabular-nums" style={{ minWidth: 34 }}>
        {fmt(elapsed)}
      </span>
    </div>
  );
}

function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [activeCat, setActiveCat] = useState("smileys");
  const [search, setSearch] = useState("");

  const category = EMOJI_CATEGORIES.find((c) => c.id === activeCat) ?? EMOJI_CATEGORIES[1];
  const emojis = search
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis).filter((e) => e.includes(search))
    : category.emojis;

  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-[#e5e7eb] w-[320px] overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <p className="text-[15px] font-semibold text-[#374151] mb-3">{search ? "Search results" : category.label}</p>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#f5f5f5] text-[13px] text-[#374151] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#f77f00] transition-colors"
          />
        </div>
      </div>

      <div className="px-3 pb-2 h-[224px] overflow-y-auto">
        <div className="grid grid-cols-8 gap-0.5">
          {emojis.map((emoji, i) => (
            <button
              key={i}
              onClick={() => onSelect(emoji)}
              className="w-9 h-9 flex items-center justify-center text-[22px] rounded-xl hover:bg-[#f5f5f5] transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-[#e5e7eb] flex px-2 py-2">
        {EMOJI_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setActiveCat(cat.id); setSearch(""); }}
            className={`flex-1 flex items-center justify-center h-8 rounded-lg transition-colors ${activeCat === cat.id ? "text-[#f77f00] bg-[#fff6ed]" : "text-[#9ca3af] hover:text-[#374151] hover:bg-[#f5f5f5]"}`}
            title={cat.label}
          >
            {cat.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

const BASE_MENU_ITEMS = [
  { label: "Info",            icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { label: "Copy",            icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { label: "Download",        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>, attachmentOnly: true },
  { label: "Edit",            icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: "Reply in thread", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polyline points="9 17 4 12 9 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 18v-2a4 4 0 00-4-4H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: "Translate",       icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 8l6 6M4 6h7M2 6h2m14 10s-2-2-4-4m4 4s2-2 4-4m-4 4h.01M10 3l-1 2M3 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 21l-6-6m0 0a5 5 0 10-7.07-7.07A5 5 0 0015 15z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { label: "Delete",          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, danger: true },
];

async function downloadAttachment(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename || "download";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, "_blank", "noopener noreferrer");
  }
}

function EditMessageModal({
  draft,
  onChange,
  onSave,
  onClose,
}: {
  draft: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-[480px] sm:rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.18)] border border-[#e5e7eb] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#e5e7eb]">
          <button
            onClick={onClose}
            className="text-[#9ca3af] hover:text-[#374151] transition-colors"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <p className="font-semibold text-[15px] text-[#18191c]">Edit message</p>
        </div>

        {/* Original message preview */}
        <div className="px-5 pt-4 pb-2">
          <div className="bg-[#ffeacc] rounded-2xl rounded-tr-sm px-4 py-3 inline-block max-w-full">
            <p className="text-[14px] text-[#18191c] leading-snug break-words">{draft}</p>
          </div>
        </div>

        {/* Edit area */}
        <div className="px-5 pb-1">
          <div className="relative">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSave(); }
                if (e.key === "Escape") onClose();
              }}
              rows={3}
              className="w-full resize-none text-[14px] text-[#18191c] bg-transparent focus:outline-none py-2 pr-8 leading-relaxed"
            />
            {draft && (
              <button
                onClick={() => onChange("")}
                className="absolute top-2 right-0 text-[#9ca3af] hover:text-[#374151] transition-colors p-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="h-px bg-[#e5e7eb]" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-3">
          <button className="text-[#9ca3af] hover:text-[#f77f00] transition-colors p-1 text-[20px]">😊</button>
          <button
            onClick={onSave}
            className="w-9 h-9 rounded-full bg-[#f77f00] flex items-center justify-center hover:bg-[#e06c00] transition-colors shrink-0"
            aria-label="Save"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageContextMenu({
  msg,
  onClose,
  onEdit,
  onReply,
  onDeleteRequest,
}: {
  msg: Message;
  onClose: () => void;
  onEdit?: (msg: Message) => void;
  onReply?: (msg: Message) => void;
  onDeleteRequest?: (msg: Message) => void;
}) {
  const hasAttachment = !!(msg.attachmentUrl || msg.audioUrl);

  const items = BASE_MENU_ITEMS.filter((item) =>
    !("attachmentOnly" in item && item.attachmentOnly) || hasAttachment
  );

  async function handleItem(label: string) {
    if (label === "Copy" && msg.text) {
      navigator.clipboard.writeText(msg.text).catch(() => {});
    }
    if (label === "Download") {
      const url = msg.attachmentUrl || msg.audioUrl;
      const name = msg.attachmentName || "audio.webm";
      if (url) await downloadAttachment(url, name);
    }
    if (label === "Edit") { onEdit?.(msg); return; }
    if (label === "Reply in thread") { onReply?.(msg); return; }
    if (label === "Delete") { onDeleteRequest?.(msg); return; }
    onClose();
  }

  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.14)] border border-[#e5e7eb] py-1.5 min-w-[188px] overflow-hidden">
      {items.map((item) => {
        const isEditDisabled = item.label === "Edit" && msg.sender !== "me";
        return (
          <button
            key={item.label}
            onClick={() => handleItem(item.label)}
            disabled={isEditDisabled}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors text-left ${
              isEditDisabled ? "opacity-30 cursor-not-allowed" : "hover:bg-[#f9fafb]"
            } ${"danger" in item && item.danger ? "text-red-500 hover:bg-red-50" : "text-[#374151]"}`}
          >
            <span className={"danger" in item && item.danger ? "text-red-400" : "text-[#9ca3af]"}>
              {item.icon}
            </span>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function DeleteConfirmModal({
  msg,
  onDeleteForMe,
  onDeleteForEveryone,
  onCancel,
}: {
  msg: Message;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  onCancel: () => void;
}) {
  const canDeleteForEveryone = msg.sender === "me";
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-2xl w-full max-w-[320px] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b border-[#f3f4f6]">
          <p className="font-bold text-[16px] text-[#18191c] text-center">Delete message?</p>
        </div>
        <div className="py-2">
          {canDeleteForEveryone && (
            <button
              onClick={onDeleteForEveryone}
              className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-red-50 transition-colors text-left"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-red-500 shrink-0">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <div>
                <p className="text-[14px] font-semibold text-red-500">Delete for everyone</p>
                <p className="text-[11px] text-[#9ca3af]">Remove for all participants</p>
              </div>
            </button>
          )}
          <button
            onClick={onDeleteForMe}
            className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-[#f9fafb] transition-colors text-left"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#374151] shrink-0">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <div>
              <p className="text-[14px] font-semibold text-[#374151]">Delete for me</p>
              <p className="text-[11px] text-[#9ca3af]">Remove only from your view</p>
            </div>
          </button>
          <button
            onClick={onCancel}
            className="w-full flex items-center justify-center px-6 py-3.5 border-t border-[#f3f4f6] hover:bg-[#f9fafb] transition-colors"
          >
            <p className="text-[14px] font-semibold text-[#9ca3af]">Cancel</p>
          </button>
        </div>
      </div>
    </div>
  );
}

function TabIcon({ tab, active }: { tab: Tab; active: boolean }) {
  const color = active ? "#f77f00" : "#9ca3af";
  if (tab === "chats") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (tab === "calls") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (tab === "users") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.5" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.5" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChatsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-16 text-center">
      <div className="relative w-24 h-16 mb-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#e5e7eb] flex items-center justify-center"
            style={{ width: 48, height: 48, left: i * 16, top: i * 4, zIndex: i }}
          >
            <div className="w-3 h-3 rounded-full bg-[#9ca3af]" />
          </div>
        ))}
      </div>
      <p className="font-bold text-[16px] text-[#18191c] mb-2">No Conversations Yet</p>
      <p className="text-[13px] text-[#9ca3af] leading-relaxed max-w-[240px]">
        Start a new chat or invite others to join the conversation.
      </p>
    </div>
  );
}

function CallsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-16 text-center">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="text-[#d1d5db] mb-4">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="font-bold text-[16px] text-[#18191c] mb-2">No Call Logs Yet</p>
      <p className="text-[13px] text-[#9ca3af] leading-relaxed max-w-[240px]">
        Make or receive calls to see your call history listed here
      </p>
    </div>
  );
}

function RightEmptyState({ tab }: { tab: Tab }) {
  if (tab === "calls") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" className="text-[#d1d5db] mb-6">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="font-bold text-[18px] text-[#18191c] mb-2">It's nice to talk with someone</p>
        <p className="text-[14px] text-[#9ca3af] max-w-[320px] leading-relaxed">
          Pick a user or group from the left sidebar call list, and start your conversation.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="relative mb-6">
        <svg width="80" height="72" viewBox="0 0 90 80" fill="none">
          <rect x="8" y="16" width="54" height="42" rx="8" fill="#d1d5db" />
          <rect x="28" y="6" width="54" height="42" rx="8" fill="#e5e7eb" />
          <circle cx="55" cy="27" r="6" fill="#d1d5db" />
          <circle cx="55" cy="27" r="2" fill="#9ca3af" />
          <circle cx="65" cy="27" r="2" fill="#9ca3af" />
          <circle cx="75" cy="27" r="2" fill="#9ca3af" />
        </svg>
      </div>
      <p className="font-bold text-[18px] text-[#18191c] mb-2">Welcome to Your Conversations</p>
      <p className="text-[14px] text-[#9ca3af] max-w-[320px] leading-relaxed">
        Select a chat from the list to start exploring your messages or begin a new conversation
      </p>
    </div>
  );
}

function CallDetailView({ call }: { call: CallLog }) {
  const [detailTab, setDetailTab] = useState<"Participants" | "Recording" | "History">("Recording");
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-6 pt-6 pb-4 border-b border-[#e5e7eb]">
        <h2 className="font-bold text-[18px] text-[#18191c] mb-4">Call Detail</h2>
        <div className="flex items-center gap-3">
          <Avatar initials={call.initials} color={call.avatarColor} size={48} />
          <div className="flex-1">
            <p className="font-bold text-[15px] text-[#18191c]">{call.name}</p>
            <p className="text-[12px] text-[#22c55e]">Online</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-lg border border-[#f77f00] text-[#f77f00] flex items-center justify-center hover:bg-[#fff6ed] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button className="w-9 h-9 rounded-lg border border-[#f77f00] text-[#f77f00] flex items-center justify-center hover:bg-[#fff6ed] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polygon points="23 7 16 12 23 17 23 7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Call summary row */}
      <div className="px-6 py-3 border-b border-[#e5e7eb] bg-[#f9fafb] flex items-center gap-3">
        <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
          <path d="M2 10L10 2M10 2H4M10 2v6" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="flex-1">
          <p className="font-semibold text-[14px] text-[#18191c]">Outgoing</p>
          <p className="text-[12px] text-[#9ca3af]">{call.date}</p>
        </div>
        <span className="text-[13px] text-[#9ca3af] font-medium">1:32m</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e5e7eb]">
        {(["Participants", "Recording", "History"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setDetailTab(t)}
            className={`flex-1 py-3 text-[13px] font-semibold transition-colors relative ${detailTab === t ? "text-[#f77f00]" : "text-[#9ca3af] hover:text-[#374151]"}`}
          >
            {t}
            {detailTab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f77f00]" />}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {detailTab === "Recording" && (
          <div className="flex items-center justify-between py-3 border-b border-[#e5e7eb]">
            <div>
              <p className="font-semibold text-[14px] text-[#18191c]">Record1200024</p>
              <p className="text-[12px] text-[#9ca3af]">{call.date}</p>
            </div>
            <div className="flex items-center gap-3 text-[#f77f00]">
              <button className="hover:text-[#e06c00] transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><polygon points="5 3 19 12 5 21 5 3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
              </button>
              <button className="hover:text-[#e06c00] transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </div>
        )}
        {detailTab === "Participants" && (
          <p className="text-[14px] text-[#9ca3af] text-center py-8">No participant data available</p>
        )}
        {detailTab === "History" && (
          <p className="text-[14px] text-[#9ca3af] text-center py-8">No history available</p>
        )}
      </div>
    </div>
  );
}

// ─── Add Members Panel ────────────────────────────────────────────────────────

function AddMembersPanel({
  contacts,
  selected,
  search,
  onSearchChange,
  onToggle,
  onBack,
  onAdd,
  loading = false,
  error = "",
}: {
  contacts: Contact[];
  selected: string[];
  search: string;
  onSearchChange: (v: string) => void;
  onToggle: (id: string) => void;
  onBack: () => void;
  onAdd: () => void;
  loading?: boolean;
  error?: string;
}) {
  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f5f5f5] shrink-0">
        <button
          onClick={onBack}
          className="text-[#9ca3af] hover:text-[#374151] transition-colors p-1 shrink-0"
          aria-label="Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <p className="font-bold text-[17px] text-[#141414]">Add Members</p>
      </div>

      {/* Search */}
      <div className="px-4 py-3 shrink-0">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search contacts"
            className="w-full pl-8 pr-3 py-2 rounded-full bg-[#f5f5f5] text-[13px] text-[#374151] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#f77f00] transition-colors"
          />
        </div>
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-[13px] text-[#9ca3af] py-6">No contacts found</p>
        ) : filtered.map((contact) => {
          const isSelected = selected.includes(contact.id);
          return (
            <button
              key={contact.id}
              onClick={() => onToggle(contact.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#fafafa] transition-colors text-left"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-[13px] shrink-0"
                style={{ backgroundColor: contact.avatarColor }}
              >
                {contact.initials}
              </div>
              <p className="flex-1 font-medium text-[14px] text-[#141414] truncate">{contact.name}</p>
              {/* Orange checkbox */}
              <div
                className={`w-5 h-5 rounded-[4px] shrink-0 border-2 flex items-center justify-center transition-colors ${
                  isSelected ? "bg-[#f77f00] border-[#f77f00]" : "border-[#d1d5db] bg-white"
                }`}
              >
                {isSelected && (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Add button */}
      <div className="px-4 py-3 border-t border-[#f5f5f5] shrink-0">
        {error && <p className="text-[12px] text-red-500 mb-2 text-center">{error}</p>}
        <button
          onClick={onAdd}
          disabled={selected.length === 0 || loading}
          className="w-full py-3 bg-[#f77f00] text-white font-bold rounded-full text-[15px] hover:bg-[#e06c00] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          )}
          {selected.length === 0 ? "Add Members" : `Add ${selected.length} Member${selected.length > 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}
