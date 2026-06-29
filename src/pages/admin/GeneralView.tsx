import { useState, useEffect, useCallback } from "react";
import { fetchAdminUsers, deleteAdminUser, type AdminUser } from "../../services/adminService";

const ROLE_LABEL: Record<string, string> = {
  student: "Student",
  professional: "Working Professional",
  educator: "Educator",
  entrepreneur: "Entrepreneur",
};

const ORG_LABEL: Record<string, string> = {
  educational: "Educational",
  forprofit: "For-Profit",
  nonprofit: "Non-Profit",
  health: "Health Services",
  utilities: "Public Utilities",
  welfare: "Public Welfare",
  fieldtrip: "Field Trip Venue",
  startup: "Startup Support",
  talent: "Talent Showcase",
  safety: "Public Safety",
  international: "International",
  others: "Others",
};

const PER_PAGE = 8;

function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="w-[56px] h-[56px] rounded-full object-cover flex-shrink-0"
      />
    );
  }
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-[56px] h-[56px] rounded-full bg-[#f0e6d3] flex items-center justify-center flex-shrink-0">
      <span className="text-[#f77f00] font-semibold text-base">{initials}</span>
    </div>
  );
}

function userDisplayName(u: AdminUser) {
  if (u.user_type === "organization") return u.org_name ?? u.email;
  return [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email;
}

function userSubtitle(u: AdminUser) {
  if (u.user_type === "organization") return ORG_LABEL[u.org_type ?? ""] ?? u.org_type ?? "";
  return ROLE_LABEL[u.role ?? ""] ?? u.role ?? "";
}

function userTypeLabel(u: AdminUser) {
  return u.user_type === "individual" ? "Individual" : "Organisation";
}

function userProjectLabel(u: AdminUser) {
  if (u.user_type === "organization") return ORG_LABEL[u.org_type ?? ""] ?? u.org_type ?? "—";
  return ROLE_LABEL[u.role ?? ""] ?? u.role ?? "—";
}

function paginationPages(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}

export default function GeneralView() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ users: AdminUser[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback((p: number) => {
    setLoading(true);
    fetchAdminUsers(p, PER_PAGE)
      .then((res) => setData({ users: res.users, total: res.total }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  const totalPages = data ? Math.ceil(data.total / PER_PAGE) : 1;

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteAdminUser(id);
      load(page);
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  const pages = paginationPages(page, totalPages);

  return (
    <div>
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-[30px] font-semibold text-black" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
          Welcome back, Admin
        </h1>
        <p className="text-[25px] text-[#575555] font-medium" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
          Here's what's happening on the platform today.
        </p>
      </div>

      {/* Table card */}
      <div className="bg-white border border-[#d7d7d7] rounded-[15px] overflow-hidden">

        {/* Header row */}
        <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr] bg-[#ffd396] px-6 py-4">
          {["Profile", "User Type", "Project", "Actions"].map((col) => (
            <span key={col} className="text-[20px] font-semibold text-black" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
              {col}
            </span>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div className="py-20 flex items-center justify-center text-[#aaa] animate-pulse">
            Loading users…
          </div>
        ) : !data || data.users.length === 0 ? (
          <div className="py-20 flex items-center justify-center text-[#aaa]">
            No users found.
          </div>
        ) : (
          data.users.map((user) => {
            const name = userDisplayName(user);
            const subtitle = userSubtitle(user);
            return (
              <div
                key={user.id}
                className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr] px-6 py-4 border-b border-[#f0f0f0] items-center hover:bg-[#fafafa] transition-colors"
              >
                {/* Profile */}
                <div className="flex items-center gap-4">
                  <Avatar url={user.avatar_url} name={name} />
                  <div className="min-w-0">
                    <p className="text-[20px] font-semibold text-black truncate" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                      {name}
                    </p>
                    <p className="text-[16px] text-[#555454] font-medium truncate" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                      {subtitle || user.email}
                    </p>
                  </div>
                </div>

                {/* User Type */}
                <span className="text-[20px] text-black font-medium" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                  {userTypeLabel(user)}
                </span>

                {/* Project */}
                <span className="text-[20px] text-black font-medium" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                  {userProjectLabel(user)}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  {/* Edit — navigates to profile */}
                  <a
                    href={`/profile/${user.id}`}
                    className="w-10 h-10 rounded-full border border-[#d6ddeb] flex items-center justify-center text-[#555] hover:bg-[#f5f5f5] transition-colors"
                    title="View profile"
                  >
                    <EditIcon />
                  </a>

                  {/* Delete */}
                  {confirmId === user.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={deletingId === user.id}
                        className="text-[12px] px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                      >
                        {deletingId === user.id ? "…" : "Yes"}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="text-[12px] px-2 py-1 border border-[#d6ddeb] rounded-lg hover:bg-[#f5f5f5]"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(user.id)}
                      className="w-10 h-10 rounded-full border border-[#d6ddeb] flex items-center justify-center text-[#555] hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors"
                      title="Delete user"
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Pagination */}
        {!loading && data && data.total > PER_PAGE && (
          <div className="flex items-center justify-center gap-2 py-5 px-6">
            {/* Previous */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-2 text-[15px] text-[#444] disabled:opacity-40 hover:text-black"
            >
              <ChevronLeft /> Previous
            </button>

            {/* Page numbers */}
            {pages.map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="w-[42px] h-[42px] flex items-center justify-center text-[16px] text-[#444]">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`w-[42px] h-[42px] rounded-full text-[16px] font-medium transition-colors ${
                    page === p
                      ? "bg-[#1a1a1a] text-white"
                      : "text-[#333] hover:bg-[#f0f0f0]"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            {/* Next */}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-2 text-[15px] text-[#444] disabled:opacity-40 hover:text-black"
            >
              Next <ChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
