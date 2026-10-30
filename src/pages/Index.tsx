import { MainLayout } from "@/components/layout/MainLayout";
import { HeroBanner } from "@/components/home/HeroBanner";
import { ContentSection } from "@/components/home/ContentSection";
import { SupportCallBar } from "@/components/home/SupportCallBar";

const Index = () => {
  return (
    <MainLayout>
      <div className="mt-4">
        <HeroBanner />
        <SupportCallBar />
      </div>
      <div className="space-y-8 mt-6">
        <ContentSection title="🔥Trending in Cinema🎞️" category="trending" showGenres />
        <ContentSection title="Popular Movies" category="popular" />
        <ContentSection title="Top TV Series" category="top-series" />
        <ContentSection title="Recently Added" category="recently-added" />
        <ContentSection title="Action Movies" category="action" />
        <ContentSection title="Comedy Shows" category="comedy" />
      </div>
    </MainLayout>
  );
};

export default Index;
