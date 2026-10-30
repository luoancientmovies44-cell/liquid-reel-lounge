import { MovieCard } from "@/components/movies/MovieCard";
import type { Movie, Series, ContentItem } from "@/lib/firebase-db";
import { compareTitles } from "@/lib/title-order";

interface MovieGridProps {
  items: (Movie | Series | ContentItem)[];
  contentType?: "movie" | "series";
  columns?: string;
}

export function MovieGrid({ items, contentType, columns }: MovieGridProps) {
  return (
    <div className="library-grid">
      {[...items].sort(compareTitles).map((item) => {
        const type = contentType || (item as ContentItem).type || "movie";
        return (
          <div key={`${type}-${item.id}`} className="min-w-0">
            <MovieCard movie={item} contentType={type} />
          </div>
        );
      })}
    </div>
  );
}
