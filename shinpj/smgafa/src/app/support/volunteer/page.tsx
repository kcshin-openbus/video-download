"use client";

import SubpageLayout from "@/components/common/SubpageLayout";
import { supportMenu } from "@/data/menus";

export default function VolunteerPage() {
  return (
    <SubpageLayout title="자원봉사자 모집" breadcrumb="후원·자원봉사" bannerVariant="support" sideMenu={supportMenu}>
      <div className="space-y-12">
        <div className="bg-primary/[0.04] border border-primary/10 rounded-2xl p-6 md:p-8">
          <p className="text-[1rem] text-heading leading-[1.85]">
            시민재가노인지원서비스센터에서는 지역사회 어르신들을 위한 따뜻한 나눔에 함께하실 자원봉사자를 모집합니다.
          </p>
        </div>

        {/* 모집대상 */}
        <section>
          <h3 className="text-lg font-bold text-heading mb-4 flex items-center gap-2">
            <i className="fa-solid fa-user-plus text-primary" /> 모집대상
          </h3>
          <ul className="space-y-2 text-[1rem] text-muted">
            <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span>지역사회 봉사활동에 관심이 있는 개인 및 단체</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span>어르신에 대한 이해와 존중의 마음을 가진 분</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span>정기적 또는 비정기적 참여가 가능한 분</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span>대학생, 직장인, 지역주민 등 누구나 참여 가능</li>
          </ul>
        </section>

        {/* 활동내용 */}
        <section>
          <h3 className="text-lg font-bold text-heading mb-4 flex items-center gap-2">
            <i className="fa-solid fa-clipboard-list text-primary" /> 활동내용
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: "fa-solid fa-phone-volume", title: "안부확인 및 말벗", desc: "어르신 안부확인 및 말벗 지원" },
              { icon: "fa-solid fa-heart", title: "정서·생활지원", desc: "정서지원 및 생활지원 활동" },
              { icon: "fa-solid fa-chalkboard-user", title: "프로그램 보조", desc: "프로그램 진행 보조" },
              { icon: "fa-solid fa-person-walking", title: "외출 동행", desc: "외출 및 문화활동 동행 지원" },
            ].map((item) => (
              <div key={item.title} className="bg-white dark:bg-[#1A1A1A] border border-border rounded-2xl p-5 flex gap-4">
                <span className="w-10 h-10 bg-primary/[0.07] rounded-xl flex items-center justify-center shrink-0">
                  <i className={`${item.icon} text-primary`} />
                </span>
                <div>
                  <h3 className="font-bold text-heading mb-0.5">{item.title}</h3>
                  <p className="text-[1rem] text-muted">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 활동혜택 */}
        <section>
          <h3 className="text-lg font-bold text-heading mb-4 flex items-center gap-2">
            <i className="fa-solid fa-award text-primary" /> 활동혜택
          </h3>
          <ul className="space-y-2 text-[1rem] text-muted">
            <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span>자원봉사 활동시간 인정 (1365 자원봉사포털, VMS 연계)</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span>활동 확인서 발급</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span>봉사활동 관련 교육 및 안내 제공</li>
          </ul>
        </section>

        {/* 신청방법 */}
        <section>
          <h3 className="text-lg font-bold text-heading mb-4 flex items-center gap-2">
            <i className="fa-solid fa-paper-plane text-primary" /> 신청방법
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#1A1A1A] border border-border rounded-2xl p-5 text-center">
              <i className="fa-solid fa-phone text-primary text-2xl mb-3 block" />
              <h3 className="font-bold text-heading mb-1">전화 및 방문 신청</h3>
              <p className="text-primary font-bold text-lg">031-873-3682</p>
            </div>
            <div className="bg-white dark:bg-[#1A1A1A] border border-border rounded-2xl p-5 text-center">
              <i className="fa-solid fa-globe text-primary text-2xl mb-3 block" />
              <h3 className="font-bold text-heading mb-1">1365 자원봉사포털</h3>
              <p className="text-[1rem] text-muted">온라인 신청 가능</p>
            </div>
          </div>
        </section>
      </div>
    </SubpageLayout>
  );
}
