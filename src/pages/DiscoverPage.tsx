import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { useDiscover } from "../hooks/useDiscover";
import CategoryChips from "../components/discover/CategoryChips";
import DiscoverCard from "../components/discover/DiscoverCard";
import ExpandedCard from "../components/discover/ExpandedCard";
import SkeletonCard from "../components/discover/SkeletonCard";
import FilterPanel from "../components/discover/FilterPanel";
import HelpBox from "../components/discover/HelpBox";
import PromoCard from "../components/discover/PromoCard";
import CreatePostDropdown from "../components/discover/CreatePostDropdown";
import ApplyModal from "../components/discover/ApplyModal";

export default function DiscoverPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [helpVisible, setHelpVisible] = useState(true);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [applyPostId, setApplyPostId] = useState<string | null>(null);

  const {
    tab,
    switchTab,
    activeChip,
    switchChip,
    rawQuery,
    setRawQuery,
    items,
    nextCursor,
    loading,
    loadingMore,
    error,
    loadMore,
    bookmarkedIds,
    setBookmarked,
    pendingFilters,
    setPendingFilters,
    applyFilters,
    resetFilters,
  } = useDiscover();

  function handleExpand(id: string) {
    setExpandedCardId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pt-[64px] sm:pt-[72px] lg:pt-[78px] lg:pl-[280px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex gap-6">

          {/* ── Center feed ── */}
          <div className="flex-1 min-w-0">

            {/* Search bar */}
            <div className="mb-4">
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                  width="18" height="18" viewBox="0 0 24 24" fill="none"
                >
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  value={rawQuery}
                  onChange={(e) => setRawQuery(e.target.value)}
                  placeholder="Search opportunities, providers..."
                  className="w-full pl-11 pr-4 py-3 border border-border-default rounded-2xl text-sm text-text-dark placeholder:text-text-muted bg-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-t-2xl border border-border-default flex border-b-0">
              {(["providers", "seekers"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => switchTab(t)}
                  className={`flex-1 py-3.5 text-sm font-semibold capitalize transition-colors relative min-h-[44px] ${
                    tab === t ? "text-primary" : "text-text-muted hover:text-text-medium"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                  {tab === t && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Category chips */}
            <CategoryChips active={activeChip} onChange={switchChip} />

            {/* Feed */}
            {loading ? (
              <div className="flex flex-col gap-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : error ? (
              <EmptyState
                title="Could not load feed"
                message={error}
                action="Retry"
                onAction={() => window.location.reload()}
              />
            ) : items.length === 0 ? (
              <EmptyState
                title="No results found"
                message="Try adjusting your filters or search query."
                action="Clear filters"
                onAction={resetFilters}
              />
            ) : (
              <div className="flex flex-col gap-4">
                {items.map((item) => (
                  <div key={item.id}>
                    <DiscoverCard
                      item={item}
                      onBookmark={setBookmarked}
                      isBookmarked={bookmarkedIds.has(item.id)}
                      onGetStarted={
                        tab === "seekers"
                          ? () => handleExpand(item.id)
                          : () => setApplyPostId(item.id)
                      }
                      onExpand={tab === "seekers" ? handleExpand : undefined}
                      isExpanded={expandedCardId === item.id}
                    />
                    {tab === "seekers" && expandedCardId === item.id && (
                      <ExpandedCard
                        item={item}
                        onApply={() => setApplyPostId(item.id)}
                      />
                    )}
                  </div>
                ))}

                {nextCursor && (
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="w-full py-3 border border-primary text-primary font-semibold rounded-2xl hover:bg-primary-light transition-colors disabled:opacity-50 min-h-[44px]"
                  >
                    {loadingMore ? "Loading…" : "Load more"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Right panel ── */}
          <div className="hidden lg:block w-[354px] shrink-0">
            <div className="flex flex-col gap-4 sticky top-[84px]">
              <CreatePostDropdown />
              <FilterPanel
                filters={pendingFilters}
                onChange={setPendingFilters}
                onApply={applyFilters}
                onReset={resetFilters}
              />
              <PromoCard />
              {helpVisible && (
                <HelpBox onDismiss={() => setHelpVisible(false)} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Apply modal */}
      {applyPostId && (
        <ApplyModal
          postId={applyPostId}
          onClose={() => setApplyPostId(null)}
        />
      )}
    </div>
  );
}

function EmptyState({
  title,
  message,
  action,
  onAction,
}: {
  title: string;
  message: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border-default p-10 text-center">
      <p className="font-semibold text-text-dark text-base mb-1">{title}</p>
      <p className="text-text-muted text-sm mb-4">{message}</p>
      <button
        onClick={onAction}
        className="bg-primary text-white font-semibold px-6 py-2 rounded-full hover:bg-orange-600 transition-colors text-sm min-h-[44px]"
      >
        {action}
      </button>
    </div>
  );
}
