import { Link, useNavigate } from "react-router-dom";
import { Search, LogIn, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, FormEvent } from "react";
import { searchContent } from "@/lib/firebase-db";
import { SubscriptionModal } from "@/components/subscription/SubscriptionModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { ProfileDropdown } from "@/components/auth/ProfileDropdown";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import luoAncientLogo from "@/assets/luo-ancient-logo.png";

export function Header() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [showSuggest, setShowSuggest] = useState(false);
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<{ id: string; title: string; poster: string; year?: number; kind: "movie" | "series" }[]>([]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) { setSuggestions([]); return; }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      const r = await searchContent(q);
      if (cancelled) return;
      setSuggestions([
        ...r.movies.map((m) => ({ id: m.id || "", title: m.title, poster: m.posterUrl, year: m.releaseYear, kind: "movie" as const })),
        ...r.series.map((s) => ({ id: s.id || "", title: s.title, poster: s.posterUrl, year: s.releaseYear, kind: "series" as const })),
      ].filter((x) => x.id).slice(0, 8));
      setSearching(false);
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [searchQuery]);

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <header className="library-header compact-header glass">
        <div className="contents lg:flex lg:items-center lg:justify-between lg:gap-2">
          <Link to="/" className="order-1 flex min-w-0 items-center gap-1 lg:gap-2">
            <img src={luoAncientLogo} alt="Luo Ancient" className="h-6 w-6 shrink-0 rounded-full object-contain lg:h-9 lg:w-9" />
            <h1 className="brand-title mobile-header-brand">LUO ANCIENT MOVIES</h1>
          </Link>
          <div className="order-3 flex shrink-0 items-center gap-1 lg:gap-2">
            <Button size="sm" className="h-8 rounded-full px-2 text-[10px] lg:hidden" onClick={() => user ? setSubscriptionOpen(true) : openAuth("login")}>Subscribe</Button>
            {isAdmin && <Button variant="outline" size="icon" className="h-8 w-8 lg:h-10 lg:w-10" aria-label="Admin dashboard" onClick={() => navigate("/admin")}><Shield /></Button>}
            {user ? <ProfileDropdown /> : <Button variant="outline" size="sm" aria-label="Login" className="h-8 w-8 px-0 lg:h-9 lg:w-auto lg:px-3" onClick={() => openAuth("login")}><LogIn /><span className="hidden lg:inline">Login</span></Button>}
          </div>
        </div>
        <form onSubmit={handleSearch} className="library-search order-2 min-w-0">
          <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search library" placeholder="Search movies and series" value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSuggest(true); }}
            onFocus={() => setShowSuggest(true)} onBlur={() => setTimeout(() => setShowSuggest(false), 200)} className="h-8 min-w-0 pl-8 pr-2 text-xs lg:h-10 lg:pl-9 lg:text-sm" />
            {showSuggest && searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-popover text-popover-foreground border border-border rounded-xl shadow-lg max-h-96 overflow-y-auto">
                {suggestions.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">{searching ? "Searching..." : "No matches"}</p>
                ) : (
                  suggestions.map((s) => (
                    <Button variant="ghost"
                      key={s.kind + s.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setShowSuggest(false); setSearchQuery(""); navigate(s.kind === "movie" ? `/watch/${s.id}` : `/watch/series/${s.id}`); }}
                      className="w-full flex items-center gap-3 p-2 hover:bg-accent text-left"
                    >
                      <img src={s.poster} alt={s.title} className="w-10 h-14 object-cover rounded" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{s.title}</p>
                        <p className="text-xs text-muted-foreground">{s.kind === "movie" ? "Movie" : "TV Series"}{s.year ? ` • ${s.year}` : ""}</p>
                      </div>
                    </Button>
                  ))
                )}
              </div>
            )}
          </form>
        <nav className="mt-3 hidden flex-wrap items-center gap-1 lg:flex" aria-label="Library categories">
          <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-[11px]"><Link to="/genres">Genres</Link></Button>
          <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-[11px]"><Link to="/trending">Trending</Link></Button>
          <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-[11px]"><Link to="/recent">Recent</Link></Button>
          <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-[11px]"><Link to="/agent">Agent</Link></Button>
          <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-[11px]"><Link to="/apps">Apps</Link></Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] text-primary" onClick={() => user ? setSubscriptionOpen(true) : openAuth("login")}>Subscribe</Button>
        </nav>
      </header>

      <SubscriptionModal open={subscriptionOpen} onOpenChange={setSubscriptionOpen} />
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultMode={authMode} />
    </>
  );
}
