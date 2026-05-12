import { useState, useRef } from "react";
import { VisibleToDropdown } from "./VisibleToDropdown";

type EventType = "online" | "inperson";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userAvatar: string;
};

export default function EventModal({ isOpen, onClose, userAvatar }: Props) {
  const [eventType, setEventType] = useState<EventType>("online");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [registrationLink, setRegistrationLink] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [addEndDateTime, setAddEndDateTime] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const userName = (() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") ?? "{}");
      return u?.name ?? "Vishnu Kumar Agrawal";
    } catch {
      return "Vishnu Kumar Agrawal";
    }
  })();

  function handleCoverFile(file: File) {
    if (coverUrl) URL.revokeObjectURL(coverUrl);
    setCoverUrl(URL.createObjectURL(file));
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleCoverFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleCoverFile(file);
  }

  function handleClose() {
    if (coverUrl) URL.revokeObjectURL(coverUrl);
    setCoverUrl(null);
    setEventType("online");
    setTitle("");
    setRegistrationLink("");
    setEventLocation("");
    setStartDate("");
    setStartTime("");
    setAddEndDateTime(false);
    setEndDate("");
    setEndTime("");
    setDescription("");
    onClose();
  }

  const calendarIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        stroke="#9ca3af"
        strokeWidth="1.5"
      />
      <line
        x1="16"
        y1="2"
        x2="16"
        y2="6"
        stroke="#9ca3af"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="2"
        x2="8"
        y2="6"
        stroke="#9ca3af"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line x1="3" y1="10" x2="21" y2="10" stroke="#9ca3af" strokeWidth="1.5" />
    </svg>
  );

  const clockIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#9ca3af" strokeWidth="1.5" />
      <polyline
        points="12 7 12 12 15 15"
        stroke="#9ca3af"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-[600px] max-h-[90vh] flex flex-col shadow-2xl">
        {/* Sticky header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#f2f2f3] shrink-0">
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

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">
          {/* Cover image */}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverChange}
          />

          {coverUrl ? (
            <div
              className="relative rounded-xl overflow-hidden cursor-pointer group"
              onClick={() => coverInputRef.current?.click()}
            >
              <img
                src={coverUrl}
                alt="Cover"
                className="w-full h-[200px] object-cover"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  Change cover
                </span>
              </div>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 py-10 cursor-pointer transition-colors ${isDragging ? "border-[#f77f00] bg-[#fff8ee]" : "border-[#e5e7eb] bg-[#fafafa] hover:border-[#f77f00] hover:bg-[#fff8ee]"}`}
              onClick={() => coverInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 16V4M12 4l-4 4M12 4l4 4"
                  stroke="#9ca3af"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1"
                  stroke="#9ca3af"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="text-center">
                <p className="text-[#374151] text-sm">
                  <span className="font-semibold">Upload cover image</span> or
                  drop here
                </p>
                <p className="text-[#9ca3af] text-xs mt-1 px-4">
                  Banner images optimal dimension 1520×400. Supported format
                  JPEG, PNG. Max photo size 5 MB.
                </p>
              </div>
            </div>
          )}

          {/* Event Type */}
          <div>
            <label className="block text-[#18191c] text-sm font-medium mb-3">
              Event Type
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setEventType("online")}
                className={`flex-1 py-2.5 rounded-full border text-sm font-medium transition-colors ${
                  eventType === "online"
                    ? "border-[#f77f00] text-[#f77f00] bg-white"
                    : "border-[#e5e7eb] text-[#9ca3af] bg-white"
                }`}
              >
                Online
              </button>
              <button
                onClick={() => setEventType("inperson")}
                className={`flex-1 py-2.5 rounded-full border text-sm font-medium transition-colors ${
                  eventType === "inperson"
                    ? "border-[#f77f00] text-[#f77f00] bg-white"
                    : "border-[#e5e7eb] text-[#9ca3af] bg-white"
                }`}
              >
                In person
              </button>
            </div>
          </div>

          {/* Event Title */}
          <div>
            <label className="block text-[#18191c] text-sm font-medium mb-1.5">
              Event Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-[#e5e7eb] rounded-xl px-4 py-3 text-sm text-[#18191c] placeholder:text-[#d1d5db] outline-none focus:border-[#f77f00] transition-colors"
            />
          </div>

          {/* Registration Link */}
          <div>
            <label className="block text-[#18191c] text-sm font-medium mb-1.5">
              Registration Link
            </label>
            <div className="relative">
              {eventType === "online" && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
                      stroke="#f77f00"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
                      stroke="#f77f00"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              )}
              <input
                type="text"
                value={registrationLink}
                onChange={(e) => setRegistrationLink(e.target.value)}
                placeholder={
                  eventType === "inperson" ? "Enter your Address" : ""
                }
                className={`w-full border border-[#e5e7eb] rounded-xl py-3 text-sm text-[#18191c] placeholder:text-[#d1d5db] outline-none focus:border-[#f77f00] transition-colors ${
                  eventType === "online" ? "pl-10 pr-4" : "px-4"
                }`}
              />
            </div>
          </div>

          {/* Event Location — In person only */}
          {eventType === "inperson" && (
            <div>
              <label className="block text-[#18191c] text-sm font-medium mb-1.5">
                Event location
              </label>
              <input
                type="text"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="Enter your Address"
                className="w-full border border-[#e5e7eb] rounded-xl px-4 py-3 text-sm text-[#18191c] placeholder:text-[#d1d5db] outline-none focus:border-[#f77f00] transition-colors"
              />
            </div>
          )}

          {/* Start date + Start time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#18191c] text-sm font-medium mb-1.5">
                Start date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-[#e5e7eb] rounded-xl px-4 py-3 pr-10 text-sm text-[#18191c] outline-none focus:border-[#f77f00] transition-colors appearance-none bg-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {calendarIcon}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-[#18191c] text-sm font-medium mb-1.5">
                Start time
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full border border-[#e5e7eb] rounded-xl px-4 py-3 pr-10 text-sm text-[#18191c] outline-none focus:border-[#f77f00] transition-colors appearance-none bg-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {clockIcon}
                </span>
              </div>
            </div>
          </div>

          {/* Add end date and time checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={addEndDateTime}
              onChange={(e) => setAddEndDateTime(e.target.checked)}
              className="w-4 h-4 rounded border-[#d1d5db] accent-[#f77f00]"
            />
            <span className="text-[#374151] text-sm">
              Add end date and time
            </span>
          </label>

          {/* End date + End time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#18191c] text-sm font-medium mb-1.5">
                End date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={!addEndDateTime}
                  className="w-full border border-[#e5e7eb] rounded-xl px-4 py-3 pr-10 text-sm text-[#18191c] outline-none focus:border-[#f77f00] transition-colors appearance-none bg-white disabled:opacity-40"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {calendarIcon}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-[#18191c] text-sm font-medium mb-1.5">
                End time
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={!addEndDateTime}
                  className="w-full border border-[#e5e7eb] rounded-xl px-4 py-3 pr-10 text-sm text-[#18191c] outline-none focus:border-[#f77f00] transition-colors appearance-none bg-white disabled:opacity-40"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {clockIcon}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[#18191c] text-sm font-medium mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: topics, schedule, etc."
              rows={3}
              className="w-full border border-[#e5e7eb] rounded-xl px-4 py-3 text-sm text-[#18191c] placeholder:text-[#d1d5db] outline-none focus:border-[#f77f00] transition-colors resize-none"
            />
          </div>
        </div>

        {/* Sticky footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#f2f2f3] shrink-0">
          <VisibleToDropdown />
          <button className="bg-[#f77f00] text-white font-semibold text-sm px-8 py-2.5 rounded-full hover:bg-[#e88500] transition-colors">
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
