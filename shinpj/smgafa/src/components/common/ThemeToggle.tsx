"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      className="w-9 h-9 rounded-lg flex items-center justify-center text-heading hover:bg-bg-section transition-colors"
      aria-label="다크모드 전환"
    >
      {dark ? (
        <i className="fa-solid fa-sun text-[0.9375rem]" />
      ) : (
        <i className="fa-solid fa-moon text-[0.9375rem]" />
      )}
    </button>
  );
}
