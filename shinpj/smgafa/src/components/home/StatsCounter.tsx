"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: 19, suffix: "년+", label: "센터 운영", icon: "fa-solid fa-calendar-days" },
  { value: 6, suffix: "개+", label: "협력기관", icon: "fa-solid fa-handshake" },
  { value: 4, suffix: "가지", label: "서비스 영역", icon: "fa-solid fa-hand-holding-heart" },
  { value: 365, suffix: "일", label: "연중무휴 돌봄", icon: "fa-solid fa-clock" },
];

export default function StatsCounter() {
  const sectionRef = useRef<HTMLElement>(null);
  const numbersRef = useRef<(HTMLSpanElement | null)[]>([]);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const iconsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 아이템 순차 등장 (좌→우 슬라이드 + 페이드)
      itemsRef.current.filter(Boolean).forEach((el, i) => {
        gsap.fromTo(el,
          { x: -30, opacity: 0 },
          {
            x: 0, opacity: 1, duration: 0.6, delay: i * 0.12, ease: "power3.out",
            scrollTrigger: { trigger: sectionRef.current, start: "top 88%" },
          }
        );
      });

      // 아이콘 바운스 등장
      iconsRef.current.filter(Boolean).forEach((el, i) => {
        gsap.fromTo(el,
          { scale: 0, rotation: -30 },
          {
            scale: 1, rotation: 0, duration: 0.5, delay: i * 0.12 + 0.2, ease: "back.out(1.7)",
            scrollTrigger: { trigger: sectionRef.current, start: "top 88%" },
          }
        );
      });

      // 숫자 카운트업
      stats.forEach((stat, i) => {
        const el = numbersRef.current[i];
        if (!el) return;
        gsap.fromTo(el,
          { innerText: "0" },
          {
            innerText: stat.value, duration: 2, ease: "power2.out", snap: { innerText: 1 },
            scrollTrigger: { trigger: sectionRef.current, start: "top 85%" },
          }
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-bg-base dark:bg-bg-base border-b border-border/50">
      <div className="max-w-[1520px] mx-auto px-5 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              ref={(el) => { itemsRef.current[i] = el; }}
              className="flex items-center gap-4"
            >
              <div
                ref={(el) => { iconsRef.current[i] = el; }}
                className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center shrink-0"
              >
                <i className={`${stat.icon} text-primary text-[1.375rem]`} />
              </div>
              <div>
                <div className="flex items-baseline gap-0.5">
                  <span
                    ref={(el) => { numbersRef.current[i] = el; }}
                    className="text-[1.75rem] md:text-[2rem] font-extrabold text-heading tabular-nums leading-none"
                  >0</span>
                  <span className="text-[1rem] font-bold text-body">{stat.suffix}</span>
                </div>
                <p className="text-body text-[1rem] font-medium mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
