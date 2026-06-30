import { useState, useEffect } from "react";
import logoImg from "../../assets/images/logo/logo.png";
import { fetchAdminStats, type AdminStats } from "../../services/adminService";
import GeneralView from "./GeneralView";
import ClientRequestsView from "./ClientRequestsView";
import AccountAttributionView from "./AccountAttributionView";

type NavItem =
  | "dashboard"
  | "general"
  | "client-requests"
  | "reviews"
  | "approval"
  | "blog-posts"
  | "account-attribution";

const navItems: { key: NavItem; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "general", label: "General" },
  { key: "client-requests", label: "Client Requests" },
  { key: "reviews", label: "Reviews" },
  { key: "approval", label: "Approval" },
  { key: "blog-posts", label: "Blog Posts" },
  { key: "account-attribution", label: "Account Attribution" },
];

// ── Individual role display config ────────────────────────────────────────────
const INDIVIDUAL_COLOR: Record<string, string> = {
  student:      "#14B8A6",
  professional: "#3B82F6",
  educator:     "#6366F1",
  entrepreneur: "#EC4899",
};
const INDIVIDUAL_LABEL: Record<string, string> = {
  student:      "Student",
  professional: "Working Professional",
  educator:     "Educator",
  entrepreneur: "Entrepreneur",
};

// ── Organisation type display config ─────────────────────────────────────────
const ORG_COLOR: Record<string, string> = {
  educational:  "#14B8A6",
  forprofit:    "#3B82F6",
  nonprofit:    "#F59E0B",
  health:       "#EF4444",
  utilities:    "#8B5CF6",
  welfare:      "#10B981",
  fieldtrip:    "#F97316",
  startup:      "#EC4899",
  talent:       "#6366F1",
  safety:       "#0EA5E9",
  international:"#84CC16",
  others:       "#9CA3AF",
};
const ORG_LABEL: Record<string, string> = {
  educational:  "Educational",
  forprofit:    "For-Profit",
  nonprofit:    "Non-Profit",
  health:       "Health Services",
  utilities:    "Public Utilities",
  welfare:      "Public Welfare",
  fieldtrip:    "Field Trip Venue",
  startup:      "Startup Support",
  talent:       "Talent Showcase",
  safety:       "Public Safety",
  international:"International",
  others:       "Others",
};

// Fallback palette for unknown keys
const FALLBACK_COLORS = ["#64748B","#A78BFA","#FB7185","#34D399","#FBBF24"];

function toDonutSegments(
  items: { key: string; pct: number }[],
  colorMap: Record<string, string>
) {
  return items.map((item, i) => ({
    color: colorMap[item.key] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    pct: item.pct,
  }));
}

const weeklyData = [
  { day: "Mon", full: 115, value: 65 },
  { day: "Tue", full: 195, value: 195 },
  { day: "Wed", full: 150, value: 105 },
  { day: "Thu", full: 80, value: 45 },
  { day: "Fri", full: 70, value: 35 },
  { day: "Sat", full: 130, value: 65 },
  { day: "Sun", full: 160, value: 120 },
];

function DonutChart({
  segments,
  total,
}: {
  segments: { color: string; pct: number }[];
  total: number;
}) {
  const size = 130;
  const strokeWidth = 20;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  let accumulated = 0;

  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
        className="absolute"
      >
        {segments.map((seg, i) => {
          const dash = (seg.pct / 100) * circ;
          const offset = -accumulated;
          accumulated += dash;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={offset}
            />
          );
        })}
      </svg>
      <div className="z-10 text-center">
        <p className="text-[10px] text-[#737373] font-medium leading-tight">
          Total Value
        </p>
        <p className="text-[22px] font-bold text-[#0a0a0a] leading-tight">
          {total}
        </p>
      </div>
    </div>
  );
}

function BarChart() {
  const maxVal = 200;
  const chartH = 200;
  const chartW = 700;
  const barW = 48;
  const leftPad = 46;
  const slotW = (chartW - leftPad) / weeklyData.length;
  const yLines = [0, 50, 100, 150, 200];

  return (
    <svg width="100%" viewBox={`0 0 ${chartW} ${chartH + 28}`}>
      {yLines.map((val) => {
        const y = chartH - (val / maxVal) * chartH;
        return (
          <g key={val}>
            <line
              x1={leftPad}
              y1={y}
              x2={chartW}
              y2={y}
              stroke="#e8e8e8"
              strokeWidth="1"
            />
            <text
              x={leftPad - 6}
              y={y + 4}
              fontSize="11"
              fill="#54555a"
              textAnchor="end"
            >
              {val}
            </text>
          </g>
        );
      })}
      {weeklyData.map((d, i) => {
        const x = leftPad + i * slotW + (slotW - barW) / 2;
        const fullH = (d.full / maxVal) * chartH;
        const valueH = (d.value / maxVal) * chartH;
        return (
          <g key={d.day}>
            <rect
              x={x}
              y={chartH - fullH}
              width={barW}
              height={fullH}
              fill="#d4d4e8"
              rx={5}
            />
            <rect
              x={x}
              y={chartH - valueH}
              width={barW}
              height={valueH}
              fill="#6366F1"
              rx={5}
            />
            <text
              x={x + barW / 2}
              y={chartH + 18}
              fontSize="11"
              fill="#54555a"
              textAnchor="middle"
            >
              {d.day}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function AdminPage() {
  const [activeNav, setActiveNav] = useState<NavItem>("dashboard");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .finally(() => setLoadingStats(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Top Nav */}
      <header className="fixed top-0 left-0 right-0 z-30 h-[89px] bg-white border-b-2 border-[#dcdcdd] flex items-center px-6">
        <img src={logoImg} alt="Impactshaala" className="h-10 object-contain" />
        <div className="ml-auto w-10 h-10 rounded-full bg-[#e0e0e0] flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 24 24" fill="#aaa" className="w-6 h-6">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
          </svg>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed left-0 top-[89px] bottom-0 w-[302px] bg-white border-r border-[#cecece] z-20 overflow-y-auto">
        <div className="px-6 pt-8 pb-4">
          <h2
            className="text-[30px] font-semibold text-black leading-tight"
            style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
          >
            Admin Panel
          </h2>
        </div>

        <nav className="mt-6 flex flex-col gap-1">
          {navItems.map((item) => (
            <div key={item.key} className="relative flex items-center">
              {activeNav === item.key && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-[#f77f00] rounded-r" />
              )}
              <button
                onClick={() => setActiveNav(item.key)}
                className={`mx-[13px] w-[267px] text-left px-4 py-3 rounded-[100px] text-[20px] font-medium transition-colors ${
                  activeNav === item.key
                    ? "bg-[#ffeacc] text-[#f77f00]"
                    : "text-black hover:bg-gray-50"
                }`}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {item.label}
              </button>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-[302px] pt-[89px] min-h-screen">
        <div className="px-10 py-8">

          {/* General — users table */}
          {activeNav === "general" && <GeneralView />}
          {activeNav === "client-requests" && <ClientRequestsView />}
          {activeNav === "account-attribution" && <AccountAttributionView />}

          {/* Dashboard */}
          {activeNav === "dashboard" && <>
          {/* Welcome */}
          <div className="mb-8">
            <h1
              className="text-[30px] font-semibold text-black"
              style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
            >
              Welcome back, Admin
            </h1>
            <p
              className="text-[25px] text-[#575555] font-medium"
              style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
            >
              Here's what's happening on the platform today.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-5 gap-4 mb-8">
            {(
              [
                {
                  label: "Total users",
                  value: loadingStats ? "—" : String(stats?.totalUsers ?? 0),
                },
                {
                  label: "Organisations",
                  value: loadingStats ? "—" : String(stats?.totalOrganisations ?? 0),
                },
                {
                  label: "Active\nUsers",
                  value: loadingStats ? "—" : String(stats?.activeUsers ?? 0),
                },
                {
                  label: "Completed\nInitiatives",
                  value: loadingStats ? "—" : String(stats?.completedInitiatives ?? 0),
                },
                {
                  label: "Monthly\nEngagement",
                  value: loadingStats ? "—" : (stats?.monthlyEngagement ?? "0%"),
                },
              ] as { label: string; value: string }[]
            ).map((stat) => (
              <div
                key={stat.label}
                className="bg-white border border-[#c3c3c3] rounded-[23px] px-5 py-5 flex flex-col gap-3"
                style={{ minHeight: 160 }}
              >
                <p
                  className="text-[17px] text-[#575555] font-medium whitespace-pre-line leading-[1.3]"
                  style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                >
                  {stat.label}
                </p>
                <p
                  className={`text-[42px] font-medium text-black leading-tight mt-auto ${loadingStats ? "animate-pulse text-gray-300" : ""}`}
                  style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* User Categorisation Charts */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {(
              [
                {
                  title: "Individual users",
                  items: stats?.individualCategories ?? [],
                  colorMap: INDIVIDUAL_COLOR,
                  labelMap: INDIVIDUAL_LABEL,
                },
                {
                  title: "Organisation types",
                  items: stats?.orgCategories ?? [],
                  colorMap: ORG_COLOR,
                  labelMap: ORG_LABEL,
                },
              ] as const
            ).map((chart) => {
              const segments = toDonutSegments(chart.items, chart.colorMap);
              const total = chart.items.reduce((s, i) => s + i.count, 0);
              return (
                <div
                  key={chart.title}
                  className="bg-white border border-[#c3c3c3] rounded-[23px] p-6"
                >
                  <h3
                    className="text-[22px] font-semibold text-black mb-5"
                    style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                  >
                    {chart.title}
                  </h3>

                  {loadingStats ? (
                    <div className="h-32 flex items-center justify-center text-[#aaa] text-sm animate-pulse">
                      Loading…
                    </div>
                  ) : chart.items.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-[#aaa] text-sm">
                      No data yet
                    </div>
                  ) : (
                    <div className="flex items-center gap-5">
                      <DonutChart segments={segments} total={total} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-[12px] text-[#737373] font-medium px-2 mb-1">
                          <span>Label</span>
                          <span>%</span>
                        </div>
                        <hr className="border-[#e5e5e5] mb-1" />
                        {chart.items.map((item, i) => {
                          const color =
                            chart.colorMap[item.key] ??
                            FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                          const label =
                            chart.labelMap[item.key] ?? item.key;
                          return (
                            <div
                              key={item.key}
                              className="flex items-center justify-between py-1.5 px-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className="w-3 h-3 rounded-sm flex-shrink-0"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-[13px] text-[#404040] truncate">
                                  {label}
                                </span>
                              </div>
                              <span className="text-[13px] font-medium text-[#0a0a0a] ml-2 flex-shrink-0">
                                {item.pct}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Collaborative Accomplishment Bar Chart */}
          <div className="bg-white border border-[#c3c3c3] rounded-[23px] p-6 mb-6">
            <h3
              className="text-[27px] font-semibold text-black mb-5"
              style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
            >
              Collaborative accomplishment
            </h3>
            <BarChart />
          </div>

          {/* Engagement Overview */}
          <div className="bg-white border border-[#c3c3c3] rounded-[23px] p-6 mb-8">
            <h3
              className="text-[30px] font-semibold text-black mb-5"
              style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
            >
              Engagement Overview
            </h3>
            <div className="grid grid-cols-5 gap-4">
              {(
                [
                  { label: "Media posts",      value: loadingStats ? "—" : String(stats?.mediaPosts ?? 0) },
                  { label: "Events",           value: loadingStats ? "—" : String(stats?.events ?? 0) },
                  { label: "Polls",            value: loadingStats ? "—" : String(stats?.polls ?? 0) },
                  { label: "Employment posts", value: loadingStats ? "—" : String(stats?.employmentPosts ?? 0) },
                  { label: "Learning posts",   value: loadingStats ? "—" : String(stats?.learningPosts ?? 0) },
                ] as { label: string; value: string }[]
              ).map((stat) => (
                <div
                  key={stat.label}
                  className="border border-[#c3c3c3] rounded-[23px] px-5 py-5"
                  style={{ minHeight: 120 }}
                >
                  <p
                    className="text-[17px] text-[#575555] font-medium mb-2"
                    style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                  >
                    {stat.label}
                  </p>
                  <p
                    className="text-[44px] font-medium text-black leading-tight"
                    style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
          </>}

        </div>
      </main>
    </div>
  );
}
