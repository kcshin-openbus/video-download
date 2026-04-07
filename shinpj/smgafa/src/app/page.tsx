import HeroBanner from "@/components/home/HeroBanner";
import StatsCounter from "@/components/home/StatsCounter";
import ServiceCards from "@/components/home/ServiceCards";
import NoticePreview from "@/components/home/NoticePreview";
import DonationBanner from "@/components/home/DonationBanner";
import LocationPreview from "@/components/home/LocationPreview";

export default function Home() {
  return (
    <>
      <HeroBanner />
      <StatsCounter />
      <ServiceCards />
      <NoticePreview />
      <DonationBanner />
      <LocationPreview />
    </>
  );
}
