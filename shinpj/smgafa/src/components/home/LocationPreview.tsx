"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const contactInfo = [
  { icon: "fa-solid fa-location-dot", label: "주소", value: "경기도 의정부시 경의로 42, 5층" },
  { icon: "fa-solid fa-phone", label: "전화", value: "031-873-3682" },
  { icon: "fa-solid fa-fax", label: "팩스", value: "031-873-3678" },
];

export default function LocationPreview() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 타이틀 등장
      gsap.fromTo(titleRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
        }
      );

      // 연락처 카드 좌→우 슬라이드 등장
      cardsRef.current.filter(Boolean).forEach((el, i) => {
        gsap.fromTo(el,
          { x: -40, opacity: 0, scale: 0.95 },
          {
            x: 0, opacity: 1, scale: 1, duration: 0.6, delay: i * 0.1, ease: "power3.out",
            scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
          }
        );
      });

      // 버튼 등장
      gsap.fromTo(btnRef.current,
        { y: 20, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.5, delay: 0.4, ease: "back.out(1.7)",
          scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
        }
      );

      // 지도 우→좌 슬라이드 등장
      gsap.fromTo(mapRef.current,
        { x: 60, opacity: 0 },
        {
          x: 0, opacity: 1, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 md:py-24 lg:py-28 bg-bg-section">
      <div className="max-w-[1520px] mx-auto px-5 md:px-6">
        <div ref={titleRef} className="text-center mb-10 md:mb-14">
          <p className="section-label justify-center">Location</p>
          <h2>찾아오시는 길</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
          {/* 연락처 카드 */}
          <div className="flex flex-col gap-4">
            {contactInfo.map((info, i) => (
              <div
                key={info.label}
                ref={(el) => { cardsRef.current[i] = el; }}
                className="bg-bg-card rounded-xl p-5 flex items-center gap-4 border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300 will-change-transform"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <span className="w-13 h-13 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
                  <i className={`${info.icon} text-primary text-[1.25rem]`} />
                </span>
                <div>
                  <p className="text-[1rem] text-muted font-medium uppercase tracking-wider">{info.label}</p>
                  <p className="text-heading font-semibold text-[1rem] mt-0.5">{info.value}</p>
                </div>
              </div>
            ))}
            <Link
              ref={btnRef}
              href="/about/location"
              className="mt-2 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary-dark text-white font-semibold text-[1rem] rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] will-change-transform"
            >
              자세히 보기
              <i className="fa-solid fa-arrow-right text-[0.875rem]" />
            </Link>
          </div>

          {/* 지도 */}
          <div
            ref={mapRef}
            className="rounded-2xl overflow-hidden border border-border h-[280px] lg:h-full min-h-[300px] will-change-transform"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <iframe
              src="https://www.google.com/maps?q=경기도+의정부시+경의로+42&output=embed"
              className="w-full h-full"
              style={{ border: 0 }}
              loading="lazy"
              title="센터 위치"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
