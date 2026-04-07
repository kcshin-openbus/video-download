"use client";

import SubpageLayout from "@/components/common/SubpageLayout";
import { serviceCategories, applicationSteps, requiredDocuments } from "@/data/services";

export default function ServicesPage() {
  return (
    <SubpageLayout title="재가노인지원서비스사업" breadcrumb="서비스사업" bannerVariant="services">
      <div className="space-y-20">
        {/* 사업소개 */}
        <section id="intro">
          <h3 className="text-xl font-bold text-heading mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-book-open text-white text-sm" />
            </span>
            사업소개
          </h3>
          <div className="bg-primary/[0.04] border border-primary/10 rounded-2xl p-6 md:p-8">
            <p className="text-[1rem] text-heading leading-[1.85]">
              경제적·정신적·신체적으로 독립적인 일상생활이 어려운 노인들에게 사례관리를 통한 통합적·포괄적 재가노인지원서비스를 제공하여 지역사회 내에서 자립적 생활의 향상과 사회적 고립감을 해소하여 건전하고 안정된 노후생활을 영위하여 사회 안전망 구축 도모한다.
            </p>
          </div>
        </section>

        {/* 서비스 내용 */}
        <section id="services">
          <h3 className="text-xl font-bold text-heading mb-8 flex items-center gap-3">
            <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-hand-holding-heart text-white text-sm" />
            </span>
            서비스 내용
          </h3>
          <div className="space-y-8">
            {serviceCategories.map((cat) => (
              <div key={cat.id} className="bg-white dark:bg-[#1A1A1A] border border-border rounded-2xl overflow-hidden">
                <div className="bg-primary/[0.06] px-6 py-4 border-b border-border">
                  <h3 className="font-bold text-heading text-lg">{cat.title}</h3>
                </div>
                <div className="divide-y divide-border">
                  {cat.items.map((item, i) => (
                    <div key={i} className="px-6 py-5">
                      <h4 className="font-semibold text-heading mb-1">{item.title}</h4>
                      <p className="text-[1rem] text-muted leading-[1.7]">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 신청절차 */}
        <section id="process">
          <h3 className="text-xl font-bold text-heading mb-8 flex items-center gap-3">
            <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-list-check text-white text-sm" />
            </span>
            신청절차
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {applicationSteps.map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg mb-3">
                  {i + 1}
                </div>
                <p className="text-[1rem] text-heading font-medium leading-snug">{step}</p>
                {i < applicationSteps.length - 1 && (
                  <i className="fa-solid fa-chevron-right text-border absolute top-5 -right-2 hidden lg:block text-sm" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 신청서류 */}
        <section id="documents">
          <h3 className="text-xl font-bold text-heading mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-file-lines text-white text-sm" />
            </span>
            신청서류
          </h3>
          <div className="bg-white dark:bg-[#1A1A1A] border border-border rounded-2xl p-6">
            <ul className="space-y-3">
              {requiredDocuments.map((doc, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-check text-primary text-[10px]" />
                  </span>
                  <span className="text-[1rem] text-heading">{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </SubpageLayout>
  );
}
