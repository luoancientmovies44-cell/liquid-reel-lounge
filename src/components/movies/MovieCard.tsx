import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Download, Loader2 } from "lucide-react";
import padlockImage from "@/assets/padlock-subscribe.png";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { toast } from "@/hooks/use-toast";
import type { Movie, Series, ContentItem } from "@/lib/firebase-db";
import { isMovieInAgentMode } from "@/lib/firebase-db";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { AuthModal } from "@/components/auth/AuthModal";
import { SubscriptionModal } from "@/components/subscription/SubscriptionModal";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DownloadProgress, type DownloadState } from "./DownloadProgress";
import { prepareMediaDownload, launchMediaDownload } from "@/lib/media-download";
import { tryConsumeDownload } from "@/lib/download-limit";
import { getEpisodesBySeriesId, type Episode } from "@/lib/firebase-db";

interface MovieCardProps {
  movie: Movie | Series | ContentItem;
  contentType?: 'movie' | 'series';
  forceAgentBorder?: boolean;
  /** Agent page mode: padlock + agent-only subscription gate; download only for agent subscribers */
  agentPageMode?: boolean;
}

// Extract episodeInfo if present
function getEpisodeInfo(movie: any): { seasonNumber: number; episodeNumber: number; episodeTitle: string; episodeThumbnailUrl?: string; seasonLabel?: string } | null {
  return movie.episodeInfo || null;
}

export function MovieCard({ movie, contentType, forceAgentBorder, agentPageMode }: MovieCardProps) {

  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasActiveSubscription, hasAgentPlan, subscription } = useSubscription();
  const { track } = useActivityTracker();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [downloadState, setDownloadState] = useState<DownloadState>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState("");
  const [episodeLoading, setEpisodeLoading] = useState(false);

  // Determine if it's a series
  const type = contentType || ('type' in movie ? movie.type : ('seasons' in movie ? 'series' : 'movie'));
  const isSeries = type === 'series';
  const seasons = isSeries && 'seasons' in movie ? movie.seasons : undefined;
  const episodeInfo = getEpisodeInfo(movie);
  
  // Check if movie is in agent mode
  const isAgent = !isSeries && 'isAgent' in movie && isMovieInAgentMode(movie as Movie);
  
  // Check if series has agent episodes (shows NEW badge)
  const hasAgentEpisode = isSeries && 'hasAgentEpisode' in movie && (movie as Series).hasAgentEpisode;
  
  // Get VJ name
  const vjName = 'vjName' in movie ? (movie as any).vjName : undefined;
  
  // Get the correct URL based on content type, include episode info if available
  const isComedyItem = (movie as any).isComedyItem === true;
  const watchUrl = isComedyItem
    ? `/watch/luo-champion/${movie.id}#video-player`
    : isSeries 
    ? episodeInfo 
      ? `/watch/series/${movie.id}?season=${episodeInfo.seasonNumber}&episode=${episodeInfo.episodeNumber}#video-player`
      : `/watch/series/${movie.id}#video-player` 
    : `/watch/${movie.id}#video-player`;
  
  // Get poster URL - use episode thumbnail if available
  const posterUrl = episodeInfo?.episodeThumbnailUrl 
    ? episodeInfo.episodeThumbnailUrl 
    : ('posterUrl' in movie ? movie.posterUrl : ('poster' in movie ? (movie as any).poster : ''));
  
  // Get genre
  const genreDisplay = typeof movie.genre === 'string' ? movie.genre : (Array.isArray(movie.genre) ? movie.genre[0] : '');
  
  // Get year
  const year = 'releaseYear' in movie ? movie.releaseYear : ('year' in movie ? (movie as any).year : '');

  // Agent page: locked for logged-out users and non-agent subscribers
  const isLocked = agentPageMode ? (!user || !hasAgentPlan) : false;

  const checkAccess = () => {
    if (!user) { setShowAuthModal(true); return false; }
    const selected = episodes.find(ep => ep.id === selectedEpisodeId);
    if ((agentPageMode || isAgent || selected?.isAgent) && !hasAgentPlan) { setShowAgentModal(true); return false; }
    if (!hasActiveSubscription && !hasAgentPlan) { setShowSubscriptionModal(true); return false; }
    return true;
  };
  const openDetail = async () => {
    track("Click", `Selected "${movie.title}" (${type})`);
    setDetailOpen(true);
    if (isSeries && movie.id) {
      setEpisodeLoading(true);
      try {
        const data = await getEpisodesBySeriesId(movie.id);
        data.sort((a,b) => a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber);
        setEpisodes(data);
        const selected = data.find(ep => ep.seasonNumber === episodeInfo?.seasonNumber && ep.episodeNumber === episodeInfo?.episodeNumber) || data[0];
        setSelectedEpisodeId(selected?.id || "");
      } catch { toast({ title: "Episodes could not load", variant: "destructive" }); }
      finally { setEpisodeLoading(false); }
    }
  };
  const watch = () => {
    if (!checkAccess()) return;
    track("Play", `Started watching "${movie.title}"`);
    const selected = episodes.find(ep => ep.id === selectedEpisodeId);
    navigate(isSeries && selected ? `/watch/series/${movie.id}?season=${selected.seasonNumber}&episode=${selected.episodeNumber}#video-player` : watchUrl);
  };
  const download = async () => {
    if (downloadState || !checkAccess() || !user || !movie.id) return;
    const selection = { kind: isComedyItem ? "comedy" as const : isSeries ? "series" as const : "movie" as const, id: movie.id, ...(isSeries ? { episodeId: selectedEpisodeId } : {}) };
    setDownloadState("preparing");
    try {
      await prepareMediaDownload(selection);
      const result = await tryConsumeDownload(user.id, subscription?.plan);
      if (!result.allowed) throw new Error("You have reached your download limit for today.");
      launchMediaDownload(selection, message => { setDownloadState(null); toast({ title: "Download failed", description: message, variant: "destructive" }); });
      setDownloadState("started");
      track("Download", `Download initiated for "${movie.title}"`);
    } catch (error) {
      setDownloadState(null);
      toast({ title: "Download unavailable", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    }
  };

  const handleDownloadPoster = async (e: Event) => {
    e.preventDefault();
    if (!posterUrl) return;
    const safeTitle = (episodeInfo ? episodeInfo.episodeTitle : movie.title)
      .replace(/[<>:"/\\|?*]/g, "")
      .replace(/\s+/g, "_");
    const rawExt = (posterUrl.split("?")[0].split(".").pop() || "jpg").toLowerCase();
    const ext = rawExt.length <= 4 ? rawExt : "jpg";
    const filename = `${safeTitle}_poster.${ext}`;
    try {
      const res = await fetch(posterUrl, { mode: "cors" });
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      track("Download", `Downloaded poster for "${movie.title}"`);
      toast({ title: "Poster downloaded", description: filename });
    } catch {
      window.open(posterUrl, "_blank", "noopener,noreferrer");
      toast({ title: "Opened poster in new tab", description: "Right-click the image and choose Save image as..." });
    }
  };

  const cardContent = (
    <Button variant="ghost" className="movie-holder hover:bg-transparent" onClick={openDetail} aria-label={`Open ${movie.title}`}>
      <div className="w-full">
        <img src={posterUrl} alt={movie.title} loading="lazy" className="movie-poster" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }} />
        <h3 className="movie-name">{episodeInfo ? episodeInfo.episodeTitle : movie.title}</h3>
      </div>
    </Button>
  );

  return (
    <>
      {agentPageMode && isLocked ? (
        cardContent
      ) : (
        <ContextMenu>
          <ContextMenuTrigger asChild>{cardContent}</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onSelect={handleDownloadPoster}>
              <Download className="w-4 h-4 mr-2" />
              Download Poster
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )}



      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md p-4">
          <div className="flex gap-4 pr-8">
            <div className="w-28 shrink-0"><img src={posterUrl} alt={movie.title} className="movie-poster" /></div>
            <DialogTitle className="min-w-0 pt-2 text-lg leading-snug break-words">{movie.title}</DialogTitle>
          </div>
          <DialogDescription className="sr-only">Watch or download {movie.title}</DialogDescription>
          {isSeries && <div className="space-y-2">
            <label htmlFor={`episode-${movie.id}`} className="text-xs text-muted-foreground">Episode</label>
            <select id={`episode-${movie.id}`} value={selectedEpisodeId} onChange={e => setSelectedEpisodeId(e.target.value)} className="glass w-full rounded-2xl p-3 text-sm" disabled={episodeLoading}>
              {episodeLoading ? <option>Loading episodes…</option> : !episodes.length ? <option>No episodes available</option> : episodes.map(ep => <option key={ep.id} value={ep.id}>S{ep.seasonNumber} E{ep.episodeNumber} · {ep.title}</option>)}
            </select>
          </div>}
          <div className="mt-1 grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-12" onClick={watch}><Play />Watch</Button>
            <Button className="h-12" onClick={download} disabled={!!downloadState || (isSeries && (episodeLoading || !selectedEpisodeId))}><Download />Download</Button>
          </div>
        </DialogContent>
      </Dialog>
      <DownloadProgress state={downloadState} title={movie.title} onClose={() => setDownloadState(null)} />
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} defaultMode="login" />
      <SubscriptionModal open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal} />
      {/* Agent subscription modal */}
      <SubscriptionModal open={showAgentModal} onOpenChange={setShowAgentModal} agentOnly />
    </>
  );
}
