"use client";

import SubpageLayout from "@/components/common/SubpageLayout";
import { supportMenu } from "@/data/menus";

export default function DonationPage() {
  return (
    <SubpageLayout title="후원 안내" breadcrumb="후원·자원봉사" bannerVariant="support" sideMenu={supportMenu}>
      <div className="space-y-12">
        {/* 후원 안내 */}
        <div className="bg-primary/[0.04] border border-primary/10 rounded-2xl p-6 md:p-8">
          <p className="text-[1rem] text-heading leading-[1.85]">
            시민재가노인지원서비스센터는 지역사회 어르신들의 건강하고 안정된 노후생활을 지원하기 위해 다양한 재가노인지원서비스를 제공하고 있습니다. 여러분의 따뜻한 나눔은 어르신들의 일상에 큰 힘이 됩니다.
          </p>
        </div>

        {/* 후원대상 */}
        <section>
          <h3 className="text-lg font-bold text-heading mb-4 flex items-center gap-2">
            <i className="fa-solid fa-users text-primary" /> 후원대상
          </h3>
          <ul className="space-y-2 text-[1rem] text-muted">
            <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span>경제적·정서적 어려움을 겪고 있는 재가 어르신</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span>돌봄과 지원이 필요한 취약계층 어르신</li>
          </ul>
        </section>

        {/* 후원방법 */}
        <section>
          <h3 className="text-lg font-bold text-heading mb-4 flex items-center gap-2">
            <i className="fa-solid fa-hand-holding-dollar text-primary" /> 후원방법
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: "fa-solid fa-calendar-check", title: "정기후원", desc: "매월 일정 금액을 지속적으로 후원" },
              { icon: "fa-solid fa-gift", title: "일시후원", desc: "원하는 금액을 1회 후원" },
              { icon: "fa-solid fa-box-open", title: "물품후원", desc: "식료품, 생활용품, 계절용품 등 후원" },
            ].map((item) => (
              <div key={item.title} className="bg-white dark:bg-[#1A1A1A] border border-border rounded-2xl p-5 text-center">
                <i className={`${item.icon} text-primary text-2xl mb-3 block`} />
                <h3 className="font-bold text-heading mb-1">{item.title}</h3>
                <p className="text-[1rem] text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 후원금 사용내용 */}
        <section>
          <h3 className="text-lg font-bold text-heading mb-4 flex items-center gap-2">
            <i className="fa-solid fa-chart-pie text-primary" /> 후원금 사용내용
          </h3>
          <ul className="space-y-2 text-[1rem] text-muted">
            <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span>어르신 생계 및 생활지원</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span>정서지원 프로그램 및 문화활동 지원</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span>건강관리 및 안전지원 서비스 운영</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span>취약 어르신 긴급지원</li>
          </ul>
        </section>

        {/* 후원 계좌 */}
        <section>
          <div className="bg-[#2D4A37] text-white rounded-2xl p-6 md:p-8">
            <h3 className="text-lg font-bold mb-4">후원 계좌</h3>
            <p className="text-2xl md:text-3xl font-bold font-[tabular-nums] mb-2">농협 351-5175-3317-63</p>
            <p className="text-white/80">시민재가노인지원서비스센터</p>
          </div>
        </section>

        {/* 후원자 혜택 */}
        <section>
          <h3 className="text-lg font-bold text-heading mb-4 flex items-center gap-2">
            <i className="fa-solid fa-star text-primary" /> 후원자 혜택
          </h3>
          <ul className="space-y-2 text-[1rem] text-muted">
            <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span>기부금영수증 발급 (소득공제 혜택)</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span>연말정산 간소화서비스를 통한 기부내역 확인 가능</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span>후원금 사용내역 안내 및 기관 소식 제공</li>
          </ul>
        </section>
      </div>
    </SubpageLayout>
  );
}
