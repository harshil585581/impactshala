const thumbsUp =
  "https://www.figma.com/api/mcp/asset/092c6e79-91ce-4791-8f41-c5cb008743e7";
const heart =
  "https://www.figma.com/api/mcp/asset/bcbffbcb-b12e-42ae-821f-b8c199325a1b";
const clapping =
  "https://www.figma.com/api/mcp/asset/f6cd896e-60fe-4c92-be76-448468a9ee64";
const likeIcon =
  "https://www.figma.com/api/mcp/asset/a9024820-e2d0-4d64-88c2-c327a505bfa7";
const commentIcon =
  "https://www.figma.com/api/mcp/asset/3c50c38d-b5d0-4d47-88cf-a30418e6ece0";
const shareIcon =
  "https://www.figma.com/api/mcp/asset/ad231854-cd0f-408d-9ac7-b8085743a489";
const saveIcon =
  "https://www.figma.com/api/mcp/asset/319fafae-432a-4c02-8f5e-b9e6d71902a8";
const globeIcon =
  "https://www.figma.com/api/mcp/asset/2cd0f3e5-8141-4257-9123-c4e5cc770cfa";

type PollOption = {
  label: string;
  percentage?: number;
};

type PostCardProps = {
  avatar: string;
  name: string;
  title: string;
  time: string;
  badge?: string;
  content?: string;
  image?: string;
  hashtags?: string;
  pollOptions?: PollOption[];
  pollMeta?: string;
  reactions: number;
  comments: number;
  onFollow?: () => void;
};

export default function PostCard({
  avatar,
  name,
  title,
  time,
  badge,
  content,
  image,
  hashtags,
  pollOptions,
  pollMeta,
  reactions,
  comments,
}: PostCardProps) {
  return (
    <div className="bg-white border border-[#ececec] rounded-2xl shadow-[0px_1px_1px_rgba(0,0,0,0.05)] overflow-hidden">
      {/* Post Header */}
      <div className="flex items-start justify-between px-6 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <img
            src={avatar}
            alt={name}
            className="w-11 h-11 rounded-full object-cover shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#282828] text-sm leading-snug">
                {name}
              </span>
              {badge && <span className="text-xs text-[#666]">{badge}</span>}
            </div>
            <p className="text-[#666] text-xs mt-0.5">{title}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[#666] text-xs">{time}</span>
              <span className="text-[#666] text-xs">·</span>
              <img
                src={globeIcon}
                alt="Public"
                className="w-3.5 h-3.5 opacity-50"
              />
            </div>
          </div>
        </div>
        <button className="text-[#f77f00] text-sm font-semibold flex items-center gap-1 hover:opacity-80">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12h14"
              stroke="#f77f00"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          Follow
        </button>
      </div>

      {/* Post Content */}
      {content && (
        <div className="px-6 pb-3">
          <p className="text-[#222] text-base leading-relaxed">
            {content}{" "}
            <span className="text-[#666] text-sm cursor-pointer">....more</span>
          </p>
        </div>
      )}

      {/* Hashtags */}
      {hashtags && (
        <div className="px-6 pb-3">
          <p className="text-[#f77f00] text-sm leading-relaxed">{hashtags}</p>
        </div>
      )}

      {/* Post Image */}
      {image && (
        <div className="px-4 pb-3">
          <img
            src={image}
            alt="Post"
            className="w-full h-[200px] object-cover rounded-lg"
          />
        </div>
      )}

      {/* Poll Options */}
      {pollOptions && (
        <div className="px-6 pb-3 flex flex-col gap-2">
          {pollOptions.map((opt) => (
            <button
              key={opt.label}
              className="w-full text-left border border-[#e0e0e0] rounded-lg px-4 py-2.5 text-[#333] text-sm hover:border-[#f77f00] hover:bg-[#fff8ee] transition-colors"
            >
              {opt.label}
            </button>
          ))}
          {pollMeta && <p className="text-[#888] text-xs mt-1">{pollMeta}</p>}
        </div>
      )}

      {/* Reactions & Comments Count */}
      <div className="px-6 py-2 flex items-center justify-between border-t border-[#f2f2f3]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <img src={thumbsUp} alt="" className="w-6 h-6" />
            <img src={heart} alt="" className="w-6 h-6 -ml-2" />
            <img src={clapping} alt="" className="w-6 h-6 -ml-2" />
          </div>
          <span className="text-[#646464] text-sm font-semibold">
            {reactions.toLocaleString()}
          </span>
        </div>
        <span className="text-[#6f6f6f] text-sm font-semibold">
          {comments} comments
        </span>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-2 flex items-center justify-around border-t border-[#f2f2f3]">
        <button className="flex items-center gap-2 text-[#575555] text-base font-medium hover:text-[#f77f00] transition-colors py-2">
          <img src={likeIcon} alt="" className="w-6 h-6" />
          Like
        </button>
        <button className="flex items-center gap-2 text-[#575555] text-base font-medium hover:text-[#f77f00] transition-colors py-2">
          <img src={commentIcon} alt="" className="w-6 h-6" />
          Comment
        </button>
        <button className="flex items-center gap-2 text-[#575555] text-base font-medium hover:text-[#f77f00] transition-colors py-2">
          <img src={shareIcon} alt="" className="w-6 h-6" />
          Share
        </button>
        <button className="flex items-center gap-2 text-[#575555] text-base font-medium hover:text-[#f77f00] transition-colors py-2">
          <img src={saveIcon} alt="" className="w-6 h-6" />
          Save
        </button>
      </div>
    </div>
  );
}
