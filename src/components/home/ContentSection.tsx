import { MovieGrid } from "@/components/movies/MovieGrid";
import { getContentByCategory, type ContentItem } from "@/lib/firebase-db";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutGrid, ChevronDown } from "lucide-react";
import { SlingshotTitle } from "@/components/home/SlingshotTitle";
import { Button } from "@/components/ui/button";

const GENRES = [
  "Indian", "Action", "Sci-Fi", "Nigerian", "Horror", "Animation",
  "Comedy", "Romance", "Cartoon", "War", "Kung Fu", "Musical", "Fantasy",
  "Christian", "Magic", "Ghana", "Historical", "Drama", "Luo Champion"
];

interface ContentSectionProps {
  title: string;
  category?: string;
  showGenres?: boolean;
}

export function ContentSection({ title, category = "trending", showGenres = false }: ContentSectionProps) {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      try {
        const fetchedContent = await getContentByCategory(category);
        setContent(fetchedContent);
      } catch (error) {
        console.error(`Error fetching ${category} content:`, error);
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, [category]);

  const renderHeader = () => (
    <div className="flex items-center gap-3 mb-4 flex-wrap">
      <h2 className="text-xl lg:text-2xl font-bold">
        {showGenres ? <SlingshotTitle text={title} /> : title}
      </h2>
      {showGenres && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-1">
            <LayoutGrid className="w-5 h-5 lg:w-6 lg:h-6" />
            <span>Genres</span>
            <ChevronDown className="w-5 h-5 lg:w-6 lg:h-6" />
          </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="glass-strong max-h-80 overflow-y-auto rounded-2xl border-border p-2">
            {GENRES.map((genre) => (
              <DropdownMenuItem key={genre} asChild className="rounded-xl my-0.5 font-bold text-foreground focus:bg-glass-strong/10 focus:text-foreground">
                <Link to={genre === "Luo Champion" ? "/luo-champion" : `/genres/${genre.toLowerCase()}`} className="font-bold text-foreground hover:text-foreground">{genre}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );

  if (loading) {
    return (
      <section>
        {renderHeader()}
        <div className="library-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (content.length === 0) {
    return showGenres ? (
      <section>{renderHeader()}</section>
    ) : null;
  }

  return (
    <section>
      {renderHeader()}
      <MovieGrid items={content} />
    </section>
  );
}
