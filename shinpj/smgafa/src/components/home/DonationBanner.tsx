"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function DonationBanner() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const circle2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 배경 이미지 패럴랙스
      gsap.fromTo(imageRef.current,
        { y: -60, scale: 1.15 },
        {
          y: 60, scale: 1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.5,
          },
        }
      );

      // 텍스트 등장
      const contentChildren = contentRef.current?.children;
      if (contentChildren) {
        gsap.fromTo(Array.from(contentChildren),
          { y: 40, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: "power3.out",
            scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
          }
        );
      }

      // 장식 원 회전
      gsap.to(circleRef.current, {
        rotation: 360, duration: 30, repeat: -1, ease: "none",
      });
      gsap.to(circle2Ref.current, {
        rotation: -360, duration: 45, repeat: -1, ease: "none",
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden">
      {/* 배경 이미지 (패럴랙스) */}
      <div ref={imageRef} className="absolute inset-[-60px] will-change-transform">
        <Image src="/images/donation-bg.jpg" alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* 장식 원 */}
      <div
        ref={circleRef}
        className="absolute -right-32 -top-32 w-[400px] h-[400px] rounded-full border border-white/10 pointer-events-none"
      />
      <div
        ref={circle2Ref}
        className="absolute -left-20 -bottom-20 w-[300px] h-[300px] rounded-full border border-white/5 pointer-events-none"
      />

      <div className="relative z-10 py-20 md:py-28 lg:py-32">
        <div className="max-w-[1520px] mx-auto px-5 md:px-6">
          <div ref={contentRef} className="max-w-2xl mx-auto text-center">
            <p className="text-accent-light font-semibold text-[1rem] tracking-[0.2em] uppercase mb-4">
              Donation
            </p>
            <h2 className="text-[2rem] md:text-[2.75rem] lg:text-[3.5rem] font-extrabold !text-white leading-[1.15] tracking-tight mb-6">
              따뜻한 나눔에<br />함께해 주세요
            </h2>
            <p className="text-white/90 text-[1rem] md:text-[1.125rem] leading-[1.8] mb-10">
              여러분의 작은 나눔이 어르신의 큰 행복이 됩니다.<br />
              지역사회 어르신들의 안정된 노후를 위해 함께해 주세요.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/support/donation"
                className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent-dark text-white font-bold text-[1rem] rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
              >
                후원 참여하기
                <i className="fa-solid fa-heart text-[1.125rem] group-hover:scale-125 transition-transform duration-300" />
              </Link>
              <Link
                href="/support/volunteer"
                className="inline-flex items-center gap-2 px-8 py-4 border border-white/40 hover:border-white/60 text-white font-semibold text-[1rem] rounded-full hover:bg-white/10 hover:scale-105 transition-all duration-300 group"
              >
                자원봉사 신청
                <i className="fa-solid fa-arrow-right text-[0.875rem] group-hover:translate-x-1.5 transition-transform duration-300" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
