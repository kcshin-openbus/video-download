import Link from "next/link";
import FontSizeControl from "@/components/common/FontSizeControl";

export default function Footer() {
  return (
    <footer className="bg-[#111827] text-white mt-auto">
      <div className="max-w-[1520px] mx-auto px-5 md:px-6 py-12 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
          {/* 센터 정보 */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 bg-[#114be4] rounded-xl flex items-center justify-center">
                <span className="text-white font-extrabold text-[1rem]">시</span>
              </div>
              <span className="font-bold text-[1.0625rem]">시민재가노인지원서비스센터</span>
            </div>
            <ul className="space-y-3 text-[1rem] text-gray-300">
              <li className="flex items-start gap-3">
                <i className="fa-solid fa-location-dot text-[1rem] mt-1 text-accent-light shrink-0" />
                경기도 의정부시 경의로 42, 5층
              </li>
              <li className="flex items-center gap-3">
                <i className="fa-solid fa-phone text-[1rem] text-accent-light shrink-0" />
                031-873-3682
              </li>
              <li className="flex items-center gap-3">
                <i className="fa-solid fa-fax text-[1rem] text-accent-light shrink-0" />
                031-873-3678
              </li>
            </ul>
          </div>

          {/* 바로가기 */}
          <div className="md:col-span-3">
            <h4 className="font-bold text-[1rem] text-gray-200 mb-5">바로가기</h4>
            <ul className="space-y-2.5">
              {[
                { label: "센터소개", href: "/about/greeting" },
                { label: "재가노인지원서비스사업", href: "/services" },
                { label: "후원 안내", href: "/support/donation" },
                { label: "자원봉사자 모집", href: "/support/volunteer" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[1rem] text-gray-300 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 후원 계좌 */}
          <div className="md:col-span-4">
            <h4 className="font-bold text-[1rem] text-gray-200 mb-5">후원 계좌</h4>
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <p className="text-[1rem] text-gray-300 mb-1">농협</p>
              <p className="text-[1.25rem] font-bold text-accent-light tracking-wide tabular-nums">
                351-5175-3317-63
              </p>
              <p className="text-[1rem] text-gray-300 mt-1.5">시민재가노인지원서비스센터</p>
            </div>
            <p className="text-[1rem] text-gray-300 mt-3 leading-relaxed">
              여러분의 작은 나눔이 어르신의 큰 행복이 됩니다.
            </p>
          </div>
        </div>

        {/* 하단 */}
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <FontSizeControl />
          <p className="text-[1rem] text-gray-300">
            &copy; {new Date().getFullYear()} 시민재가노인지원서비스센터. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
