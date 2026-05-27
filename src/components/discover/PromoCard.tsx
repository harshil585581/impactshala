import { useState } from "react";

const SLIDES = [
  {
    headerText: "UI/UX Course",
    title: "UI/UX Certification Course",
    mode: "Onsite",
    body: "Master the fundamentals of UI/UX design with this comprehensive course. Learn Figma, user research, and prototyping.",
  },
  {
    headerText: "React Development",
    title: "Full-Stack Bootcamp",
    mode: "Online",
    body: "Build real-world projects with React and Node. Join our intensive program and launch your tech career.",
  },
  {
    headerText: "Data Science",
    title: "AI & ML Certification",
    mode: "Hybrid",
    body: "Master machine learning algorithms, data analysis, and AI applications with industry experts.",
  },
];

export default function PromoCard() {
  const [current, setCurrent] = useState(0);
  const slide = SLIDES[current];

  return (
    <div className="bg-white border border-[#f2f2f3] rounded-[14px] overflow-hidden shadow-sm">
      {/* Dark header banner */}
      <div className="h-[120px] bg-[#003049] flex items-center justify-center px-4">
        <p className="text-white font-bold text-2xl text-center">{slide.headerText}</p>
      </div>

      <div className="p-5 flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <h4 className="text-[#282828] text-base font-semibold">{slide.title}</h4>
          <span className="bg-[#fff8ee] text-[#FF9400] text-xs font-semibold px-3 py-1 rounded-full w-fit border border-[#ffeacc]">
            {slide.mode}
          </span>
          <p className="text-[#666] text-sm leading-relaxed line-clamp-3">{slide.body}</p>
        </div>
        <button className="self-center border border-[#FF9400] text-[#FF9400] text-sm font-semibold px-10 py-2.5 rounded-full hover:bg-[#FF9400] hover:text-white transition-all">
          Know More
        </button>
      </div>

      {/* Pagination dots */}
      <div className="flex justify-center gap-1.5 pb-4">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Slide ${i + 1}`}
            className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-[#FF9400]" : "bg-[#d9d9d9]"}`}
          />
        ))}
      </div>
    </div>
  );
}
