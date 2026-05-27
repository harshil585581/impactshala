import React, { useState } from "react";
import type { DiscoverItem } from "../../services/discoverService";

type Props = {
  item: DiscoverItem;
  onBookmark: (id: string) => void;
  isBookmarked: boolean;
  onGetStarted?: () => void;
  onExpand?: (id: string) => void;
  isExpanded?: boolean;
};

export default function DiscoverCard({
  item,
  onBookmark,
  isBookmarked,
  onGetStarted,
  onExpand,
  isExpanded,
}: Props) {
  const [showMore, setShowMore] = useState(false);

  return (
    <article className="bg-white rounded-2xl border border-border-default overflow-hidden">
      <div className="px-5 pt-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <img
              src={item.avatarUrl || "https://placehold.co/56x56/ff9400/ffffff"}
              alt={item.name}
              className="w-14 h-14 rounded-full object-cover shrink-0"
            />
            <div>
              <p className="font-semibold text-text-dark text-base leading-tight">
                {item.name}
              </p>
              <p className="text-text-muted text-sm">
                {item.role} • {item.company}
              </p>
              <div className="flex items-center gap-1 text-text-muted text-xs mt-0.5">
                <span>{item.postedAt}</span>
                <span>•</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#9ca3af" strokeWidth="1.5" />
                  <path
                    d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"
                    stroke="#9ca3af"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Right: Get Started + bookmark */}
          <div className="flex items-center gap-2 shrink-0 pt-1">
            {onGetStarted && (
              <button
                onClick={onGetStarted}
                className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-full hover:bg-orange-600 transition-colors min-h-[44px] whitespace-nowrap"
              >
                Get Started
              </button>
            )}
            <button
              onClick={() => onBookmark(item.id)}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
              className="p-2 hover:bg-border-light rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <svg width="35" height="30" viewBox="0 0 24 24" fill={isBookmarked ? "#f77f00" : "none"} className="text-primary">
                <path
                  d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"
                  stroke="#f77f00"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-text-dark font-bold text-lg mb-2">{item.title}</h3>

        {/* Category tags */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {item.badge && (
            <span className="px-3 py-1 border border-border-default rounded-full text-xs text-text-medium font-medium whitespace-nowrap">
              {item.badge}
            </span>
          )}
          <span className="text-xs text-text-medium">
            {[item.categoryTag, item.subTags].filter(Boolean).join(" • ")}
          </span>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4">
          <p className="text-text-medium text-sm">
            <span className="font-semibold">Mode :</span>{" "}
            <span className="font-normal">{item.mode}</span>
          </p>
          <p className="text-text-medium text-sm">
            <span className="font-semibold">Payment :</span>{" "}
            <span className="font-normal">{item.payment}</span>
          </p>
          <p className="text-text-medium text-sm">
            <span className="font-semibold">Target audience :</span>{" "}
            <span className="font-normal text-primary">{item.targetAudience}</span>
          </p>
          <p className="text-text-medium text-sm">
            <span className="font-semibold">Last date to apply :</span>{" "}
            <span className="font-normal">{item.lastDate}</span>
          </p>
        </div>
      </div>

      {/* Cover image */}
      <img
        src={item.imageUrl || "https://placehold.co/670x150/f5f5f5/cccccc"}
        alt=""
        className="w-full h-[150px] object-cover"
      />

      <div className="px-5 py-4">
        {/* Body text */}
        {item.body && (
          <>
            <p
              className={`text-text-medium text-sm mb-2 leading-relaxed ${showMore ? "" : "line-clamp-2"}`}
            >
              {item.body}
            </p>
            <button
              onClick={() => setShowMore((v) => !v)}
              className="text-primary text-sm font-medium hover:underline mb-3 block"
            >
              {showMore ? "Show less" : "Show more"}
            </button>
          </>
        )}

        {/* Seekers: expand for opportunity details */}
        {item.type === "seeker" && onExpand && (
          <button
            onClick={() => onExpand(item.id)}
            className="text-primary text-sm font-semibold mb-3 block hover:underline"
          >
            {isExpanded ? "▲ Hide details" : "▼ View opportunity details"}
          </button>
        )}

        {/* Reactions */}
        <div className="flex items-center justify-between text-sm text-text-muted mb-3">
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1">
              <span className="text-base">👍</span>
              <span className="text-base">❤️</span>
              <span className="text-base">🌟</span>
            </div>
            <span>{item.reactions.toLocaleString()}</span>
          </div>
          <span>{item.comments} comments</span>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-around border-t border-border-light pt-3">
          <ActionBtn icon="like" label="Like" />
          <ActionBtn icon="comment" label="Comment" />
          <ActionBtn icon="share" label="Share" />
          <ActionBtn icon="save" label="Save" />
        </div>
      </div>
    </article>
  );
}

function ActionBtn({ icon, label }: { icon: string; label: string }) {
  const paths: Record<string, React.ReactElement> = {
    like: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        />
        <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    comment: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    share: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    save: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  };

  return (
    <button className="flex items-center gap-1.5 text-text-muted text-sm hover:text-primary transition-colors py-1 px-2 min-h-[44px]">
      {paths[icon]}
      {label}
    </button>
  );
}
