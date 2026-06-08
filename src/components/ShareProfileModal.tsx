import { useState } from "react";

export type SharePerson = {
  id: string;
  name: string;
  title?: string;
  company?: string;
  avatar_url?: string | null;
  cover_url?: string | null;
  endorsement_count?: number;
  review_count?: number;
  achievement_count?: number;
};

const APP_ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

function Avatar({ url, name, size = 88 }: { url?: string | null; name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  if (url) {
    return (
      <img src={url} alt={name} style={{ width: size, height: size }}
        className="rounded-full object-cover border-4 border-white shadow-md" />
    );
  }
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.35 }}
      className="rounded-full bg-gradient-to-br from-[#84081F] to-[#A95BFD] flex items-center justify-center text-white font-bold border-4 border-white shadow-md">
      {initials || "?"}
    </div>
  );
}

// Instagram-style icon for the center of the QR code
function InstagramIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f77f00" />
          <stop offset="50%" stopColor="#e84393" />
          <stop offset="100%" stopColor="#833ab4" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-grad)" />
      <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" fill="none" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="white" />
    </svg>
  );
}

export default function ShareProfileModal({
  person,
  onClose,
}: {
  person: SharePerson;
  onClose: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  const profileUrl = `${APP_ORIGIN}/profile/${person.id}`;
  const subtitle = [person.title, person.company].filter(Boolean).join(" • ");
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  }).replace(/ /g, "-");

  // Orange QR code dots on white background
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=175x175&data=${encodeURIComponent(profileUrl)}&color=f77f00&bgcolor=ffffff&margin=8&qzone=1`;
  const handle = `@${person.name.toUpperCase().replace(/\s+/g, "_")}`;
  const hasStats = (person.endorsement_count ?? 0) + (person.review_count ?? 0) + (person.achievement_count ?? 0) > 0;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: person.name, text: `Check out ${person.name}'s profile on ImpactShaala`, url: profileUrl });
      } catch { /* cancelled */ }
    } else {
      handleCopyLink();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div style={{ perspective: "1200px" }} onClick={(e) => e.stopPropagation()}>
        {/* Flip container — minHeight must fit the back face content */}
        <div
          style={{
            width: 288,
            minHeight: 500,
            transformStyle: "preserve-3d",
            transition: "transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            position: "relative",
          }}
        >

          {/* ═══════════ FRONT FACE ═══════════ */}
          <div
            style={{ backfaceVisibility: "hidden" }}
            className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#ebebeb]"
          >
            {/* Cover banner */}
            <div className="h-[90px] relative">
              {person.cover_url ? (
                <img src={person.cover_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full"
                  style={{ background: "linear-gradient(135deg, #84081F 0%, #A95BFD 100%)" }} />
              )}
              {/* Flip to QR button */}
              <button
                onClick={() => setFlipped(true)}
                className="absolute top-3 right-3 w-8 h-8 bg-white/25 hover:bg-white/45 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
                title="Show QR code"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
                  <line x1="14" y1="14" x2="14" y2="14" strokeWidth="3" strokeLinecap="round" />
                  <line x1="17" y1="14" x2="17" y2="14" strokeWidth="3" strokeLinecap="round" />
                  <line x1="20" y1="14" x2="20" y2="14" strokeWidth="3" strokeLinecap="round" />
                  <line x1="14" y1="17" x2="14" y2="17" strokeWidth="3" strokeLinecap="round" />
                  <line x1="17" y1="17" x2="17" y2="17" strokeWidth="3" strokeLinecap="round" />
                  <line x1="20" y1="20" x2="20" y2="20" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Avatar overlapping banner */}
            <div className="flex justify-center -mt-11 relative z-10">
              <Avatar url={person.avatar_url} name={person.name} size={88} />
            </div>

            {/* Name + subtitle */}
            <div className="px-5 pt-2 pb-0 text-center">
              <p className="text-[#18191c] text-[17px] font-bold leading-snug">{person.name}</p>
              {subtitle && <p className="text-[#9199a3] text-[13px] mt-0.5">{subtitle}</p>}

              {/* Stats */}
              {hasStats && (
                <div className="flex mt-3 border-t border-[#f0f0f0] pt-3">
                  <div className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="text-[#f77f00] text-sm font-bold">{person.endorsement_count ?? 0}</span>
                    <span className="text-[#9199a3] text-[10px]">Endorsements</span>
                  </div>
                  <div className="w-px bg-[#e5e7eb] self-stretch" />
                  <div className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="text-[#f77f00] text-sm font-bold">{person.review_count ?? 0}</span>
                    <span className="text-[#9199a3] text-[10px]">Reviews</span>
                  </div>
                  <div className="w-px bg-[#e5e7eb] self-stretch" />
                  <div className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="text-[#f77f00] text-sm font-bold">{person.achievement_count ?? 0}</span>
                    <span className="text-[#9199a3] text-[10px]">Achievement</span>
                  </div>
                </div>
              )}
            </div>

            {/* Orange gradient action bar */}
            <div className="mt-4 mx-4 mb-1 rounded-2xl overflow-hidden"
              style={{ background: "linear-gradient(135deg, #f77f00 0%, #c0392b 100%)" }}>
              <div className="flex">
                <button onClick={handleShare}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 hover:bg-white/10 transition-colors">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                    <polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  <span className="text-white text-[10px] font-medium">Share profile</span>
                </button>
                <div className="w-px bg-white/20 self-stretch" />
                <button onClick={handleCopyLink}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 hover:bg-white/10 transition-colors">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {copied
                      ? <polyline points="20 6 9 17 4 12" />
                      : <><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></>
                    }
                  </svg>
                  <span className="text-white text-[10px] font-medium">{copied ? "Copied!" : "Copy link"}</span>
                </button>
                <div className="w-px bg-white/20 self-stretch" />
                <button onClick={() => setFlipped(true)}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 hover:bg-white/10 transition-colors">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
                    <path d="M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" fill="white" stroke="none" />
                  </svg>
                  <span className="text-white text-[10px] font-medium">Download</span>
                </button>
              </div>
            </div>

            <p className="text-center text-[#f77f00] text-[12px] font-medium py-3">{today}</p>
          </div>

          {/* ═══════════ BACK FACE ═══════════ */}
          <div
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              position: "absolute",
              inset: 0,
              background: "linear-gradient(160deg, #f77f00 0%, #f7510f 45%, #c0392b 100%)",
            }}
            className="rounded-3xl shadow-2xl flex flex-col p-4 gap-3"
          >

            {/* Back → flip button */}
            <button
              onClick={() => setFlipped(false)}
              className="absolute top-3 right-3 w-8 h-8 bg-white/25 hover:bg-white/45 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors z-10"
              title="Flip back"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>

            {/* White inset card — QR + handle */}
            <div className="bg-white rounded-2xl flex flex-col items-center py-4 px-4 gap-2">
              {/* QR code with icon overlaid in center */}
              <div className="relative">
                <img
                  src={qrUrl}
                  alt="Profile QR Code"
                  width={175}
                  height={175}
                  className="block"
                  style={{ imageRendering: "pixelated" }}
                />
                {/* Center icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white rounded-xl p-1.5 shadow-sm">
                    <InstagramIcon />
                  </div>
                </div>
              </div>

              {/* Handle text */}
              <p className="text-[#f77f00] text-[14px] font-bold tracking-widest text-center">
                {handle}
              </p>
            </div>

            {/* Action buttons row — white pills on gradient */}
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="flex-1 bg-white rounded-xl py-2.5 flex flex-col items-center gap-1 hover:bg-white/90 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                  <polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                <span className="text-[#374151] text-[10px] font-medium">Share profile</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex-1 bg-white rounded-xl py-2.5 flex flex-col items-center gap-1 hover:bg-white/90 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {copied
                    ? <polyline points="20 6 9 17 4 12" stroke="#22c55e" />
                    : <><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></>
                  }
                </svg>
                <span className="text-[#374151] text-[10px] font-medium">{copied ? "Copied!" : "Copy link"}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex-1 bg-white rounded-xl py-2.5 flex flex-col items-center gap-1 hover:bg-white/90 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span className="text-[#374151] text-[10px] font-medium">Download</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ✕ close outside card */}
      <button
        onClick={onClose}
        className="fixed top-5 right-5 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
