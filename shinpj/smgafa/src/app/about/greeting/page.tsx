"use client";

import SubpageLayout from "@/components/common/SubpageLayout";
import { aboutMenu } from "@/data/menus";

export default function GreetingPage() {
  return (
    <SubpageLayout title="센터장 인사말" breadcrumb="센터소개" bannerVariant="about" sideMenu={aboutMenu}>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          {/* 센터장 사진 영역 */}
          <div className="md:w-[240px] shrink-0">
            <div className="w-full aspect-[3/4] bg-bg-section rounded-2xl flex items-center justify-center border border-border">
              <div className="text-center text-muted">
                <i className="fa-solid fa-user text-4xl mb-2 block opacity-30" />
                <p className="text-sm">센터장 사진</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="font-bold text-heading text-lg">한준상</p>
              <p className="text-muted text-sm">시민재가노인지원서비스센터 센터장</p>
            </div>
          </div>

          {/* 인사말 */}
          <div className="flex-1">
            <h3 className="text-xl md:text-2xl font-bold text-heading mb-6 leading-snug">
              시민재가노인지원서비스센터를<br />
              찾아주신 여러분께 진심으로 감사드립니다.
            </h3>
            <div className="space-y-5 text-[1rem] text-muted leading-[1.85]">
              <p>
                우리 센터는 지역사회 내 어르신들께서 익숙한 생활환경에서 안전하고 존엄한 노후를 보내실 수 있도록 다양한 재가노인지원서비스를 제공하고 있습니다.
              </p>
              <p>
                고령화 사회가 빠르게 진행되는 가운데, 어르신 한 분 한 분의 삶의 질 향상과 행복한 노후를 위한 돌봄의 중요성은 더욱 커지고 있습니다.
              </p>
              <p>
                이에 우리 센터는 대상자 중심의 맞춤형 서비스 제공을 바탕으로 일상생활 지원, 정서적 지지, 건강관리 및 지역자원 연계 등 통합적인 복지서비스를 체계적으로 추진하고 있습니다.
              </p>
              <p>
                또한 어르신들의 사회적 고립을 예방하고 지역사회와 함께하는 따뜻한 복지공동체를 만들어 나가기 위해 지속적으로 노력하고 있습니다.
              </p>
              <p>
                앞으로도 시민재가노인지원서비스센터는 어르신의 삶에 진정으로 힘이 되는 동반자로서, 신뢰받는 재가노인지원서비스센터가 되도록 최선을 다하겠습니다.
              </p>
              <p>지역주민 여러분의 많은 관심과 성원을 부탁드립니다.<br />감사합니다.</p>
            </div>
          </div>
        </div>
      </div>
    </SubpageLayout>
  );
}
