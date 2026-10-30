import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database, legacyDatabase } from "@/lib/firebase";
import { getMovies, getSeries, isMovieInAgentMode, type ContentItem } from "@/lib/firebase-db";
import { MovieGrid } from "@/components/movies/MovieGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function Library() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const [movies, series] = await Promise.all([getMovies(), getSeries()]);
        if (!alive) return;
        setItems([...movies.filter(m => !isMovieInAgentMode(m)).map(m => ({ ...m, type: "movie" as const })), ...series.map(s => ({ ...s, type: "series" as const }))]);
        setFailed(false);
      } catch { if (alive) setFailed(true); }
      finally { if (alive) setLoading(false); }
    };
    const schedule = () => { clearTimeout(timer); timer = setTimeout(load, 150); };
    const unsubscribe = [database, legacyDatabase].flatMap(db => ["movies", "series", "episodes"].map(path => onValue(ref(db, path), schedule, () => { if (alive) { setFailed(true); setLoading(false); } })));
    void load();
    return () => { alive = false; clearTimeout(timer); unsubscribe.forEach(stop => stop()); };
  }, []);
  return <section className="mt-6">
    <div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-xs font-medium uppercase text-muted-foreground">Library · {loading ? "…" : items.length}</h2></div>
    {loading ? <div className="library-grid">{Array.from({ length: 12 }, (_, i) => <Skeleton key={i} className="aspect-[2/3] rounded-[6px]" />)}</div>
      : failed ? <div className="glass rounded-3xl p-8 text-sm">The library could not connect. Please try again.</div>
      : items.length ? <MovieGrid items={items} /> : <div className="glass rounded-3xl p-8 text-sm">No movies yet.</div>}
  </section>;
}