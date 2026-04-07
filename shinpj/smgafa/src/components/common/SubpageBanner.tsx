"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface SubpageBannerProps {
  title: string;
  breadcrumb: string;
  variant?: "about" | "services" | "support" | "community";
}

const variants = {
  about: {
    bg: "from-[#1a3a6b] to-[#0d1f3c]",
    circles: [
      { cx: "80%", cy: "15%", r: 180, color: "rgba(17,75,228,0.35)" },
      { cx: "10%", cy: "80%", r: 140, color: "rgba(43,221,161,0.25)" },
      { cx: "50%", cy: "50%", r: 220, color: "rgba(17,75,228,0.15)" },
    ],
  },
  services: {
    bg: "from-[#0f2e5e] to-[#162448]",
    circles: [
      { cx: "75%", cy: "40%", r: 200, color: "rgba(43,221,161,0.3)" },
      { cx: "15%", cy: "20%", r: 160, color: "rgba(17,75,228,0.3)" },
      { cx: "55%", cy: "85%", r: 150, color: "rgba(43,221,161,0.15)" },
    ],
  },
  support: {
    bg: "from-[#1b2d5a] to-[#0a1a3d]",
    circles: [
      { cx: "85%", cy: "30%", r: 190, color: "rgba(43,221,161,0.3)" },
      { cx: "8%", cy: "70%", r: 150, color: "rgba(17,75,228,0.25)" },
      { cx: "45%", cy: "10%", r: 130, color: "rgba(43,221,161,0.15)" },
    ],
  },
  community: {
    bg: "from-[#142952] to-[#0b1a35]",
    circles: [
      { cx: "20%", cy: "45%", r: 200, color: "rgba(17,75,228,0.3)" },
      { cx: "80%", cy: "70%", r: 170, color: "rgba(43,221,161,0.25)" },
      { cx: "60%", cy: "10%", r: 150, color: "rgba(17,75,228,0.18)" },
    ],
  },
};

export default function SubpageBanner({ title, breadcrumb, variant = "about" }: SubpageBannerProps) {
  const circlesRef = useRef<(HTMLDivElement | null)[]>([]);
  const particlesRef = useRef<(HTMLDivElement | null)[]>([]);
  const lineRef = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const crumbRef = useRef<HTMLParagraphElement>(null);

  const v = variants[variant];

  useEffect(() => {
    // 원형 부유 모션 — 이동 범위 크게
    circlesRef.current.filter(Boolean).forEach((el, i) => {
      gsap.set(el, { x: 0, y: 0 });
      gsap.to(el, {
        keyframes: [
          { x: 40 + i * 15, y: -25 - i * 10, scale: 1.15, duration: 3 + i },
          { x: -30 - i * 10, y: 20 + i * 8, scale: 0.85, duration: 3 + i },
          { x: 20, y: -15, scale: 1.05, duration: 2.5 + i },
          { x: 0, y: 0, scale: 1, duration: 2 + i },
        ],
        repeat: -1,
        ease: "sine.inOut",
        delay: i * 0.8,
      });
    });

    // 떠다니는 입자 모션
    particlesRef.current.filter(Boolean).forEach((el, i) => {
      gsap.set(el, { x: 0, y: 0, opacity: 0 });
      gsap.to(el, {
        y: -60 - i * 20,
        x: `random(-40, 40)`,
        opacity: 0.7,
        duration: 3 + i * 0.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: i * 0.6,
      });
    });

    // 링 느린 회전
    gsap.to(lineRef.current, {
      rotation: 360, duration: 40, repeat: -1, ease: "none",
    });
    gsap.to(line2Ref.current, {
      rotation: -360, duration: 50, repeat: -1, ease: "none",
    });

    // 텍스트 등장
    gsap.fromTo(crumbRef.current,
      { y: 15, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
    );
    gsap.fromTo(titleRef.current,
      { y: 30, opacity: 0, filter: "blur(4px)" },
      { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.7, ease: "power3.out", delay: 0.15 }
    );
  }, []);

  return (
    <div className={`relative py-14 md:py-20 overflow-hidden bg-gradient-to-br ${v.bg}`}>
      {/* 움직이는 원형 장식 */}
      {v.circles.map((c, i) => (
        <div
          key={i}
          ref={(el) => { circlesRef.current[i] = el; }}
          className="absolute rounded-full pointer-events-none will-change-transform"
          style={{
            left: c.cx,
            top: c.cy,
            width: c.r * 2,
            height: c.r * 2,
            marginLeft: -c.r,
            marginTop: -c.r,
            background: `radial-gradient(circle, ${c.color}, transparent 70%)`,
            filter: "blur(30px)",
          }}
        />
      ))}

      {/* 떠다니는 작은 입자들 */}
      {[
        { left: "20%", top: "30%", size: 6 },
        { left: "70%", top: "60%", size: 4 },
        { left: "40%", top: "75%", size: 5 },
        { left: "85%", top: "25%", size: 3 },
        { left: "55%", top: "15%", size: 5 },
      ].map((p, i) => (
        <div
          key={`p-${i}`}
          ref={(el) => { particlesRef.current[i] = el; }}
          className="absolute rounded-full bg-white pointer-events-none will-change-transform"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            opacity: 0,
          }}
        />
      ))}

      {/* 느리게 회전하는 링 장식 */}
      <div
        ref={lineRef}
        className="absolute pointer-events-none rounded-full border border-white/[0.07] will-change-transform"
        style={{ width: 350, height: 350, right: "-5%", top: "-30%" }}
      />
      <div
        ref={line2Ref}
        className="absolute pointer-events-none rounded-full border border-white/[0.05] will-change-transform"
        style={{ width: 250, height: 250, left: "-3%", bottom: "-40%" }}
      />

      {/* 텍스트 */}
      <div className="relative z-10 max-w-[1520px] mx-auto px-5 md:px-6">
        <p ref={crumbRef} className="text-white/70 text-[1rem] tracking-[0.15em] uppercase mb-3">
          {breadcrumb}
        </p>
        <h1 ref={titleRef} className="text-[2rem] md:text-[2.75rem] lg:text-[3.25rem] font-extrabold !text-white tracking-tight will-change-transform">
          {title}
        </h1>
      </div>
    </div>
  );
}
