import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchDiscoverFeed,
  toggleBookmark,
  type DiscoverItem,
  type DiscoverFeedParams,
} from "../services/discoverService";

export type Tab = "providers" | "seekers";

export type FilterState = {
  subCategory: string;
  deliveryMode: string;
  payment: string;
  levelOfParticipant: string;
};

const EMPTY_FILTERS: FilterState = {
  subCategory: "",
  deliveryMode: "",
  payment: "",
  levelOfParticipant: "",
};

export function useDiscover() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState<Tab>(
    (searchParams.get("tab") as Tab) ?? "providers"
  );
  const [activeChip, setActiveChip] = useState(
    searchParams.get("category") ?? "Job Ready Exposures"
  );
  const [rawQuery, setRawQuery] = useState(searchParams.get("q") ?? "");
  const [pendingFilters, setPendingFilters] =
    useState<FilterState>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(EMPTY_FILTERS);

  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState(rawQuery);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(rawQuery);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (rawQuery) next.set("q", rawQuery);
          else next.delete("q");
          return next;
        },
        { replace: true }
      );
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [rawQuery, setSearchParams]);

  const buildParams = useCallback(
    (cursor?: string): DiscoverFeedParams => ({
      tab,
      category: activeChip,
      q: debouncedQuery || undefined,
      cursor,
      subCategory: appliedFilters.subCategory || undefined,
      deliveryMode: appliedFilters.deliveryMode || undefined,
      payment: appliedFilters.payment || undefined,
      levelOfParticipant: appliedFilters.levelOfParticipant || undefined,
    }),
    [tab, activeChip, debouncedQuery, appliedFilters]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await fetchDiscoverFeed(buildParams());
      setItems(page.items);
      setNextCursor(page.nextCursor);
      const initialBookmarks = new Set(
        page.items.filter((i) => i.isBookmarked).map((i) => i.id)
      );
      setBookmarkedIds(initialBookmarks);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchDiscoverFeed(buildParams(nextCursor));
      const existingIds = new Set(items.map((i) => i.id));
      const newItems = page.items.filter((i) => !existingIds.has(i.id));
      setItems((prev) => [...prev, ...newItems]);
      setNextCursor(page.nextCursor);
    } catch {
      // silently fail on load more
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, buildParams, items]);

  const setBookmarked = useCallback(
    async (id: string) => {
      const wasBookmarked = bookmarkedIds.has(id);
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (wasBookmarked) next.delete(id);
        else next.add(id);
        return next;
      });
      try {
        await toggleBookmark(id, !wasBookmarked);
      } catch {
        // revert on failure
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          if (wasBookmarked) next.add(id);
          else next.delete(id);
          return next;
        });
      }
    },
    [bookmarkedIds]
  );

  const switchTab = useCallback(
    (t: Tab) => {
      setTab(t);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("tab", t);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const switchChip = useCallback(
    (chip: string) => {
      setActiveChip(chip);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("category", chip);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const applyFilters = useCallback(() => {
    setAppliedFilters(pendingFilters);
  }, [pendingFilters]);

  const resetFilters = useCallback(() => {
    setPendingFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  }, []);

  return {
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
    appliedFilters,
    applyFilters,
    resetFilters,
    reload: load,
  };
}
