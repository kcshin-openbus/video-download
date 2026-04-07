"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { navigation } from "@/data/navigation";
import gsap from "gsap";
import ThemeToggle from "@/components/common/ThemeToggle";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileSubOpen, setMobileSubOpen] = useState<string | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileOverlayRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (mobileOpen) {
      gsap.fromTo(mobileOverlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" });
      gsap.fromTo(mobileMenuRef.current, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: 0.4, ease: "power3.out" });
      gsap.fromTo(menuItemsRef.current.filter(Boolean), { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: "power2.out", stagger: 0.06, delay: 0.1 });
    }
  }, [mobileOpen]);

  const closeMobileMenu = () => {
    const tl = gsap.timeline({ onComplete: () => setMobileOpen(false) });
    tl.to(mobileOverlayRef.current, { opacity: 0, duration: 0.25, ease: "power2.in" }, 0);
    tl.to(mobileMenuRef.current, { height: 0, opacity: 0, duration: 0.3, ease: "power2.in" }, 0);
  };

  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    navigation.forEach((item) => {
      if (!item.children) return;
      const el = subMenuRefs.current[item.label];
      if (!el) return;
      if (mobileSubOpen === item.label) {
        gsap.set(el, { display: "block" });
        gsap.fromTo(el, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: 0.3, ease: "power2.out" });
      } else {
        gsap.to(el, { height: 0, opacity: 0, duration: 0.25, ease: "power2.in", onComplete: () => { gsap.set(el, { display: "none" }); } });
      }
    });
  }, [mobileSubOpen]);

  return (
    <>
      <header className="bg-bg-base/80 dark:bg-bg-base/80 backdrop-blur-xl border-b border-border/60 sticky top-0 z-50">
        <nav className="max-w-[1520px] mx-auto px-5 md:px-6">
          <div className="flex items-center justify-between h-[68px] md:h-[76px]">
            {/* 로고 */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white font-extrabold text-[1.125rem] leading-none">시</span>
              </div>
              <div className="leading-[1.25]">
                <p className="text-heading font-bold text-[1rem]">시민재가노인지원</p>
                <p className="text-heading font-bold text-[1rem]">서비스센터</p>
              </div>
            </Link>

            {/* 데스크탑 메뉴 */}
            <ul className="hidden lg:flex items-center gap-0.5">
              {navigation.map((item) => (
                <li
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <Link
                    href={item.href}
                    className={`px-5 py-2.5 rounded-lg font-semibold text-[1.125rem] transition-colors ${
                      openDropdown === item.label
                        ? "text-primary bg-primary-light"
                        : "text-heading hover:text-primary hover:bg-primary-light/50"
                    }`}
                  >
                    {item.label}
                  </Link>
                  {item.children && openDropdown === item.label && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 min-w-[200px]">
                      <ul className="bg-bg-card shadow-lg rounded-xl py-2 border border-border ring-1 ring-black/5 dark:ring-white/5">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className="block px-5 py-2.5 text-[1rem] text-body hover:text-primary hover:bg-primary-light/50 transition-colors"
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {/* 우측 액션 */}
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-bg-section transition-colors"
                onClick={() => (mobileOpen ? closeMobileMenu() : setMobileOpen(true))}
                aria-label="메뉴 열기"
              >
                <svg className="w-6 h-6 text-heading" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* 모바일 메뉴 */}
      {mobileOpen && (
        <>
          <div ref={mobileOverlayRef} className="fixed inset-0 bg-black/25 backdrop-blur-sm z-40 lg:hidden" onClick={closeMobileMenu} />
          <div ref={mobileMenuRef} className="fixed top-[68px] left-0 right-0 z-50 bg-bg-base shadow-xl overflow-y-auto max-h-[calc(100vh-68px)] lg:hidden border-b border-border">
            <div className="py-2 px-2">
              {navigation.map((item, i) => (
                <div key={item.href} ref={(el) => { menuItemsRef.current[i] = el; }}>
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      className={`flex-1 px-4 py-3.5 rounded-lg font-semibold text-[1.0625rem] transition-colors ${
                        mobileSubOpen === item.label ? "text-primary" : "text-heading"
                      }`}
                      onClick={() => { if (!item.children) closeMobileMenu(); }}
                    >
                      {item.label}
                    </Link>
                    {item.children && (
                      <button
                        onClick={() => setMobileSubOpen(mobileSubOpen === item.label ? null : item.label)}
                        className="px-4 py-3.5 text-muted"
                        aria-label={`${item.label} 하위메뉴 열기`}
                      >
                        <svg
                          className={`w-4 h-4 transition-transform duration-300 ${mobileSubOpen === item.label ? "rotate-180" : ""}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {item.children && (
                    <div ref={(el) => { subMenuRefs.current[item.label] = el; }} className="overflow-hidden" style={{ display: "none", height: 0 }}>
                      <div className="ml-4 mr-2 mb-2 rounded-xl bg-bg-section border border-border-light">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block px-4 py-3 text-[1rem] text-body hover:text-primary transition-colors"
                            onClick={closeMobileMenu}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
