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

// ─── Mock Data ──────────────────────────────────────────────────────────────

type ChatItem = {
  id: string;
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
  const [groupMessages, setGroupMessages] = useState<Record<string, Message[]>>(MOCK_GROUP_CHAT_MESSAGES);
  const [groupInfoTab, setGroupInfoTab] = useState<"members" | "banned">("members");
  const [memberSearch, setMemberSearch] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");

  // ── Map API conversation → ChatItem ──────────────────────────────────────────
  function convToChat(c: { id: string; peer_name: string; peer_avatar: string | null; last_message: string | null; last_message_at: string | null }): ChatItem {
    const initials = c.peer_name
      .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
    return {
      id: c.id,
      name: c.peer_name,
      initials,
      avatarColor: "#f77f00",
      avatarImg: c.peer_avatar ?? undefined,
      lastMessage: c.last_message ?? "Say hi!",
      lastMessageType: "text",
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

    function updateSidebarPreview(preview: string, at: string) {
      const timeStr = new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setChats((prev) => prev.map((c) =>
        c.id === activeChatId ? { ...c, lastMessage: preview, time: timeStr } : c
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
          const preview = incoming.message_type !== "text" ? `[${incoming.message_type}]` : (incoming.content ?? "");
          updateSidebarPreview(preview, incoming.created_at);
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

  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [replyToMsg, setReplyToMsg] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
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
        c.id === activeChatId ? { ...c, lastMessage: text, time: timeStr } : c
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

  function sendGroupMessage() {
    if (!activeGroupId) return;
    if (recordedUrl) {
      if (audioPreviewRef.current) { audioPreviewRef.current.pause(); audioPreviewRef.current.src = ""; }
      const gid = activeGroupId;
      setGroupMessages(prev => ({
        ...prev,
        [gid]: [...(prev[gid] ?? []), {
          id: `gmsg-${Date.now()}`,
          sender: "me" as const,
          time: nowTime(),
          audioUrl: recordedUrl,
          audioDuration: recordedDuration,
          waveform: previewWaveform,
        }],
      }));
      setRecordedUrl(null); setRecordedDuration(0); setPreviewWaveform([]);
      setIsPreviewPlaying(false); setPreviewProgress(0);
      return;
    }
    const text = draft.trim();
    if (!text) return;
    const gid = activeGroupId;
    setGroupMessages(prev => ({
      ...prev,
      [gid]: [...(prev[gid] ?? []), { id: `gmsg-${Date.now()}`, text, sender: "me" as const, time: nowTime() }],
    }));
    setDraft("");
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; }
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

  const activeChat = chats.find((c) => c.id === activeChatId);
  const activeCall = MOCK_CALLS.find((c) => c.id === activeCallId);
  const activeGroup = MOCK_GROUPS.find((g) => g.id === activeGroupId) ?? null;
  const currentGroupMessages = activeGroupId ? (groupMessages[activeGroupId] ?? []) : [];
  const filteredGroups = MOCK_GROUPS.filter((g) =>
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
              MOCK_CALLS.length === 0 ? (
                <CallsEmptyState />
              ) : (
                <div>
                  {MOCK_CALLS.map((call) => (
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
                {filteredGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setActiveGroupId(group.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f9fafb] transition-colors text-left ${activeGroupId === group.id ? "bg-[#fff6ed]" : ""}`}
                  >
                    <Avatar initials={group.initials} color={group.avatarColor} size={42} online={group.online} />
                    <div className="min-w-0">
                      <p className="font-semibold text-[14px] text-[#18191c] truncate">{group.name}</p>
                      <p className="text-[12px] text-[#9ca3af]">{group.members} Members</p>
                    </div>
                  </button>
                ))}
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
          {activeTab === "chats" && activeChat && (
            <div className="flex flex-col h-full">
              {/* Chat header */}
              <div className="bg-white border-b border-[#e5e7eb] px-5 py-3.5 flex items-center gap-3">
                <Avatar initials={activeChat.initials} color={activeChat.avatarColor} img={activeChat.avatarImg} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[15px] text-[#18191c]">{activeChat.name}</p>
                  <p className="text-[12px] text-[#9ca3af]">{activeChat.time ? `Last seen ${activeChat.time}` : "Community member"}</p>
                </div>
                <div className="flex items-center gap-3 text-[#9ca3af]">
                  <button className="hover:text-[#f77f00] transition-colors p-1" aria-label="Video call">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><polygon points="23 7 16 12 23 17 23 7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" /></svg>
                  </button>
                  <button className="hover:text-[#f77f00] transition-colors p-1" aria-label="Audio call">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <button className="hover:text-[#f77f00] transition-colors p-1" aria-label="Search">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" /><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </button>
                  <button className="hover:text-[#f77f00] transition-colors p-1" aria-label="More">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
                  </button>
                </div>
              </div>

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
                    return (
                      <div key={msg.id} className="flex justify-start">
                        <div className="group flex flex-col items-start max-w-[45%] min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="bg-white border border-[#e5e7eb] rounded-2xl rounded-tl-sm px-4 py-2.5 min-w-0 overflow-hidden">
                              {msg.replyTo && (
                                <div className="border-l-2 border-[#f77f00] pl-2 mb-2 opacity-70">
                                  <p className="text-[10px] font-semibold text-[#f77f00]">{msg.replyTo.sender === "me" ? "You" : activeChat?.name}</p>
                                  <p className="text-[12px] text-[#9ca3af] truncate max-w-[200px]">{msg.replyTo.text}</p>
                                </div>
                              )}
                              <p className="text-[14px] text-[#18191c] leading-snug whitespace-pre-wrap" style={{ overflowWrap: "anywhere" }}>{msg.text}</p>
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
                        </div>
                      </div>
                    );
                  }

                  /* Sent message */
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="group flex flex-col items-end max-w-[45%] min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                            <button onClick={(e) => openMenu(e, msg.id, true)} className="w-7 h-7 rounded-full bg-white border border-[#e5e7eb] flex items-center justify-center text-[#9ca3af] hover:text-[#f77f00] hover:border-[#f77f00] transition-colors">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
                            </button>
                            <button onClick={(e) => openEmojiPicker(e, msg.id, true)} className="w-7 h-7 rounded-full bg-white border border-[#e5e7eb] flex items-center justify-center text-[#9ca3af] hover:text-[#f77f00] hover:border-[#f77f00] transition-colors text-[14px]">😊</button>
                          </div>
                          {msg.sticker ? (
                            <div className="text-[48px] leading-none select-none px-1 py-0.5">{msg.text}</div>
                          ) : (
                            <div className="bg-[#ffeacc] rounded-2xl rounded-tr-sm px-4 py-2.5 min-w-0 overflow-hidden">
                              {msg.replyTo && (
                                <div className="border-l-2 border-[#f77f00] pl-2 mb-2 opacity-70">
                                  <p className="text-[10px] font-semibold text-[#f77f00]">{msg.replyTo.sender === "me" ? "You" : activeChat?.name}</p>
                                  <p className="text-[12px] text-[#9ca3af] truncate max-w-[200px]">{msg.replyTo.text}</p>
                                </div>
                              )}
                              <p className="text-[14px] text-[#18191c] leading-snug whitespace-pre-wrap" style={{ overflowWrap: "anywhere" }}>{msg.text}</p>
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
            </div>
          )}

          {/* Calls: call detail */}
          {activeTab === "calls" && activeCall && (
            <CallDetailView call={activeCall} />
          )}

          {/* Groups: active group chat — chat area + info sidebar */}
          {activeTab === "groups" && activeGroup && (() => {
            const members = MOCK_GROUP_MEMBERS[activeGroupId!] ?? MOCK_GROUP_MEMBERS.default;
            const filteredMembers = members.filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase()));
            return (
            <div className="flex h-full">

              {/* ── Chat column ── */}
              <div className="flex flex-col flex-1 min-w-0">

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-2">
                  {currentGroupMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <p className="text-[14px] text-[#9ca3af]">No messages yet. Start the conversation!</p>
                    </div>
                  )}
                  {currentGroupMessages.map((msg) => {
                    const isSent = msg.sender === "me";
                    if (msg.audioUrl) {
                      return (
                        <div key={msg.id} className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
                          <AudioBubble msgId={msg.id} audioUrl={msg.audioUrl} waveform={msg.waveform ?? []} audioDuration={msg.audioDuration ?? 0} isSent={isSent} isPlaying={playingMsgId === msg.id} playProgress={playProgress} onToggle={toggleMsgPlay} />
                        </div>
                      );
                    }
                    return (
                      <div key={msg.id} className={`flex flex-col ${isSent ? "items-end" : "items-start"}`}>
                        {!isSent && msg.senderName && (
                          <p className="text-[11px] font-medium text-[#9ca3af] mb-0.5 px-1">{msg.senderName}</p>
                        )}
                        <div className={`max-w-[45%] min-w-0 px-4 py-2.5 rounded-2xl ${isSent ? "bg-[#ffeacc] rounded-tr-sm" : "bg-white border border-[#e5e7eb] rounded-tl-sm"}`}>
                          <p className="text-[14px] text-[#18191c] leading-snug whitespace-pre-wrap" style={{ overflowWrap: "anywhere" }}>{msg.text}</p>
                          <p className={`text-[11px] mt-0.5 ${isSent ? "text-right" : ""} text-[#9ca3af]`}>{msg.time}</p>
                        </div>
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
                          <button key={s} onClick={() => { if (!activeGroupId) return; const gid = activeGroupId; setGroupMessages(prev => ({ ...prev, [gid]: [...(prev[gid] ?? []), { id: `gmsg-${Date.now()}`, text: s, sender: "me", time: nowTime(), sticker: true }] })); setShowStickerPanel(false); }} className="w-10 h-10 flex items-center justify-center text-[28px] rounded-xl hover:bg-[#f5f5f5] transition-colors">{s}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Input bar */}
                <div className="bg-white border-t border-[#e5e7eb] px-4 py-3">
                  <input ref={fileInputRef} type="file" className="hidden" multiple accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.txt" onChange={handleFileSelect} />
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
                          <button onClick={() => fileInputRef.current?.click()} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f5f5] hover:text-[#f77f00] transition-colors"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button>
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
              <div className="w-[300px] shrink-0 bg-white border-l border-[#e5e7eb] flex flex-col overflow-hidden">

                {/* Profile */}
                <div className="flex flex-col items-center px-5 pt-7 pb-5 border-b border-[#f5f5f5]">
                  <div className="w-[88px] h-[88px] rounded-full flex items-center justify-center text-white font-bold text-[28px]" style={{ backgroundColor: activeGroup.avatarColor }}>
                    {activeGroup.initials}
                  </div>
                  <p className="font-bold text-[16px] text-[#141414] mt-3 text-center leading-snug">{activeGroup.name}</p>
                  <p className="text-[13px] text-[#9ca3af] mt-0.5">{activeGroup.members} Members</p>
                </div>

                {/* Actions */}
                <div className="border-b border-[#f5f5f5]">
                  <button className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#fff6ed] transition-colors text-left">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-[#f77f00] shrink-0"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/><circle cx="19" cy="8" r="3.5" fill="white"/><line x1="19" y1="6" x2="19" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="17" y1="8" x2="21" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    <span className="text-[15px] text-[#ff9400] font-normal">Add Members</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 transition-colors text-left">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-[#f44649] shrink-0"><path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5a2 2 0 00-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" fill="currentColor"/></svg>
                    <span className="text-[15px] text-[#f44649] font-normal">Leave</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 transition-colors text-left">
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
                    filteredMembers.length === 0 ? (
                      <p className="text-center text-[13px] text-[#9ca3af] py-6">No members found</p>
                    ) : filteredMembers.map(member => (
                      <div key={member.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#f5f5f5] hover:bg-[#fafafa] transition-colors">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-[13px] shrink-0" style={{ backgroundColor: member.avatarColor }}>
                          {member.initials}
                        </div>
                        <p className="flex-1 font-medium text-[14px] text-[#141414] truncate">{member.name}</p>
                        {member.role === "Owner" && (
                          <span className="shrink-0 bg-[#ff9400] text-white text-[11px] font-normal px-2.5 py-0.5 rounded-full">{member.role}</span>
                        )}
                        {(member.role === "Admin" || member.role === "Moderator") && (
                          <span className="shrink-0 border border-[#ff9400] text-[#ff9400] text-[11px] font-normal px-2.5 py-0.5 rounded-full">{member.role}</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-[13px] text-[#9ca3af] py-6">No banned members</p>
                  )}
                </div>
              </div>

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

      {/* Delete confirm modal */}
      {deleteConfirmMsg && (
        <DeleteConfirmModal
          msg={deleteConfirmMsg}
          onDeleteForMe={() => deleteForMe(deleteConfirmMsg.id)}
          onDeleteForEveryone={() => deleteForEveryone(deleteConfirmMsg.id)}
          onCancel={() => setDeleteConfirmMsg(null)}
        />
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

      {/* Hidden audio elements */}
      <audio ref={(el) => { sharedAudioRef.current = el; }} className="hidden" />
      <audio ref={(el) => { audioPreviewRef.current = el; }} className="hidden" />

      {/* New Group Modal */}
      {showNewGroupModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[480px] p-8 relative">
            <button
              onClick={() => setShowNewGroupModal(false)}
              className="absolute top-5 right-5 text-[#9ca3af] hover:text-[#18191c] transition-colors"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
            <h2 className="text-[20px] font-bold text-[#18191c] text-center mb-6">New Group</h2>
            <div className="mb-5">
              <p className="text-[13px] font-semibold text-[#374151] mb-2">Type</p>
              <div className="flex gap-2">
                {(["Public", "Private", "Password"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setNewGroupType(type)}
                    className={`flex-1 py-2 rounded-full text-[13px] font-semibold border transition-colors ${newGroupType === type ? "bg-[#f77f00] text-white border-[#f77f00]" : "bg-white text-[#374151] border-[#e5e7eb] hover:border-[#f77f00]"}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <p className="text-[13px] font-semibold text-[#374151] mb-2">Name</p>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter the group name"
                className="w-full border border-[#e5e7eb] rounded-xl px-4 py-3 text-[14px] text-[#18191c] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#f77f00] transition-colors"
              />
            </div>
            <button
              onClick={() => setShowNewGroupModal(false)}
              className="w-full py-3 bg-[#f77f00] text-white font-bold rounded-full hover:bg-[#e06c00] transition-colors text-[15px]"
            >
              Create Group
            </button>
          </div>
        </div>
      )}
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
