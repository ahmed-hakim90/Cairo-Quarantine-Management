import { HeroSection } from "@/components/home/HeroSection";
import { ImportantLinks } from "@/components/home/ImportantLinks";
import { LocationsSection } from "@/components/home/LocationsSection";
import { ServiceCards } from "@/components/home/ServiceCards";
import { VaccineSelector } from "@/components/home/VaccineSelector";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ServiceCards />
      <VaccineSelector />
      <ImportantLinks />
      <LocationsSection />
    </>
  );
}
