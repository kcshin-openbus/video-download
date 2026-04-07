"use client";

import { useState } from "react";
import SubpageLayout from "@/components/common/SubpageLayout";
import { communityMenu } from "@/data/menus";
import Link from "next/link";
import Pagination from "@/components/common/Pagination";

const allNotices = Array.from({ length: 32 }, (_, i) => {
  const id = 32 - i;
  const titles = [
    "2025년 재가노인지원서비스 이용 안내",
    "자원봉사자 모집 안내 (상시)",
    "후원금 사용내역 공개",
    "경기도특화서비스 프로그램 안내",
    "센터 운영 안내",
    "겨울철 어르신 안전관리 안내",
    "하반기 사업보고",
    "연말 후원 캠페인 안내",
    "노인돌봄 사업 안내",
    "업무협약 안내",
    "봄맞이 건강관리 프로그램",
    "긴급돌봄 서비스 확대 안내",
  ];
  const d = new Date(2025, 2, 15);
  d.setDate(d.getDate() - i * 5);
  return {
    id,
    title: titles[i % titles.length] + (i >= titles.length ? ` (${Math.ceil(id / 10)})` : ""),
    author: "관리자",
    date: d.toISOString().slice(0, 10).replace(/-/g, "."),
    views: Math.floor(Math.random() * 200) + 30,
  };
});

const PER_PAGE = 10;

export default function NoticesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = allNotices.filter((n) =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));
  const paged = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <SubpageLayout title="공지사항" breadcrumb="커뮤니티" bannerVariant="community" sideMenu={communityMenu}>
      {/* 상단: 총 건수 + 검색 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <p className="text-[1rem] text-muted">
          총 <span className="text-heading font-bold">{totalCount}</span>건
        </p>
        <div className="flex">
          <input
            type="text"
            placeholder="검색어를 입력하세요"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="border border-border rounded-l-lg px-4 py-2 text-[1rem] w-[200px] md:w-[260px] outline-none focus:border-primary transition-colors bg-white dark:bg-[#1A1A1A]"
          />
          <button className="bg-primary text-white px-4 rounded-r-lg hover:bg-primary-dark transition-colors">
            <i className="fa-solid fa-magnifying-glass text-[0.875rem]" />
          </button>
        </div>
      </div>

      {/* 게시판 테이블 */}
      <div className="border-t-2 border-primary">
        {/* 헤더 */}
        <div className="hidden sm:grid grid-cols-[60px_1fr_100px_100px_70px] bg-bg-section dark:bg-[#161616] border-b border-border text-[1rem] font-semibold text-muted text-center">
          <span className="py-3">번호</span>
          <span className="py-3 text-left pl-4">제목</span>
          <span className="py-3">작성자</span>
          <span className="py-3">작성일</span>
          <span className="py-3">조회</span>
        </div>

        {/* 목록 */}
        {paged.length > 0 ? (
          paged.map((notice) => (
            <Link
              key={notice.id}
              href={`/community/notices/${notice.id}`}
              className="grid grid-cols-1 sm:grid-cols-[60px_1fr_100px_100px_70px] border-b border-border hover:bg-bg-section transition-colors text-center items-center"
            >
              <span className="hidden sm:block py-3.5 text-[1rem] text-muted">{notice.id}</span>
              <span className="py-3.5 px-4 text-[1rem] text-heading text-left truncate hover:text-primary transition-colors">
                {notice.title}
              </span>
              <span className="hidden sm:block py-3.5 text-[1rem] text-muted">{notice.author}</span>
              <span className="hidden sm:block py-3.5 text-[1rem] text-muted">{notice.date}</span>
              <span className="hidden sm:block py-3.5 text-[1rem] text-muted">{notice.views}</span>
            </Link>
          ))
        ) : (
          <div className="py-16 text-center text-muted text-[1rem]">
            검색 결과가 없습니다.
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </SubpageLayout>
  );
}
