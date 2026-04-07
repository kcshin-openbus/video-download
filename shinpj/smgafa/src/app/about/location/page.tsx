"use client";

import SubpageLayout from "@/components/common/SubpageLayout";
import { aboutMenu } from "@/data/menus";

export default function LocationPage() {
  return (
    <SubpageLayout title="찾아오시는 길" breadcrumb="센터소개" bannerVariant="about" sideMenu={aboutMenu}>
      <div className="space-y-8">
        {/* 지도 */}
        <div className="rounded-2xl overflow-hidden border border-border h-[300px] md:h-[420px]">
          <iframe
            src="https://www.google.com/maps?q=경기도+의정부시+경의로+42&output=embed"
            className="w-full h-full"
            style={{ border: 0 }}
            loading="lazy"
            title="센터 위치"
          />
        </div>

        {/* 정보 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-[#1A1A1A] border border-border rounded-2xl p-6 flex gap-4">
            <span className="w-10 h-10 bg-primary/[0.07] rounded-xl flex items-center justify-center shrink-0">
              <i className="fa-solid fa-location-dot text-primary" />
            </span>
            <div>
              <p className="text-[1rem] text-muted mb-1">주소</p>
              <p className="text-heading font-medium text-[1rem]">경기도 의정부시 경의로 42, 5층</p>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1A1A1A] border border-border rounded-2xl p-6 flex gap-4">
            <span className="w-10 h-10 bg-primary/[0.07] rounded-xl flex items-center justify-center shrink-0">
              <i className="fa-solid fa-phone text-primary" />
            </span>
            <div>
              <p className="text-[1rem] text-muted mb-1">전화</p>
              <p className="text-heading font-medium text-[1rem]">031-873-3682</p>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1A1A1A] border border-border rounded-2xl p-6 flex gap-4">
            <span className="w-10 h-10 bg-primary/[0.07] rounded-xl flex items-center justify-center shrink-0">
              <i className="fa-solid fa-fax text-primary" />
            </span>
            <div>
              <p className="text-[1rem] text-muted mb-1">팩스</p>
              <p className="text-heading font-medium text-[1rem]">031-873-3678</p>
            </div>
          </div>
        </div>
      </div>
    </SubpageLayout>
  );
}
