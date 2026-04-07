export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export const navigation: NavItem[] = [
  {
    label: "센터소개",
    href: "/about/greeting",
    children: [
      { label: "센터장 인사말", href: "/about/greeting" },
      { label: "미션/비전", href: "/about/mission" },
      { label: "연혁", href: "/about/history" },
      { label: "조직도", href: "/about/organization" },
      { label: "찾아오시는 길", href: "/about/location" },
    ],
  },
  {
    label: "재가노인지원서비스사업",
    href: "/services",
  },
  {
    label: "후원·자원봉사",
    href: "/support/donation",
    children: [
      { label: "후원 안내", href: "/support/donation" },
      { label: "자원봉사자 모집", href: "/support/volunteer" },
    ],
  },
  {
    label: "커뮤니티",
    href: "/community/notices",
    children: [
      { label: "공지사항", href: "/community/notices" },
      { label: "센터 소식", href: "/community/news" },
    ],
  },
];
