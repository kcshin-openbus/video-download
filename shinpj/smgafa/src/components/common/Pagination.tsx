"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  // 페이지 그룹 계산 (5개씩)
  const groupSize = 5;
  const currentGroup = Math.floor((currentPage - 1) / groupSize);
  const groupStart = currentGroup * groupSize + 1;
  const groupEnd = Math.min(groupStart + groupSize - 1, totalPages);
  const pages = Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i);

  const hasPrevGroup = groupStart > 1;
  const hasNextGroup = groupEnd < totalPages;

  return (
    <div className="flex items-center justify-center gap-1 mt-10">
      {/* 처음으로 */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="w-9 h-9 flex items-center justify-center rounded-md text-muted hover:text-heading hover:bg-bg-section disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        aria-label="처음 페이지"
      >
        <i className="fa-solid fa-angles-left text-[0.75rem]" />
      </button>

      {/* 이전 그룹 */}
      <button
        onClick={() => onPageChange(groupStart - 1)}
        disabled={!hasPrevGroup}
        className="w-9 h-9 flex items-center justify-center rounded-md text-muted hover:text-heading hover:bg-bg-section disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        aria-label="이전 페이지"
      >
        <i className="fa-solid fa-chevron-left text-[0.75rem]" />
      </button>

      {/* 페이지 번호 */}
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-9 h-9 flex items-center justify-center rounded-md text-[1rem] font-medium transition-all duration-200 ${
            currentPage === page
              ? "bg-primary text-white shadow-sm"
              : "text-body hover:text-heading hover:bg-bg-section"
          }`}
        >
          {page}
        </button>
      ))}

      {/* 다음 그룹 */}
      <button
        onClick={() => onPageChange(groupEnd + 1)}
        disabled={!hasNextGroup}
        className="w-9 h-9 flex items-center justify-center rounded-md text-muted hover:text-heading hover:bg-bg-section disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        aria-label="다음 페이지"
      >
        <i className="fa-solid fa-chevron-right text-[0.75rem]" />
      </button>

      {/* 마지막으로 */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="w-9 h-9 flex items-center justify-center rounded-md text-muted hover:text-heading hover:bg-bg-section disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        aria-label="마지막 페이지"
      >
        <i className="fa-solid fa-angles-right text-[0.75rem]" />
      </button>
    </div>
  );
}
