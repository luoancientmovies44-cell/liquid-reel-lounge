import { Link } from "react-router-dom";
import { Play, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { getFeaturedContent, getHeroImages, type ContentItem, type HeroImage } from "@/lib/firebase-db";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const AUTO_SLIDE_INTERVAL = 15000;

const ANIMATIONS = [
  // Fade
  { enter: "animate-[fadeIn_0.8s_ease-out_forwards]", exit: "animate-[fadeOut_0.5s_ease-in_forwards]" },
  // Slide from right
  { enter: "animate-[slideInRight_0.7s_ease-out_forwards]", exit: "animate-[slideOutLeft_0.5s_ease-in_forwards]" },
  // Zoom in
  { enter: "animate-[zoomIn_0.8s_ease-out_forwards]", exit: "animate-[zoomOut_0.5s_ease-in_forwards]" },
  // Slide from bottom
  { enter: "animate-[slideInUp_0.7s_ease-out_forwards]", exit: "animate-[slideOutDown_0.5s_ease-in_forwards]" },
  // Flip
  { enter: "animate-[flipIn_0.8s_ease-out_forwards]", exit: "animate-[flipOut_0.5s_ease-in_forwards]" },
  // Blur in
  { enter: "animate-[blurIn_0.8s_ease-out_forwards]", exit: "animate-[blurOut_0.5s_ease-in_forwards]" },
];

type SlideItem =
  | { kind: "content"; data: ContentItem }
  | { kind: "hero"; data: HeroImage };

export function HeroBanner() {
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [animIndex, setAnimIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);

  useEffect(() => {
    let alive = true;
    let heroSlides: SlideItem[] = [];
    let contentSlides: SlideItem[] = [];
    let completed = 0;
    const publish = () => {
      if (!alive) return;
      const next = [...heroSlides, ...contentSlides];
      setSlides(next);
      if (next.length > 0 || completed === 2) setLoading(false);
    };
    // Saved banners can appear without waiting for the full episode catalogue.
    void getHeroImages().then(images => {
      heroSlides = images.map(data => ({ kind: "hero", data }));
    }).catch(error => console.error("Error fetching hero images:", error)).finally(() => {
      completed += 1;
      publish();
    });
    void getFeaturedContent(10).then(content => {
      contentSlides = content.map(data => ({ kind: "content", data }));
    }).catch(error => console.error("Error fetching featured content:", error)).finally(() => {
      completed += 1;
      publish();
    });
    return () => { alive = false; };
  }, []);

  const transitionTo = useCallback((nextIndex: number) => {
    if (slides.length <= 1) return;
    setAnimIndex((index) => (index + 1) % ANIMATIONS.length);
    setDisplayIndex(nextIndex);
    setCurrentIndex(nextIndex);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      const next = (currentIndex + 1) % slides.length;
      transitionTo(next);
    }, AUTO_SLIDE_INTERVAL);
    return () => clearInterval(interval);
  }, [slides.length, currentIndex, transitionTo]);

  const goToPrevious = useCallback(() => {
    const prev = (currentIndex - 1 + slides.length) % slides.length;
    transitionTo(prev);
  }, [slides.length, currentIndex, transitionTo]);

  const goToNext = useCallback(() => {
    const next = (currentIndex + 1) % slides.length;
    transitionTo(next);
  }, [slides.length, currentIndex, transitionTo]);

  if (loading) {
    return (
      <div className="home-hero relative w-full overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (slides.length === 0) return null;

  const current = slides[displayIndex];
  const anim = ANIMATIONS[animIndex];
  const animClass = anim.enter;

  return (
    <div className="home-hero relative w-full overflow-hidden group rounded-lg">
      {/* Background Image */}
      <div key={`image-${displayIndex}`} className={`absolute inset-0 overflow-hidden ${animClass}`}>
        <img
          src={current.kind === "content" ? current.data.posterUrl : current.data.imageUrl}
          alt={current.data.title}
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
        />
      </div>

      <div className="hero-scrim absolute inset-0 pointer-events-none" />

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <Button variant="outline" size="icon"
            onClick={goToPrevious}
            className="absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/70 z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button variant="outline" size="icon"
            onClick={goToNext}
            className="absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/70 z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </>
      )}


      {/* Content overlay */}
      <div key={`copy-${displayIndex}`} className={`hero-copy absolute bottom-14 left-0 right-0 pr-12 ${animClass}`}>
        <div className="px-4 lg:px-6 max-w-xl">
          {current.kind === "hero" ? (
            <div>
              {current.data.badgeText && (
                <span className="inline-block px-2.5 py-0.5 mb-2 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                  {current.data.badgeText}
                </span>
              )}
              <h2 className="text-xl lg:text-3xl font-bold mb-1 hero-copy">{current.data.title}</h2>
              {current.data.subtitle && (
                <p className="text-sm hero-copy mb-1 font-medium">{current.data.subtitle}</p>
              )}
              <p className="max-w-full text-xs sm:text-sm mb-3 line-clamp-2 font-medium hero-copy">{current.data.description}</p>
              {current.data.linkUrl && (
                <Link to={current.data.linkUrl}>
                  <Button size="sm" className="gradient-primary text-primary-foreground gap-1.5 h-8 px-4 text-xs">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Watch Now
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-xl lg:text-3xl font-bold mb-1 hero-copy">{current.data.title}</h2>
              <div className="flex items-center gap-2 text-xs hero-copy mb-2">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-warning fill-warning" />
                  <span className="hero-copy font-medium">{current.data.rating}</span>
                </div>
                <span>{current.data.releaseYear}</span>
                <span>{current.data.genre}</span>
              </div>
              <p className="max-w-full text-xs sm:text-sm mb-3 line-clamp-1 font-medium hero-copy">{current.data.description}</p>
              <Link to={current.data.type === "series" ? `/watch/series/${current.data.id}` : `/watch/${current.data.id}`}>
                <Button size="sm" className="gradient-primary text-primary-foreground gap-1.5 h-8 px-4 text-xs">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Watch Now
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, index) => (
            <Button variant="ghost"
              key={index}
              onClick={() => transitionTo(index)}
              className={`min-w-0 p-0 w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? "w-6 bg-primary" : "bg-glass-strong hover:bg-primary"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Marquee inside hero (all devices) */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden whitespace-nowrap h-6 sm:h-7 lg:h-8 bg-background/40 backdrop-blur-sm z-10 pointer-events-none">
        <div className="hero-marquee absolute whitespace-nowrap flex gap-32 top-1/2 -translate-y-1/2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="text-xs lg:text-sm font-semibold text-foreground inline-block"
            >
              🎬 Enjoy the full world of Luo cinema, perfectly translated by Luo Ancient 🎬
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
