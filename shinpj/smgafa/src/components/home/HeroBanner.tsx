"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";

const slides = [
  {
    title: "어르신의 행복한 노후를 위한\n든든한 동반자",
    subtitle: "시민재가노인지원서비스센터가 함께합니다",
    image: "/images/banner/banner1.jpg",
  },
  {
    title: "맞춤형 재가노인지원서비스로\n어르신의 삶의 질을 높입니다",
    subtitle: "통합적·포괄적 서비스를 제공합니다",
    image: "/images/banner/banner2.jpg",
  },
  {
    title: "따뜻한 나눔으로\n함께 만드는 복지공동체",
    subtitle: "여러분의 작은 관심이 큰 행복이 됩니다",
    image: "/images/banner/banner3.jpg",
  },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const decorRef = useRef<HTMLDivElement>(null);

  const animateSlide = useCallback(() => {
    const tl = gsap.timeline();

    // 이미지 Ken Burns
    tl.fromTo(imageRef.current, { scale: 1.15 }, { scale: 1, duration: 7, ease: "power1.out" }, 0);
    // 오버레이
    tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" }, 0);

    // 뱃지 등장
    tl.fromTo(badgeRef.current,
      { y: 20, opacity: 0, scale: 0.9 },
      { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" },
      0.2
    );

    // 타이틀: 마스크 효과 (아래→위, 블러 해제)
    tl.fromTo(titleRef.current,
      { y: 80, opacity: 0, filter: "blur(12px)", skewY: 3 },
      { y: 0, opacity: 1, filter: "blur(0px)", skewY: 0, duration: 1, ease: "power4.out" },
      0.3
    );

    // 서브타이틀: 좌→우 슬라이드
    tl.fromTo(subtitleRef.current,
      { x: -40, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.7, ease: "power3.out" },
      0.6
    );

    // CTA 버튼: 바운스 등장
    tl.fromTo(ctaRef.current,
      { y: 30, opacity: 0, scale: 0.9 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)" },
      0.8
    );

    // 장식 요소: 회전하며 등장
    tl.fromTo(decorRef.current,
      { scale: 0, rotation: -90, opacity: 0 },
      { scale: 1, rotation: 0, opacity: 0.15, duration: 1.2, ease: "power3.out" },
      0.4
    );

    // 프로그레스 바
    tl.fromTo(progressRef.current, { scaleX: 0 }, { scaleX: 1, duration: 5.5, ease: "none" }, 0.5);

    return tl;
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      if (index === current) return;
      const tl = gsap.timeline();
      // 퇴장: 위로 + 페이드
      tl.to(badgeRef.current, { y: -15, opacity: 0, duration: 0.25, ease: "power2.in" }, 0);
      tl.to(titleRef.current, { y: -50, opacity: 0, filter: "blur(8px)", duration: 0.35, ease: "power2.in" }, 0.05);
      tl.to(subtitleRef.current, { x: -30, opacity: 0, duration: 0.3, ease: "power2.in" }, 0.1);
      tl.to(ctaRef.current, { y: -20, opacity: 0, duration: 0.25, ease: "power2.in" }, 0.12);
      tl.to(decorRef.current, { scale: 0, opacity: 0, duration: 0.3 }, 0.1);
      tl.to(imageRef.current, {
        scale: 1.2, opacity: 0, duration: 0.5, ease: "power2.in",
        onComplete: () => setCurrent(index),
      }, 0.15);
    },
    [current]
  );

  useEffect(() => {
    gsap.set(imageRef.current, { opacity: 1, scale: 1.15 });
    const tl = animateSlide();
    return () => { tl.kill(); };
  }, [current, animateSlide]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [current]);

  const handleIndicatorClick = (index: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    goToSlide(index);
  };

  const slide = slides[current];

  return (
    <section ref={containerRef} className="relative w-full h-[600px] md:h-[750px] lg:h-[850px] overflow-hidden">
      {/* 배경 이미지 */}
      <div ref={imageRef} className="absolute inset-0 w-full h-full will-change-transform">
        <Image src={slide.image} alt={`배너 ${current + 1}`} fill className="object-cover" priority={current === 0} />
      </div>

      {/* 오버레이 */}
      <div ref={overlayRef} className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

      {/* 장식 원형 */}
      <div
        ref={decorRef}
        className="absolute -right-20 -bottom-20 w-[400px] h-[400px] md:w-[500px] md:h-[500px] rounded-full border-2 border-white/10 pointer-events-none"
      />

      {/* 콘텐츠 */}
      <div className="relative z-10 flex flex-col justify-end h-full max-w-[1520px] mx-auto px-5 md:px-6 pb-28 md:pb-36 lg:pb-40">
        <span
          ref={badgeRef}
          className="inline-flex items-center gap-2 w-fit px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-5"
        >
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-white text-[1rem] font-medium">시민재가노인지원서비스센터</span>
        </span>

        <h1
          ref={titleRef}
          className="text-[1.75rem] md:text-[2.5rem] lg:text-[3rem] font-extrabold !text-white whitespace-pre-line leading-[1.1] drop-shadow-lg max-w-3xl tracking-tight will-change-transform"
        >
          {slide.title}
        </h1>

        <p
          ref={subtitleRef}
          className="mt-4 md:mt-6 text-[1.125rem] md:text-[1.375rem] !text-white font-medium max-w-xl will-change-transform"
        >
          {slide.subtitle}
        </p>

        <Link
          ref={ctaRef}
          href="/services"
          className="mt-7 md:mt-8 inline-flex items-center gap-2 w-fit px-7 py-3.5 bg-accent hover:bg-accent-dark text-white font-bold text-[1rem] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group will-change-transform"
        >
          서비스 안내
          <i className="fa-solid fa-arrow-right text-[0.875rem] group-hover:translate-x-1 transition-transform duration-300" />
        </Link>
      </div>

      {/* 인디케이터 */}
      <div className="absolute bottom-6 md:bottom-10 left-0 right-0 z-20">
        <div className="max-w-[1520px] mx-auto px-5 md:px-6 flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => handleIndicatorClick(i)}
              className="group p-0.5"
              aria-label={`슬라이드 ${i + 1}`}
            >
              <span
                className={`block rounded-full transition-all duration-500 ${
                  i === current ? "w-8 h-2 bg-accent" : "w-2 h-2 bg-white/60 group-hover:bg-white/90"
                }`}
              />
            </button>
          ))}

          <div className="ml-auto flex items-center gap-1">
            <span className="!text-white text-[1rem] font-semibold tabular-nums">
              {String(current + 1).padStart(2, "0")}
            </span>
            <div className="w-8 h-[2px] bg-white/20 rounded-full overflow-hidden mx-1">
              <div ref={progressRef} className="h-full bg-accent rounded-full origin-left will-change-transform" />
            </div>
            <span className="text-white/60 text-[1rem] font-semibold tabular-nums">
              {String(slides.length).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* 좌우 화살표 */}
      <button
        onClick={() => handleIndicatorClick((current - 1 + slides.length) % slides.length)}
        className="hidden md:flex absolute left-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md hover:bg-white/25 transition-all duration-300 text-white hover:scale-110"
        aria-label="이전 슬라이드"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={() => handleIndicatorClick((current + 1) % slides.length)}
        className="hidden md:flex absolute right-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md hover:bg-white/25 transition-all duration-300 text-white hover:scale-110"
        aria-label="다음 슬라이드"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </section>
  );
}
