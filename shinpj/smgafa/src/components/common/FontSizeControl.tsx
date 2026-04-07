"use client";

import { useState, useEffect } from "react";

const FONT_SIZES = [
  { label: "가", size: 16, name: "기본" },
  { label: "가", size: 18, name: "크게" },
  { label: "가", size: 20, name: "더 크게" },
];

export default function FontSizeControl() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("fontSize");
    if (saved) {
      const idx = FONT_SIZES.findIndex((f) => f.size === Number(saved));
      if (idx >= 0) {
        setActiveIndex(idx);
        document.documentElement.style.setProperty("--root-font-size", `${FONT_SIZES[idx].size}px`);
      }
    }
  }, []);

  const changeFontSize = (index: number) => {
    setActiveIndex(index);
    const size = FONT_SIZES[index].size;
    document.documentElement.style.setProperty("--root-font-size", `${size}px`);
    localStorage.setItem("fontSize", String(size));
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-300 font-medium text-[1rem]">글씨 크기</span>
      <div className="flex items-center gap-1.5">
        {FONT_SIZES.map((fs, i) => (
          <button
            key={fs.size}
            onClick={() => changeFontSize(i)}
            className={`flex items-center justify-center rounded-lg border-2 transition-all duration-200 ${
              i === activeIndex
                ? "border-accent-light bg-accent-light/10 text-white"
                : "border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-300"
            }`}
            style={{
              width: `${32 + i * 6}px`,
              height: `${32 + i * 6}px`,
              fontSize: `${14 + i * 3}px`,
            }}
            aria-label={`글씨 크기 ${fs.name}`}
            title={fs.name}
          >
            {fs.label}
          </button>
        ))}
      </div>
    </div>
  );
}
