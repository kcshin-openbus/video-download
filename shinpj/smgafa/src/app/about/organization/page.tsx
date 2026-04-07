"use client";

import SubpageLayout from "@/components/common/SubpageLayout";
import { aboutMenu } from "@/data/menus";

/*
  좌표 계산 (컨테이너 700px):
  - 시설장: left=200, width=160, height=48, top=0  → 중앙 x=280, 하단=48
  - 운영위원회: left=440, width=140, height=48, top=0 → 좌측=440
  - 가로선: x=360 ~ x=440 (시설장 우측 → 운영위원회 좌측), y=24 (중앙)
  - 세로선1: x=280, y=48 → y=120 (시설장 하단 → 대리 상단)
  - 대리: left=210, width=140, height=48, top=120  → 중앙 x=280, 하단=168
  - 세로선2: x=280, y=168 → y=230 (대리 하단 → 분기선)
  - 분기 가로선: x=100 ~ x=460, y=230
  - 분기 세로선: x=100, x=280, x=460, y=230 → y=270
  - 사회복지사: top=270, height=48
  - 전체 높이: 330
*/

export default function OrganizationPage() {
  return (
    <SubpageLayout title="조직도" breadcrumb="센터소개" bannerVariant="about" sideMenu={aboutMenu}>
      <div className="py-8 overflow-x-auto">
        <div className="relative mx-auto" style={{ width: 780, height: 330 }}>

          {/* ── z-0: 연결선 ── */}

          {/* 시설장 → 운영위원회 가로선 */}
          <div className="absolute z-0 bg-border" style={{ top: 24, left: 470, width: 80, height: 2 }} />

          {/* 시설장 → 대리 세로선 */}
          <div className="absolute z-0 bg-border" style={{ top: 48, left: 390, width: 2, height: 72 }} />

          {/* 대리 → 분기선 세로선 */}
          <div className="absolute z-0 bg-border" style={{ top: 168, left: 390, width: 2, height: 62 }} />

          {/* 분기 가로선 */}
          <div className="absolute z-0 bg-border" style={{ top: 230, left: 100, width: 580, height: 2 }} />

          {/* 분기 → 사회복지사1 세로선 */}
          <div className="absolute z-0 bg-border" style={{ top: 230, left: 100, width: 2, height: 40 }} />

          {/* 분기 → 사회복지사2 세로선 */}
          <div className="absolute z-0 bg-border" style={{ top: 230, left: 390, width: 2, height: 40 }} />

          {/* 분기 → 사회복지사3 세로선 */}
          <div className="absolute z-0 bg-border" style={{ top: 230, left: 680, width: 2, height: 40 }} />

          {/* ── z-10: 박스 ── */}

          {/* 시설장 */}
          <div className="absolute z-10 bg-primary text-white rounded-lg text-center font-bold text-[1rem] shadow-md flex items-center justify-center"
            style={{ top: 0, left: 310, width: 160, height: 48 }}>
            시설장
          </div>

          {/* 운영위원회 */}
          <div className="absolute z-10 bg-primary/10 text-primary border border-primary/20 rounded-lg text-center font-semibold text-[1rem] flex items-center justify-center"
            style={{ top: 0, left: 550, width: 140, height: 48 }}>
            운영위원회
          </div>

          {/* 대리 */}
          <div className="absolute z-10 bg-primary/80 text-white rounded-lg text-center font-bold text-[1rem] flex items-center justify-center"
            style={{ top: 120, left: 320, width: 140, height: 48 }}>
            대 리
          </div>

          {/* 사회복지사 1 */}
          <div className="absolute z-10 bg-bg-card border-2 border-primary/40 rounded-lg text-center font-semibold text-[1rem] text-heading flex items-center justify-center"
            style={{ top: 270, left: 10, width: 180, height: 48 }}>

            사회복지사 1
          </div>

          {/* 사회복지사 2 */}
          <div className="absolute z-10 bg-bg-card border-2 border-primary/40 rounded-lg text-center font-semibold text-[1rem] text-heading flex items-center justify-center"
            style={{ top: 270, left: 300, width: 180, height: 48 }}>
            사회복지사 2
          </div>

          {/* 사회복지사 3 */}
          <div className="absolute z-10 bg-bg-card border-2 border-primary/40 rounded-lg text-center font-semibold text-[1rem] text-heading flex items-center justify-center"
            style={{ top: 270, left: 590, width: 180, height: 48 }}>
            사회복지사 3
          </div>
        </div>
      </div>

      <div className="mt-10 bg-primary/[0.04] border border-primary/10 rounded-2xl p-6">
        <h3 className="font-bold text-heading mb-2">재가노인지원서비스사업</h3>
        <p className="text-[1rem] text-muted leading-[1.7]">
          시설장 아래 운영위원회를 두고, 대리를 중심으로 사회복지사 3명이 재가노인지원서비스사업을 수행합니다.
        </p>
      </div>
    </SubpageLayout>
  );
}
