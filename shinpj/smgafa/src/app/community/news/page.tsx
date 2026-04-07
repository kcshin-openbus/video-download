"use client";

import { useState } from "react";
import SubpageLayout from "@/components/common/SubpageLayout";
import { communityMenu } from "@/data/menus";
import Link from "next/link";
import Pagination from "@/components/common/Pagination";

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
    date: d.toISOString().slice(0, 10),
    summary: summaries[i % summaries.length],
  };
});

const PER_PAGE = 6;

export default function NewsPage() {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(newsItems.length / PER_PAGE));
  const paged = newsItems.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <SubpageLayout title="센터 소식" breadcrumb="커뮤니티" bannerVariant="community" sideMenu={communityMenu}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {paged.map((news) => (
          <Link
            key={news.id}
            href={`/community/news/${news.id}`}
            className="group bg-white dark:bg-[#1A1A1A] border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-500"
          >
            {/* 썸네일 */}
            <div className="h-[180px] bg-bg-section flex items-center justify-center">
              <i className="fa-solid fa-image text-3xl text-border" />
            </div>
            <div className="p-5">
              <span className="text-[1rem] text-muted">{news.date}</span>
              <h3 className="text-[1rem] font-bold text-heading mt-2 mb-2 group-hover:text-primary transition-colors leading-snug line-clamp-2">
                {news.title}
              </h3>
              <p className="text-[1rem] text-muted leading-[1.7] line-clamp-2">{news.summary}</p>
            </div>
          </Link>
        ))}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </SubpageLayout>
  );
}
