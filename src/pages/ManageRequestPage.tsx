import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import pr1 from "../assets/images/profile/pr1.png";
import pr2 from "../assets/images/profile/pr2.png";

const PROFILE_IMGS = [pr1, pr2];

type Request = {
  id: number;
  name: string;
  role: string;
  location: string;
};

const RECEIVED: Request[] = [
  { id: 1, name: "Eleanor Pena", role: "President of Sales", location: "Today" },
  { id: 2, name: "Eleanor Pena", role: "President of Sales", location: "Bangaluru, Karnataka" },
  { id: 3, name: "Eleanor Pena", role: "President of Sales", location: "Bangaluru, Karnataka" },
  { id: 4, name: "Eleanor Pena", role: "President of Sales", location: "Bangaluru, Karnataka" },
  { id: 5, name: "Eleanor Pena", role: "President of Sales", location: "Bangaluru, Karnataka" },
  { id: 6, name: "Eleanor Pena", role: "President of Sales", location: "Bangaluru, Karnataka" },
  { id: 7, name: "Eleanor Pena", role: "President of Sales", location: "Bangaluru, Karnataka" },
];

const SENT: Request[] = [
  { id: 10, name: "Robin Menon",  role: "UI/UX Designer",     location: "Bangaluru, Karnataka" },
  { id: 11, name: "Arun Menon",   role: "Product Manager",    location: "Mumbai, Maharashtra" },
  { id: 12, name: "Robin Menon",  role: "UI/UX Designer",     location: "Bangaluru, Karnataka" },
  { id: 13, name: "Arun Menon",   role: "Product Manager",    location: "Mumbai, Maharashtra" },
];

export default function ManageRequestPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState<"received" | "sent">("received");
  const [received, setReceived] = useState<Request[]>(RECEIVED);
  const [sent, setSent] = useState<Request[]>(SENT);

  const list = tab === "received" ? received : sent;

  function dismiss(id: number) {
    if (tab === "received") setReceived((p) => p.filter((r) => r.id !== id));
    else setSent((p) => p.filter((r) => r.id !== id));
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
            <h1 className="text-[#18191c] text-[24px] font-normal">Manage request</h1>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-[#f2f2f3] overflow-hidden">

            {/* Tabs */}
            <div className="flex items-center gap-3 px-6 pt-5 pb-0">
              <button
                onClick={() => setTab("received")}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${
                  tab === "received"
                    ? "bg-[#f77f00] text-white"
                    : "border border-[#f77f00] text-[#f77f00] hover:bg-[#fff6ed]"
                }`}
              >
                Received
              </button>
              <button
                onClick={() => setTab("sent")}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${
                  tab === "sent"
                    ? "bg-[#f77f00] text-white"
                    : "border border-[#f77f00] text-[#f77f00] hover:bg-[#fff6ed]"
                }`}
              >
                Sent
              </button>
            </div>

            <div className="h-px bg-[#f2f2f3] mt-4" />

            {/* List */}
            <div className="divide-y divide-[#f2f2f3]">
              {list.map((r, i) => (
                <div key={r.id} className="flex items-center gap-4 px-6 py-4">
                  <img
                    src={PROFILE_IMGS[i % 2]}
                    alt={r.name}
                    className="w-16 h-16 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[#18191c] text-base font-semibold">{r.name}</p>
                    <p className="text-[#9199a3] text-sm">{r.role}</p>
                    <p className="text-[#18191c] text-sm font-semibold mt-0.5">{r.location}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {tab === "sent" ? (
                      <button
                        onClick={() => dismiss(r.id)}
                        className="text-[#f77f00] text-sm font-semibold hover:text-[#e06800] transition-colors"
                      >
                        Withdraw
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => dismiss(r.id)}
                          className="text-[#9199a3] text-sm font-medium hover:text-[#474d57] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => dismiss(r.id)}
                          className="px-5 py-1.5 rounded-full border border-[#f77f00] text-[#f77f00] text-sm font-semibold hover:bg-[#fff6ed] transition-colors"
                        >
                          Add
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {list.length === 0 && (
                <div className="py-16 text-center text-[#9199a3] text-sm">No requests here.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
