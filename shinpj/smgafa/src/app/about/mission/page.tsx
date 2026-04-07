"use client";

import SubpageLayout from "@/components/common/SubpageLayout";
import { aboutMenu } from "@/data/menus";

const goals = [
  { icon: "fa-solid fa-heart-pulse", title: "삶의 질 향상", desc: "대상자 중심의 맞춤형 서비스 제공을 통한 삶의 질 향상" },
  { icon: "fa-solid fa-house-medical", title: "안정적 생활 유지", desc: "건강관리 및 일상생활 지원 강화를 통한 안정적 생활 유지" },
  { icon: "fa-solid fa-people-group", title: "고립 예방", desc: "정서지원 및 사회참여 확대를 통한 고립 예방 및 관계망 형성" },
  { icon: "fa-solid fa-handshake", title: "통합 복지 기반", desc: "지역사회 자원 연계 활성화를 통한 통합적 복지서비스 기반 구축" },
];

export default function MissionPage() {
  return (
    <SubpageLayout title="미션/비전" breadcrumb="센터소개" bannerVariant="about" sideMenu={aboutMenu}>
      <div className="space-y-16">
        {/* 미션 */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-bullseye text-white text-sm" />
            </span>
            <h3 className="text-xl font-bold text-heading">Mission (미션)</h3>
          </div>
          <div className="bg-primary/[0.04] border border-primary/10 rounded-2xl p-6 md:p-8">
            <p className="text-[1rem] text-heading leading-[1.8] font-medium">
              지역사회 어르신의 인간다운 삶 보장과 복지 증진을 위해 전문적이고 체계적인 재가노인지원서비스를 제공한다.
            </p>
          </div>
        </div>

        {/* 비전 */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-eye text-white text-sm" />
            </span>
            <h3 className="text-xl font-bold text-heading">Vision (비전)</h3>
          </div>
          <div className="bg-primary/[0.04] border border-primary/10 rounded-2xl p-6 md:p-8">
            <p className="text-[1rem] text-heading leading-[1.8] font-medium">
              지역사회 중심의 통합 돌봄체계 구축을 통해 어르신이 안전하고 안정된 노후를 영위하는 복지공동체 실현
            </p>
          </div>
        </div>

        {/* 목표 */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-flag text-white text-sm" />
            </span>
            <h3 className="text-xl font-bold text-heading">Goal (목표)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {goals.map((goal) => (
              <div key={goal.title} className="bg-white dark:bg-[#1A1A1A] border border-border rounded-2xl p-6 flex gap-4">
                <span className="w-12 h-12 bg-primary/[0.07] rounded-xl flex items-center justify-center shrink-0">
                  <i className={`${goal.icon} text-primary text-lg`} />
                </span>
                <div>
                  <h3 className="font-bold text-heading mb-1">{goal.title}</h3>
                  <p className="text-[1rem] text-muted leading-[1.7]">{goal.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SubpageLayout>
  );
}
