import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import pr1 from "../assets/images/profile/pr1.png";
import pr2 from "../assets/images/profile/pr2.png";

const PROFILE_IMGS = [pr1, pr2];

type Connection = {
  id: number;
  name: string;
  role: string;
  extra?: string;
  time: string;
};

const CONNECTIONS: Connection[] = [
  { id: 1,  name: "Eleanor Pena", role: "President of Sales", time: "Today" },
  { id: 2,  name: "Robin Menon",  role: "President of Sales", extra: "Marketing Coordinator", time: "Today" },
  { id: 3,  name: "Eleanor Pena", role: "President of Sales", time: "Today" },
  { id: 4,  name: "Robin Menon",  role: "President of Sales", extra: "Marketing Coordinator", time: "Today" },
  { id: 5,  name: "Eleanor Pena", role: "President of Sales", time: "Today" },
  { id: 6,  name: "Robin Menon",  role: "President of Sales", extra: "Marketing Coordinator", time: "Today" },
  { id: 7,  name: "Eleanor Pena", role: "President of Sales", time: "Today" },
];

function ThreeDotMenu({ onRemove }: { onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f5f5f5] transition-colors text-[#9199a3]"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-10 bg-white border border-[#f2f2f3] rounded-xl shadow-lg z-20 min-w-[110px] overflow-hidden">
          <button
            onClick={() => { onRemove(); setOpen(false); }}
            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-[#fff5f5] transition-colors font-medium"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

export default function ManageCommunityPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connections, setConnections] = useState<Connection[]>(CONNECTIONS);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const filtered = connections.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  function removeConnection(id: number) {
    setConnections((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">

          {/* Back + title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/community")}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white border border-transparent hover:border-[#f2f2f3] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#18191c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
            <h1 className="text-[#18191c] text-[24px] font-normal">Manage my community</h1>
          </div>

          {/* Connections card */}
          <div className="bg-white rounded-2xl border border-[#f2f2f3] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 gap-4 flex-wrap">
              <span className="text-[#18191c] text-[22px] font-normal">{connections.length} Connections</span>
              <div className="flex items-center gap-2 flex-1 max-w-[400px]">
                <div className="flex items-center gap-2 flex-1 border border-[#e5e7eb] rounded-full px-4 py-2.5 bg-white">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9199a3" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && setQuery(search)}
                    placeholder="Search By Name"
                    className="flex-1 text-sm text-[#18191c] placeholder-[#9199a3] outline-none bg-transparent"
                  />
                </div>
                <button
                  onClick={() => setQuery(search)}
                  className="px-5 py-2.5 rounded-full border border-[#f77f00] text-[#f77f00] text-sm font-semibold hover:bg-[#fff6ed] transition-colors shrink-0"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="h-px bg-[#f2f2f3]" />

            {/* Connection list */}
            <div className="divide-y divide-[#f2f2f3]">
              {filtered.map((c, i) => (
                <div key={c.id} className="flex items-center gap-4 px-6 py-4">
                  <img
                    src={PROFILE_IMGS[i % 2]}
                    alt={c.name}
                    className="w-16 h-16 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[#18191c] text-base font-semibold">{c.name}</p>
                    <p className="text-[#9199a3] text-sm">{c.role}</p>
                    {c.extra && <p className="text-[#9199a3] text-sm">{c.extra}</p>}
                    <p className="text-[#18191c] text-sm font-semibold mt-0.5">{c.time}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button className="px-5 py-2 rounded-full border border-[#f77f00] text-[#f77f00] text-sm font-semibold hover:bg-[#fff6ed] transition-colors">
                      Message
                    </button>
                    <ThreeDotMenu onRemove={() => removeConnection(c.id)} />
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="py-16 text-center text-[#9199a3] text-sm">No connections found.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
