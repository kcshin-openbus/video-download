interface PageTitleProps {
  title: string;
  subtitle?: string;
}

export default function PageTitle({ title, subtitle }: PageTitleProps) {
  return (
    <div className="bg-[#0A1847] py-14 md:py-20 text-center">
      <h1 className="text-[2rem] md:text-[2.75rem] lg:text-[3.25rem] font-extrabold !text-white tracking-tight">{title}</h1>
      {subtitle && (
        <p className="text-accent mt-3 text-[1rem] md:text-[1.125rem] font-medium">{subtitle}</p>
      )}
    </div>
  );
}
