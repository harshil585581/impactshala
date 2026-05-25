import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CreatePostDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full bg-primary text-white font-semibold py-3 rounded-full hover:bg-orange-600 transition-colors text-base min-h-[44px]"
      >
        Create post
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-border-default rounded-xl shadow-lg z-30 overflow-hidden">
          <button
            onClick={() => {
              setOpen(false);
              navigate("/discover/create/provider");
            }}
            className="w-full text-left px-4 py-3 text-sm text-text-medium hover:bg-primary-light transition-colors min-h-[44px]"
          >
            Post as a provider
          </button>
          <button
            onClick={() => {
              setOpen(false);
              navigate("/discover/create/seeker");
            }}
            className="w-full text-left px-4 py-3 text-sm text-text-medium hover:bg-primary-light transition-colors min-h-[44px]"
          >
            Post as a seeker
          </button>
        </div>
      )}
    </div>
  );
}
