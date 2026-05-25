import { useState } from "react";

const SLIDES = [
  {
    heading: "Figma Design",
    sub: "Learn & Explore more at impactshaala.com",
    title: "UI/UX Certification Course",
    mode: "Onsite",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Vivamus ac tellus nec velit finibus egestas.",
  },
  {
    heading: "React Development",
    sub: "Hands-on workshops at impactshaala.com",
    title: "Full-Stack Bootcamp",
    mode: "Online",
    body: "Build real-world projects with React and Node. Join our intensive program and launch your tech career.",
  },
  {
    heading: "Data Science",
    sub: "Learn & Explore more at impactshaala.com",
    title: "AI & ML Certification",
    mode: "Hybrid",
    body: "Master machine learning algorithms, data analysis, and AI applications with industry experts.",
  },
];

export default function PromoCard() {
  const [current, setCurrent] = useState(0);
  const slide = SLIDES[current];

  return (
    <div className="bg-white rounded-2xl border border-border-default overflow-hidden">
      {/* Dark header */}
      <div className="bg-card-dark px-4 py-4 text-center">
        <p className="text-white font-bold text-base">{slide.heading}</p>
        <p className="text-text-muted text-xs mt-0.5">{slide.sub}</p>
      </div>

      <div className="p-4">
        <p className="text-text-dark font-semibold text-sm">{slide.title}</p>
        <span className="inline-block mt-2 px-3 py-1 bg-primary-light text-primary text-xs font-medium rounded-full">
          {slide.mode}
        </span>
        <p className="text-text-muted text-xs mt-2 leading-relaxed">{slide.body}</p>
        <button className="mt-3 w-full border border-primary text-primary text-sm font-semibold py-2.5 rounded-full hover:bg-primary-light transition-colors min-h-[44px]">
          Know More
        </button>

        {/* Dot pagination */}
        <div className="flex justify-center gap-1.5 mt-3">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === current ? "bg-primary" : "bg-border-default"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
