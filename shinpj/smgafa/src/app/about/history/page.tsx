"use client";

import SubpageLayout from "@/components/common/SubpageLayout";
import { aboutMenu } from "@/data/menus";
import { historyData } from "@/data/history";

export default function HistoryPage() {
  const years = [...new Set(historyData.map((h) => h.year))].reverse();

  return (
    <SubpageLayout title="연혁" breadcrumb="센터소개" bannerVariant="about" sideMenu={aboutMenu}>
      <div className="relative">
        {/* 세로 타임라인 선 */}
        <div className="absolute left-[18px] md:left-[22px] top-2 bottom-2 w-[2px] bg-border" />

        <div className="space-y-10">
          {years.map((year) => {
            const items = historyData.filter((h) => h.year === year);
            return (
              <div key={year} className="relative pl-12 md:pl-14">
                {/* 연도 도트 */}
                <div className="absolute left-[10px] md:left-[14px] top-1 w-[18px] h-[18px] bg-primary rounded-full border-[3px] border-bg-section" />
                <h3 className="text-xl font-bold text-primary mb-4">{year}</h3>
                <div className="space-y-3">
                  {items.map((item, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <span className="text-[1rem] text-muted font-medium w-14 shrink-0">
                        {String(item.month).padStart(2, "0")}월
                      </span>
                      <p className="text-[1rem] text-heading leading-[1.7]">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SubpageLayout>
  );
}
