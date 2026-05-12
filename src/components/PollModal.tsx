import { useState } from "react";
import { VisibleToDropdown } from "./VisibleToDropdown";

type PollType = "poll" | "question";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userAvatar: string;
};

export default function PollModal({ isOpen, onClose, userAvatar }: Props) {
  const [pollType, setPollType] = useState<PollType>("poll");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  if (!isOpen) return null;

  const userName = (() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") ?? "{}");
      return u?.name ?? u?.org_name ?? "Vishnu Kumar Agrawal";
    } catch {
      return "Vishnu Kumar Agrawal";
    }
  })();

  function addOption() {
    if (options.length < 4) setOptions((prev) => [...prev, ""]);
  }

  function updateOption(idx: number, val: string) {
    setOptions((prev) => prev.map((o, i) => (i === idx ? val : o)));
  }

  function handleClose() {
    setPollType("poll");
    setQuestion("");
    setOptions(["", ""]);
    onClose();
  }

  const optionPlaceholders = [
    "E.g., Public transportation",
    "E.g., Drive myself",
    "Option 3",
    "Option 4",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative bg-white rounded-2xl w-full max-w-[600px] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#f2f2f3]">
          <div className="flex items-center gap-3">
            <img
              src={userAvatar}
              alt=""
              className="w-12 h-12 rounded-full object-cover shrink-0"
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-[#18191c] text-base">
                  {userName}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="#18191c"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-[#9ca3af] text-sm">Post to Anyone</span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="#374151"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Type toggle */}
          <div>
            <p className="text-[#18191c] text-sm font-medium mb-3">
              What would you like to create?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPollType("poll")}
                className={`flex-1 py-2.5 rounded-full border text-sm font-medium transition-colors ${
                  pollType === "poll"
                    ? "border-[#f77f00] text-[#f77f00]"
                    : "border-[#e5e7eb] text-[#9ca3af]"
                }`}
              >
                Poll
              </button>
              <button
                onClick={() => setPollType("question")}
                className={`flex-1 py-2.5 rounded-full border text-sm font-medium transition-colors ${
                  pollType === "question"
                    ? "border-[#f77f00] text-[#f77f00]"
                    : "border-[#e5e7eb] text-[#9ca3af]"
                }`}
              >
                Question
              </button>
            </div>
          </div>

          {/* Your Question */}
          <div>
            <label className="block text-[#18191c] text-sm font-medium mb-1.5">
              Your Question
            </label>
            {pollType === "poll" ? (
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="E.g., How do you commute to work?"
                className="w-full border border-[#e5e7eb] rounded-xl px-4 py-3 text-sm text-[#18191c] placeholder:text-[#d1d5db] outline-none focus:border-[#f77f00] transition-colors"
              />
            ) : (
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="E.g., How do you commute to work?"
                rows={5}
                className="w-full border border-[#e5e7eb] rounded-xl px-4 py-3 text-sm text-[#18191c] placeholder:text-[#d1d5db] outline-none focus:border-[#f77f00] transition-colors resize-none"
              />
            )}
          </div>

          {/* Poll options */}
          {pollType === "poll" && (
            <>
              {options.map((opt, idx) => (
                <div key={idx}>
                  <label className="block text-[#18191c] text-sm font-medium mb-1.5">
                    Option {idx + 1}
                  </label>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    placeholder={optionPlaceholders[idx] ?? `Option ${idx + 1}`}
                    className="w-full border border-[#e5e7eb] rounded-xl px-4 py-3 text-sm text-[#18191c] placeholder:text-[#d1d5db] outline-none focus:border-[#f77f00] transition-colors"
                  />
                </div>
              ))}

              {options.length < 4 && (
                <button
                  onClick={addOption}
                  className="self-start flex items-center gap-2 px-5 py-2.5 border border-[#f77f00] text-[#f77f00] rounded-full text-sm font-medium hover:bg-[#fff8ee] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 5v14M5 12h14"
                      stroke="#f77f00"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  Add option
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#f2f2f3]">
          <VisibleToDropdown />
          <button className="bg-[#f77f00] text-white font-semibold text-sm px-8 py-2.5 rounded-full hover:bg-[#e88500] transition-colors">
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
