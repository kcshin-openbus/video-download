"use client";

import { use } from "react";
import Link from "next/link";
import SubpageLayout from "@/components/common/SubpageLayout";
import { communityMenu } from "@/data/menus";

const newsItems = Array.from({ length: 18 }, (_, i) => {
  const id = 18 - i;
  const titles = [
    "의정부시중독관리센터 업무협약 체결",
    "누국나돌봄 제공기관 업무협약 체결",
    "재가 의료급여 사업 서비스제공기관 업무협약",
    "경기도노인종합상담센터 업무협약 체결",
    "경기도특화서비스 프로그램 운영",
    "나누리푸드뱅크 업무협약 체결",
    "어르신 건강검진 프로그램 실시",
    "봄맞이 나들이 행사 진행",
    "자원봉사자 감사의 날 행사",
  ];
  const summaries = [
    "어르신들의 정신건강 지원을 위한 업무협약을 체결하였습니다.",
    "누구나 돌봄 서비스 제공을 위한 업무협약을 체결하였습니다.",
    "재가 의료급여 사업 추진을 위한 서비스제공기관 업무협약을 체결하였습니다.",
    "어르신 상담 서비스 강화를 위한 업무협약을 체결하였습니다.",
    "돌봄간병지원, 체육운동, 사회관계형성프로그램 등을 운영합니다.",
    "어르신 식생활 지원을 위한 업무협약을 체결하였습니다.",
    "어르신 건강관리를 위한 무료 건강검진을 실시하였습니다.",
    "어르신들과 함께하는 봄맞이 나들이 행사를 진행하였습니다.",
    "올 한 해 봉사에 참여해주신 분들께 감사의 시간을 가졌습니다.",
  ];
  const d = new Date(2025, 6, 15);
  d.setDate(d.getDate() - i * 12);
  return {
    id,
    title: titles[i % titles.length],
    date: d.toISOString().slice(0, 10).replace(/-/g, "."),
    summary: summaries[i % summaries.length],
    content: `시민재가노인지원서비스센터에서 알려드립니다.\n\n${titles[i % titles.length]}에 대한 소식입니다.\n\n${summaries[i % summaries.length]}\n\n우리 센터는 지역사회 어르신들의 건강하고 안정된 노후생활을 지원하기 위해 지속적으로 협력 네트워크를 확대하고 있습니다.\n\n앞으로도 어르신들의 삶의 질 향상을 위해 최선을 다하겠습니다.\n\n감사합니다.`,
  };
});

export default function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const news = newsItems.find((n) => n.id === Number(id));
  const currentIdx = newsItems.findIndex((n) => n.id === Number(id));
  const prevNews = currentIdx < newsItems.length - 1 ? newsItems[currentIdx + 1] : null;
  const nextNews = currentIdx > 0 ? newsItems[currentIdx - 1] : null;

  if (!news) {
    return (
      <SubpageLayout title="센터 소식" breadcrumb="커뮤니티" bannerVariant="community" sideMenu={communityMenu}>
        <div className="py-20 text-center text-muted">존재하지 않는 게시글입니다.</div>
      </SubpageLayout>
    );
  }

  return (
    <SubpageLayout title="센터 소식" breadcrumb="커뮤니티" bannerVariant="community" sideMenu={communityMenu}>
      {/* 제목 영역 */}
      <div className="border-b-2 border-primary pb-5 mb-6">
        <h2 className="text-[1.125rem] md:text-[1.25rem] font-bold text-heading leading-snug mb-3">
          {news.title}
        </h2>
        <div className="flex flex-wrap items-center gap-4 text-[1rem] text-muted">
          <span className="flex items-center gap-1.5">
            <i className="fa-solid fa-calendar text-[0.75rem]" /> {news.date}
          </span>
        </div>
      </div>

      {/* 썸네일 */}
      <div className="h-[250px] md:h-[350px] bg-bg-section rounded-2xl flex items-center justify-center mb-8 border border-border">
        <i className="fa-solid fa-image text-4xl text-border" />
      </div>

      {/* 본문 */}
      <div className="min-h-[200px] py-4 text-[1rem] text-body leading-[1.85] whitespace-pre-line">
        {news.content}
      </div>

      {/* 이전/다음 글 */}
      <div className="border-t border-border mt-8">
        {nextNews && (
          <Link
            href={`/community/news/${nextNews.id}`}
            className="flex items-center gap-3 px-4 py-3.5 border-b border-border hover:bg-bg-section transition-colors"
          >
            <span className="text-[1rem] text-muted font-medium w-16 shrink-0 flex items-center gap-1.5">
              <i className="fa-solid fa-chevron-up text-[0.75rem]" /> 다음글
            </span>
            <span className="text-[1rem] text-heading truncate">{nextNews.title}</span>
          </Link>
        )}
        {prevNews && (
          <Link
            href={`/community/news/${prevNews.id}`}
            className="flex items-center gap-3 px-4 py-3.5 border-b border-border hover:bg-bg-section transition-colors"
          >
            <span className="text-[1rem] text-muted font-medium w-16 shrink-0 flex items-center gap-1.5">
              <i className="fa-solid fa-chevron-down text-[0.75rem]" /> 이전글
            </span>
            <span className="text-[1rem] text-heading truncate">{prevNews.title}</span>
          </Link>
        )}
      </div>

      {/* 목록 버튼 */}
      <div className="flex justify-center mt-8">
        <Link
          href="/community/news"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold text-[1rem] rounded-lg transition-colors shadow-sm"
        >
          <i className="fa-solid fa-list text-[0.75rem]" />
          목록으로
        </Link>
      </div>
    </SubpageLayout>
  );
}
