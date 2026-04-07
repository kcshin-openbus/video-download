"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SubpageBanner from "./SubpageBanner";

interface SubpageLayoutProps {
  title: string;
  breadcrumb: string;
  bannerImage?: string;
  bannerVariant?: "about" | "services" | "support" | "community";
  sideMenu?: { label: string; href: string }[];
  children: React.ReactNode;
}

export default function SubpageLayout({ title, breadcrumb, bannerVariant = "about", sideMenu, children }: SubpageLayoutProps) {
  const pathname = usePathname();

  return (
    <>
      <SubpageBanner title={title} breadcrumb={breadcrumb} variant={bannerVariant} />

      <div className="max-w-[1520px] mx-auto px-5 md:px-6 py-10 md:py-16 lg:py-20">
        <div className={sideMenu ? "flex flex-col lg:flex-row gap-10 lg:gap-14" : ""}>
          {sideMenu && (
            <aside className="lg:w-[220px] shrink-0">
              <nav className="lg:sticky lg:top-[92px]">
                <ul className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                  {sideMenu.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`block whitespace-nowrap px-4 py-2.5 rounded-md text-[1rem] font-medium transition-all ${
                          pathname.startsWith(item.href)
                            ? "bg-primary text-white shadow-md"
                            : "text-muted hover:text-heading hover:bg-bg-section"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </>
  );
}
