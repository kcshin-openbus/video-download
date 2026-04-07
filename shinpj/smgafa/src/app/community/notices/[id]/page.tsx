"use client";

import { use } from "react";
import Link from "next/link";
import SubpageLayout from "@/components/common/SubpageLayout";
import { communityMenu } from "@/data/menus";

// 더미 데이터 (실제 서비스에서는 API/DB에서 가져옴)
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
  const attachmentSets = [
    [
      { name: "2025년_재가노인지원서비스_이용안내.pdf", size: "2.4MB" },
      { name: "서비스_신청서양식.hwp", size: "156KB" },
    ],
    [
      { name: "자원봉사_모집안내문.pdf", size: "1.8MB" },
    ],
    [
      { name: "2024년_후원금_사용내역.xlsx", size: "340KB" },
      { name: "후원금_사용내역_요약.pdf", size: "1.2MB" },
    ],
    [],
    [
      { name: "센터_운영안내.pdf", size: "980KB" },
    ],
  ];
  return {
    id,
    title: titles[i % titles.length] + (i >= titles.length ? ` (${Math.ceil(id / 10)})` : ""),
    author: "관리자",
    date: d.toISOString().slice(0, 10).replace(/-/g, "."),
    views: Math.floor(Math.random() * 200) + 30,
    content: `시민재가노인지원서비스센터에서 안내드립니다.\n\n${titles[i % titles.length]}에 대한 상세 내용입니다.\n\n지역사회 어르신들의 건강하고 안정된 노후생활을 지원하기 위해 다양한 재가노인지원서비스를 제공하고 있습니다.\n\n자세한 사항은 센터로 문의해 주시기 바랍니다.\n\n문의: 031-873-3682`,
    attachments: attachmentSets[i % attachmentSets.length],
  };
});

export default function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const notice = allNotices.find((n) => n.id === Number(id));
  const currentIdx = allNotices.findIndex((n) => n.id === Number(id));
  const prevNotice = currentIdx < allNotices.length - 1 ? allNotices[currentIdx + 1] : null;
  const nextNotice = currentIdx > 0 ? allNotices[currentIdx - 1] : null;

  if (!notice) {
    return (
      <SubpageLayout title="공지사항" breadcrumb="커뮤니티" bannerVariant="community" sideMenu={communityMenu}>
        <div className="py-20 text-center text-muted">존재하지 않는 게시글입니다.</div>
      </SubpageLayout>
    );
  }

  return (
    <SubpageLayout title="공지사항" breadcrumb="커뮤니티" bannerVariant="community" sideMenu={communityMenu}>
      {/* 제목 영역 */}
      <div className="border-b-2 border-primary pb-5 mb-6">
        <h2 className="text-[1.125rem] md:text-[1.25rem] font-bold text-heading leading-snug mb-3">
          {notice.title}
        </h2>
        <div className="flex flex-wrap items-center gap-4 text-[1rem] text-muted">
          <span className="flex items-center gap-1.5">
            <i className="fa-solid fa-user text-[0.75rem]" /> {notice.author}
          </span>
          <span className="flex items-center gap-1.5">
            <i className="fa-solid fa-calendar text-[0.75rem]" /> {notice.date}
          </span>
          <span className="flex items-center gap-1.5">
            <i className="fa-solid fa-eye text-[0.75rem]" /> {notice.views}
          </span>
        </div>
      </div>

      {/* 본문 */}
      <div className="min-h-[200px] py-6 text-[1rem] text-body leading-[1.85] whitespace-pre-line">
        {notice.content}
      </div>

      {/* 첨부파일 */}
      {notice.attachments.length > 0 && (
        <div className="bg-bg-section dark:bg-bg-card border border-border rounded-xl p-5 mt-6">
          <h4 className="text-[1rem] font-semibold text-heading mb-3 flex items-center gap-2">
            <i className="fa-solid fa-paperclip text-primary text-[0.875rem]" />
            첨부파일 ({notice.attachments.length})
          </h4>
          <ul className="space-y-2">
            {notice.attachments.map((file, idx) => (
              <li key={idx}>
                <button className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg hover:bg-white dark:hover:bg-bg-section transition-colors group">
                  <span className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <i className={`text-primary text-[0.75rem] ${
                      file.name.endsWith(".pdf") ? "fa-solid fa-file-pdf" :
                      file.name.endsWith(".hwp") ? "fa-solid fa-file-lines" :
                      file.name.endsWith(".xlsx") || file.name.endsWith(".xls") ? "fa-solid fa-file-excel" :
                      "fa-solid fa-file"
                    }`} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[1rem] text-heading font-medium truncate group-hover:text-primary transition-colors">
                      {file.name}
                    </p>
                    <p className="text-[1rem] text-muted">{file.size}</p>
                  </div>
                  <i className="fa-solid fa-download text-[0.875rem] text-muted group-hover:text-primary transition-colors shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 이전/다음 글 */}
      <div className="border-t border-border mt-8">
        {nextNotice && (
          <Link
            href={`/community/notices/${nextNotice.id}`}
            className="flex items-center gap-3 px-4 py-3.5 border-b border-border hover:bg-bg-section transition-colors"
          >
            <span className="text-[1rem] text-muted font-medium w-16 shrink-0 flex items-center gap-1.5">
              <i className="fa-solid fa-chevron-up text-[0.75rem]" /> 다음글
            </span>
            <span className="text-[1rem] text-heading truncate">{nextNotice.title}</span>
          </Link>
        )}
        {prevNotice && (
          <Link
            href={`/community/notices/${prevNotice.id}`}
            className="flex items-center gap-3 px-4 py-3.5 border-b border-border hover:bg-bg-section transition-colors"
          >
            <span className="text-[1rem] text-muted font-medium w-16 shrink-0 flex items-center gap-1.5">
              <i className="fa-solid fa-chevron-down text-[0.75rem]" /> 이전글
            </span>
            <span className="text-[1rem] text-heading truncate">{prevNotice.title}</span>
          </Link>
        )}
      </div>

      {/* 목록 버튼 */}
      <div className="flex justify-center mt-8">
        <Link
          href="/community/notices"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold text-[1rem] rounded-lg transition-colors shadow-sm"
        >
          <i className="fa-solid fa-list text-[0.75rem]" />
          목록으로
        </Link>
      </div>
    </SubpageLayout>
  );
}
