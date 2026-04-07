"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type NoticeCategory = "공지사항" | "센터소식";

const sampleNotices = [
  { id: 1, category: "공지사항" as const, title: "2025년 재가노인지원서비스 이용 안내", summary: "시민재가노인지원서비스센터에서 제공하는 2025년도 재가노인지원서비스 이용 안내를 알려드립니다.", date: "2025-03-15" },
  { id: 2, category: "센터소식" as const, title: "경기도특화서비스 프로그램 운영 안내", summary: "돌봄간병지원, 체육운동, 사회관계형성프로그램 등 경기도특화서비스를 운영합니다.", date: "2025-03-10" },
  { id: 3, category: "공지사항" as const, title: "자원봉사자 모집 안내 (상시)", summary: "지역사회 어르신들을 위한 따뜻한 나눔에 함께하실 자원봉사자를 모집합니다.", date: "2025-02-28" },
  { id: 4, category: "공지사항" as const, title: "후원금 사용내역 공개 (2024년도)", summary: "2024년도 후원금 수입 및 사용내역을 투명하게 공개합니다.", date: "2025-02-20" },
  { id: 5, category: "센터소식" as const, title: "의정부시중독관리센터 업무협약 체결", summary: "어르신들의 정신건강 지원을 위한 의정부시중독관리센터와의 업무협약을 체결하였습니다.", date: "2025-02-15" },
  { id: 6, category: "센터소식" as const, title: "누국나돌봄 제공기관 업무협약 체결", summary: "누구나 돌봄 서비스 제공을 위한 업무협약을 체결하였습니다.", date: "2025-01-20" },
];

const tabs: NoticeCategory[] = ["공지사항", "센터소식"];

export default function NoticePreview() {
  const [activeTab, setActiveTab] = useState<NoticeCategory>("공지사항");
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const filteredNotices = sampleNotices.filter((n) => n.category === activeTab);

  // 스크롤 등장
  useEffect(() => {
    const ctx = gsap.context(() => {
      const headerChildren = headerRef.current?.children;
      if (headerChildren) {
        gsap.fromTo(Array.from(headerChildren),
          { y: 30, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power3.out",
            scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
          }
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // 탭 전환 시 카드 플립 애니메이션
  useEffect(() => {
    if (!gridRef.current) return;
    const cards = Array.from(gridRef.current.children);
    gsap.fromTo(cards,
      { rotateY: -15, opacity: 0, x: -20 },
      { rotateY: 0, opacity: 1, x: 0, duration: 0.5, ease: "power3.out", stagger: 0.08 }
    );
  }, [activeTab]);

  return (
    <section ref={sectionRef} className="py-16 md:py-24 lg:py-28 bg-bg-base">
      <div className="max-w-[1520px] mx-auto px-5 md:px-6">
        <div ref={headerRef}>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <p className="section-label">News & Notice</p>
              <h2>최근 소식</h2>
            </div>
            <div className="flex items-center justify-between w-full md:w-auto gap-3">
              <div className="flex bg-bg-section rounded-full p-1 border border-border">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2 rounded-full text-[1rem] font-semibold transition-all duration-300 ${
                      activeTab === tab
                        ? "bg-primary text-white shadow-md"
                        : "text-body hover:text-heading"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <Link
                href={activeTab === "공지사항" ? "/community/notices" : "/community/news"}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white text-muted transition-all duration-300"
                aria-label="전체 보기"
              >
                <i className="fa-solid fa-arrow-right text-[0.875rem]" />
              </Link>
            </div>
          </div>
        </div>

        <div ref={gridRef} key={activeTab} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" style={{ perspective: "800px" }}>
          {filteredNotices.slice(0, 3).map((notice) => (
            <Link
              key={notice.id}
              href={notice.category === "공지사항" ? "/community/notices" : "/community/news"}
              className="group bg-bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-400 hover:-translate-y-1.5 flex flex-col will-change-transform"
              style={{ boxShadow: "var(--shadow-card)" }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-card-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-card)"; }}
            >
              <div className="flex items-center gap-2.5 mb-4">
                <span className={`px-3 py-1 rounded-full text-[1rem] font-bold ${
                  notice.category === "공지사항"
                    ? "bg-primary-light text-primary"
                    : "bg-accent/10 text-accent"
                }`}>
                  {notice.category}
                </span>
                <span className="text-[1rem] text-muted">{notice.date}</span>
              </div>
              <h3 className="text-[1.0625rem] font-bold text-heading mb-2.5 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                {notice.title}
              </h3>
              <p className="text-[1rem] text-body leading-[1.7] line-clamp-2 flex-1">
                {notice.summary}
              </p>
              <div className="mt-5 pt-4 border-t border-border-light flex items-center justify-between">
                <span className="text-[1rem] text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  자세히 보기
                </span>
                <span className="w-9 h-9 rounded-full bg-bg-section flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <i className="fa-solid fa-arrow-right text-[0.875rem] text-muted group-hover:text-white transition-colors" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
