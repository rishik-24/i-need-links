import FeaturedTools from "./FeaturedTools";
import GovernmentPreview from "./GovernmentPreview";
import HomeCTA from "./HomeCTA";
import HomeHero from "./HomeHero";
import QuickServices from "./QuickServices";
import WhyINeedLinks from "./WhyINeedLinks";

export default function HomePage() {
  return (
    <div className="space-y-0">
      <HomeHero />
      <QuickServices />
      <FeaturedTools />
      <GovernmentPreview />
      <WhyINeedLinks />
      <HomeCTA />
    </div>
  );
}
