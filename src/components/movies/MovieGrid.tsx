import { MovieCard } from "@/components/movies/MovieCard";
import type { Movie, Series, ContentItem } from "@/lib/firebase-db";
import { useEffect, useMemo, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { orderMovieParts } from "@/lib/part-order";

interface MovieGridProps {
  items: (Movie | Series | ContentItem)[];
  contentType?: "movie" | "series";
  columns?: string;
}

export function MovieGrid({ items, contentType, columns }: MovieGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  // Retain catalogue ranking while displaying matching parts first-to-last.
  const ordered = useMemo(() => orderMovieParts(items), [items]);
  const [visible, setVisible] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(new Set(ordered.map((_, index) => index)));
      return;
    }
    // Keep every catalogue position, but mount expensive dialogs/access hooks
    // only as their posters approach the screen.
    const observer = new IntersectionObserver(entries => {
      const entered = entries.filter(entry => entry.isIntersecting);
      if (!entered.length) return;
      setVisible(previous => {
        const next = new Set(previous);
        for (const entry of entered) {
          const index = Number(entry.target.getAttribute("data-card-index"));
          next.add(index);
          observer.unobserve(entry.target);
        }
        return next;
      });
    }, { rootMargin: "600px" });
    grid.querySelectorAll("[data-card-index]").forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [ordered]);

  return (
    <div ref={gridRef} className={columns ? `grid ${columns} gap-2 lg:gap-3` : "library-grid"}>
      {ordered.map((item, index) => {
        const type = contentType || (item as ContentItem).type || "movie";
        return (
          <div key={`${type}-${item.id}-${(item as ContentItem).episodeInfo?.episodeId || "title"}`} data-card-index={index} className="min-w-0">
            {visible.has(index) ? <MovieCard movie={item} contentType={type} /> : (
              <div>
                <Skeleton className="aspect-[2/3] rounded-lg" />
                <div className="movie-name"><Skeleton className="h-3 w-3/4" /></div>
                <div className="movie-meta"><Skeleton className="h-3 w-1/2" /></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
