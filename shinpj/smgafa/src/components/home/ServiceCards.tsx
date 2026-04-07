"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const services = [
  {
    icon: "fa-solid fa-building-columns",
    title: "센터소개",
    description: "센터장 인사말, 미션과 비전, 연혁, 조직도를 소개합니다",
    href: "/about/greeting",
  },
  {
    icon: "fa-solid fa-hand-holding-heart",
    title: "재가노인지원서비스",
    description: "위기관리, 욕구기반서비스, 신청절차를 안내합니다",
    href: "/services",
  },
  {
    icon: "fa-solid fa-gift",
    title: "후원 안내",
    description: "후원방법, 후원계좌, 후원자 혜택을 안내합니다",
    href: "/support/donation",
  },
  {
    icon: "fa-solid fa-people-carry-box",
    title: "자원봉사",
    description: "봉사자 모집, 활동내용, 신청방법을 안내합니다",
    href: "/support/volunteer",
  },
];

export default function ServiceCards() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 섹션 타이틀 등장
      const titleChildren = titleRef.current?.children;
      if (titleChildren) {
        gsap.fromTo(Array.from(titleChildren),
          { y: 25, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.7, stagger: 0.1, ease: "power3.out",
            scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
          }
        );
      }

      // 카드 순차 등장 (아래→위 + 회전)
      cardsRef.current.filter(Boolean).forEach((card, i) => {
        gsap.fromTo(card,
          { y: 60, opacity: 0, rotateX: 8 },
          {
            y: 0, opacity: 1, rotateX: 0, duration: 0.8, delay: i * 0.1, ease: "power3.out",
            scrollTrigger: { trigger: sectionRef.current, start: "top 65%" },
          }
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // 호버 시 카드 기울기 효과
  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(card, {
      rotateY: x * 8,
      rotateX: -y * 8,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    gsap.to(e.currentTarget, {
      rotateY: 0, rotateX: 0, duration: 0.5, ease: "power3.out",
    });
    e.currentTarget.style.boxShadow = "var(--shadow-card)";
  };

  return (
    <section ref={sectionRef} className="py-16 md:py-24 lg:py-28 bg-bg-section" style={{ perspective: "1000px" }}>
      <div className="max-w-[1520px] mx-auto px-5 md:px-6">
        <div ref={titleRef} className="text-center mb-10 md:mb-14">
          <p className="section-label justify-center">Our Services</p>
          <h2>주요 서비스</h2>
          <p className="text-body text-[1rem] mt-3 max-w-lg mx-auto">
            어르신의 더 나은 삶을 위한 전문 서비스를 제공합니다
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((service, i) => (
            <Link
              key={service.href}
              href={service.href}
              ref={(el) => { cardsRef.current[i] = el; }}
              className="group bg-bg-card rounded-2xl p-6 md:p-7 border border-border hover:border-primary/30 transition-colors duration-400 will-change-transform"
              style={{ boxShadow: "var(--shadow-card)", transformStyle: "preserve-3d" }}
              onMouseMove={handleMouseMove}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-card-hover)"; }}
              onMouseLeave={handleMouseLeave}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center mb-5 group-hover:bg-primary group-hover:scale-110 transition-all duration-400">
                <i className={`${service.icon} text-primary group-hover:text-white text-[1.375rem] transition-colors duration-400`} />
              </div>
              <h3 className="text-[1.125rem] font-bold text-heading mb-2 group-hover:text-primary transition-colors">
                {service.title}
              </h3>
              <p className="text-[1rem] text-body leading-[1.7]">
                {service.description}
              </p>
              <div className="mt-5 flex items-center gap-1.5 text-[1rem] font-semibold text-primary opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                자세히 보기
                <i className="fa-solid fa-arrow-right text-[11px] group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
