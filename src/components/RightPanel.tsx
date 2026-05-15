import { useState, useEffect } from "react";
import { useProfile } from "../hooks/useProfile";
import { fetchExperiences } from "../services/experienceService";
import type { Experience } from "../services/experienceService";

const courseImg = "https://placehold.co/354x120/003049/ffffff?text=UI/UX+Course";

export default function RightPanel() {
  const [helpDismissed, setHelpDismissed] = useState(false);
  const storedUser = JSON.parse(localStorage.getItem("user") ?? "{}");
  const { profile } = useProfile("me");
  const [currentExp, setCurrentExp] = useState<Experience | null>(null);

  useEffect(() => {
    if (storedUser.id) {
      fetchExperiences(storedUser.id)
        .then((exps) => {
          const current = exps.find((e) => e.is_current);
          setCurrentExp(current || exps[0] || null);
        })
        .catch(() => {});
    }
  }, [storedUser.id]);

  function formatName(f?: string, l?: string, org?: string) {
    const full = [f, l].filter(s => s && s !== "unknown").join(" ");
    return full || org || "User";
  }

  const name = profile
    ? formatName(profile.firstName, profile.lastName, profile.orgName)
    : formatName(storedUser.first_name, storedUser.last_name, storedUser.org_name);

  const avatar = profile?.avatarUrl || storedUser.avatar_url;

  const headline = (() => {
    if (currentExp) return `${currentExp.role} at ${currentExp.company}`;
    if (profile?.title || profile?.company) {
      return [profile.title, profile.company].filter(Boolean).join(" at ");
    }
    if (storedUser.title || storedUser.company) {
      return [storedUser.title, storedUser.company].filter(Boolean).join(" at ");
    }
    return "Add your experience";
  })();

  return (
    <aside className="w-[354px] shrink-0 flex flex-col gap-6">
      {/* User Profile Card */}
      <div className="bg-white border border-[#f2f2f3] rounded-[14px] overflow-hidden shadow-sm">
        {/* Banner */}
        <div className="h-[80px] bg-[#003049]" />
        {/* Avatar */}
        <div className="flex flex-col items-center px-5 pb-6 -mt-10">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-20 h-20 rounded-full border-4 border-white object-cover bg-white"
            />
          ) : (
            <div className="w-20 h-20 rounded-full border-4 border-white bg-[#FF9400] flex items-center justify-center text-white text-2xl font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="mt-3 text-center w-full px-2">
            <h3 className="text-[#282828] text-lg font-semibold truncate">
              {name}
            </h3>
            <div className="mt-1 text-[#666] text-xs px-4 truncate w-full text-center">
              {headline}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 mt-5 w-full justify-center">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[#FF9400] text-sm font-bold">183</span>
              <span className="text-black text-[10px] font-medium text-center leading-tight">
                Recommendations
              </span>
            </div>
            <div className="w-px h-10 bg-[#FF9400]/30" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-[#FF9400] text-sm font-bold">60</span>
              <span className="text-black text-[10px] font-medium text-center leading-tight">
                Credibility
              </span>
            </div>
            <div className="w-px h-10 bg-[#FF9400]/30" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-[#FF9400] text-sm font-bold">48</span>
              <span className="text-black text-[10px] font-medium text-center leading-tight">
                Achievement
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Course Card */}
      <div className="bg-white border border-[#f2f2f3] rounded-[14px] overflow-hidden shadow-sm">
        <img
          src={courseImg}
          alt="Figma Design"
          className="w-full h-[120px] object-cover"
        />
        <div className="p-5 flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <h4 className="text-[#282828] text-lg font-semibold">
              UI/UX Certification Course
            </h4>
            <span className="bg-[#fff8ee] text-[#FF9400] text-xs font-semibold px-3 py-1 rounded-full w-fit border border-[#ffeacc]">
              Onsite
            </span>
            <p className="text-[#666] text-sm leading-relaxed line-clamp-3">
              Master the fundamentals of UI/UX design with this comprehensive course. Learn Figma, user research, and prototyping.
            </p>
          </div>
          <button className="self-center border border-[#FF9400] text-[#FF9400] text-sm font-semibold px-10 py-2.5 rounded-full hover:bg-[#FF9400] hover:text-white transition-all">
            Know More
          </button>
        </div>
        {/* Pagination dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          <div className="w-2 h-2 rounded-full bg-[#FF9400]" />
          <div className="w-2 h-2 rounded-full bg-[#d9d9d9]" />
          <div className="w-2 h-2 rounded-full bg-[#d9d9d9]" />
        </div>
      </div>

      {/* Help Box */}
      {!helpDismissed && (
        <div className="bg-[#fffcf8] border border-[#ffeacc] rounded-[17px] p-4 flex flex-col gap-2 relative shadow-sm">
          <div className="flex items-start justify-between">
            <svg width="32" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="#FF9400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="#FF9400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <button
              onClick={() => setHelpDismissed(true)}
              className="text-[#9ca3af] hover:text-[#6b7280] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <div>
            <p className="text-[#FF9400] text-lg font-bold leading-snug">
              Help Box
            </p>
            <p className="text-[#7c8493] text-sm mt-0.5 leading-relaxed">
              Not able to find what you're looking for? Let us help you.
            </p>
          </div>
          <button className="bg-[#FF9400] text-white text-sm font-semibold px-6 py-2 rounded-full w-fit hover:bg-[#e68500] transition-all shadow-md active:scale-95">
            Click Here
          </button>
        </div>
      )}
    </aside>
  );
}
