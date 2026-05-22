import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import pr1 from "../assets/images/profile/pr1.png";
import pr2 from "../assets/images/profile/pr2.png";

const PROFILE_IMGS = [pr1, pr2];

// ─── Types ────────────────────────────────────────────────────────────────────

type Person = {
  id: number;
  name: string;
  role: string;
  company: string;
  extra?: string;
  time?: string;
  endorsements: number;
  reviews: number;
  achievement: number;
  requested: boolean;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const PENDING: Person[] = [
  { id: 1, name: "Eleanor Pena", role: "President of Sales", company: "Accenture", time: "Today", endorsements: 183, reviews: 60, achievement: 15, requested: false },
  { id: 2, name: "Robin Menon", role: "President of Sales", company: "Accenture", extra: "Marketing Coordinator", time: "Yesterday", endorsements: 183, reviews: 60, achievement: 15, requested: false },
];

const KNOW: Person[] = [
  { id: 10, name: "Arun Menon", role: "UI/UX Designer", company: "Accenture", endorsements: 183, reviews: 60, achievement: 15, requested: true },
  { id: 11, name: "Robin Menon", role: "UI/UX Designer", company: "Accenture", endorsements: 183, reviews: 60, achievement: 15, requested: false },
  { id: 12, name: "Robin Menon", role: "UI/UX Designer", company: "Accenture", endorsements: 183, reviews: 60, achievement: 15, requested: false },
  { id: 13, name: "Robin Menon", role: "UI/UX Designer", company: "Accenture", endorsements: 183, reviews: 60, achievement: 15, requested: false },
  { id: 14, name: "Robin Menon", role: "UI/UX Designer", company: "Accenture", endorsements: 183, reviews: 60, achievement: 15, requested: false },
  { id: 15, name: "Robin Menon", role: "UI/UX Designer", company: "Accenture", endorsements: 183, reviews: 60, achievement: 15, requested: false },
  { id: 16, name: "Arun Menon", role: "UI/UX Designer", company: "Accenture", endorsements: 183, reviews: 60, achievement: 15, requested: true },
  { id: 17, name: "Robin Menon", role: "UI/UX Designer", company: "Accenture", endorsements: 183, reviews: 60, achievement: 15, requested: false },
];

const SUGGESTIONS: Person[] = [
  { id: 20, name: "Robin Menon", role: "UI/UX Designer", company: "Accenture", endorsements: 183, reviews: 60, achievement: 15, requested: true },
  { id: 21, name: "Robin Menon", role: "UI/UX Designer", company: "Accenture", endorsements: 183, reviews: 60, achievement: 15, requested: false },
  { id: 22, name: "Robin Menon", role: "UI/UX Designer", company: "Accenture", endorsements: 183, reviews: 60, achievement: 15, requested: false },
  { id: 23, name: "Robin Menon", role: "UI/UX Designer", company: "Accenture", endorsements: 183, reviews: 60, achievement: 15, requested: false },
  { id: 24, name: "Robin Menon", role: "UI/UX Designer", company: "Accenture", endorsements: 183, reviews: 60, achievement: 15, requested: false },
  { id: 25, name: "Robin Menon", role: "UI/UX Designer", company: "Accenture", endorsements: 183, reviews: 60, achievement: 15, requested: false },
  { id: 26, name: "Robin Menon", role: "UI/UX Designer", company: "Accenture", endorsements: 183, reviews: 60, achievement: 15, requested: false },
  { id: 27, name: "Arun Menon", role: "UI/UX Designer", company: "Accenture", endorsements: 183, reviews: 60, achievement: 15, requested: true },
];

// ─── Person card (grid) ───────────────────────────────────────────────────────

function PersonCard({ person, onToggle }: { person: Person; onToggle: (id: number) => void }) {
  const avatar = PROFILE_IMGS[person.id % 2];

  return (
    <div className="bg-white rounded-2xl border border-[#f2f2f3] overflow-visible flex flex-col" style={{ height: "294px" }}>
      {/* Gradient banner */}
      <div
        className="h-[75px] rounded-t-2xl relative shrink-0"
        style={{ background: "linear-gradient(90deg, #84081F -5.96%, #A95BFD 106.81%)" }}
      />

      {/* Avatar — sits on top of banner via negative margin + z-index */}
      <div className="flex justify-center -mt-10 mb-3 relative z-10">
        <img
          src={avatar}
          alt={person.name}
          className="w-[94px] h-[94px] rounded-full object-cover shadow-sm"
        />
      </div>

      {/* Info */}
      <div className="px-4 pb-5 flex flex-col items-center flex-1">
        <p className="text-[#18191c] text-base font-bold text-center leading-tight">{person.name}</p>
        <p className="text-[#9199a3] text-xs text-center mt-1">
          {person.role} • {person.company}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-0 mt-4 w-full justify-center">
          <div className="flex flex-col items-center flex-1">
            <span className="text-[#f77f00] text-sm font-bold">{person.endorsements}</span>
            <span className="text-[#9199a3] text-[10px] text-center leading-tight">Endorsements</span>
          </div>
          <div className="w-px h-7 bg-[#f2f2f3]" />
          <div className="flex flex-col items-center flex-1">
            <span className="text-[#f77f00] text-sm font-bold">{person.reviews}</span>
            <span className="text-[#9199a3] text-[10px] text-center leading-tight">Reviews</span>
          </div>
          <div className="w-px h-7 bg-[#f2f2f3]" />
          <div className="flex flex-col items-center flex-1">
            <span className="text-[#f77f00] text-sm font-bold">{person.achievement}</span>
            <span className="text-[#9199a3] text-[10px] text-center leading-tight">Achievement</span>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={() => onToggle(person.id)}
          className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold border transition-colors ${person.requested
              ? "border-[#d1d5db] text-[#9199a3] hover:border-[#f77f00] hover:text-[#f77f00]"
              : "border-[#f77f00] text-[#f77f00] hover:bg-[#fff6ed]"
            }`}
        >
          {!person.requested && (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          )}
          {person.requested ? "Request sent" : "Add to community"}
        </button>
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, count, onAction, children }: { title: string; count?: number; onAction?: () => void; children: React.ReactNode }) {
  const label = title.startsWith("People") || title.startsWith("More") ? "Show all" : "Manage";
  return (
    <div className="bg-white rounded-2xl border border-[#f2f2f3] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-[#18191c] text-[20px] font-normal">
          {title}{count !== undefined ? ` (${count})` : ""}
        </h2>
        <button
          onClick={onAction}
          className="text-[#f77f00] text-sm font-semibold px-4 py-1.5 rounded-full border border-[#f77f00] hover:bg-[#fff6ed] transition-colors"
        >
          {label}
        </button>
      </div>
      <div className="h-px bg-[#f2f2f3]" />
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyCommunityPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pending, setPending] = useState<Person[]>(PENDING);
  const [know, setKnow] = useState<Person[]>(KNOW);
  const [suggestions, setSuggestions] = useState<Person[]>(SUGGESTIONS);

  function dismissPending(id: number) {
    setPending((prev) => prev.filter((p) => p.id !== id));
  }

  function toggleKnow(id: number) {
    setKnow((prev) => prev.map((p) => (p.id === id ? { ...p, requested: !p.requested } : p)));
  }

  function toggleSuggestion(id: number) {
    setSuggestions((prev) => prev.map((p) => (p.id === id ? { ...p, requested: !p.requested } : p)));
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">

          {/* Page title */}
          <h1 className="text-[#18191c] text-[24px] font-normal">Manage my community</h1>

          {/* My Community count */}
          <Section title="My Community" count={265} onAction={() => navigate("/community/manage")}>
            <div />
          </Section>

          {/* Pending requests */}
          {pending.length > 0 && (
            <Section title={`${pending.length} pending request`} onAction={() => navigate("/community/requests")}>
              <div className="divide-y divide-[#f2f2f3]">
                {pending.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-5">
                    {/* Avatar */}
                    <img
                      src={PROFILE_IMGS[i % 2]}
                      alt={p.name}
                      className="w-16 h-16 rounded-full object-cover shrink-0"
                    />
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[#18191c] text-lg font-semibold">{p.name}</p>
                      <p className="text-[#9199a3] text-sm">{p.role}</p>
                      {p.extra && <p className="text-[#9199a3] text-sm">{p.extra}</p>}
                      <p className="text-[#18191c] text-sm font-semibold mt-0.5">{p.time}</p>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => dismissPending(p.id)}
                        className="text-[#9199a3] text-sm font-medium hover:text-[#474d57] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => dismissPending(p.id)}
                        className="px-5 py-1.5 rounded-full border border-[#f77f00] text-[#f77f00] text-sm font-semibold hover:bg-[#fff6ed] transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* People you may know */}
          <Section title="People you may know">
            <div className="px-4 pb-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {know.map((p) => (
                  <PersonCard key={p.id} person={p} onToggle={toggleKnow} />
                ))}
              </div>
            </div>
          </Section>

          {/* More Suggestions */}
          <Section title="More Suggestion for you">
            <div className="px-4 pb-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {suggestions.map((p) => (
                  <PersonCard key={p.id} person={p} onToggle={toggleSuggestion} />
                ))}
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
