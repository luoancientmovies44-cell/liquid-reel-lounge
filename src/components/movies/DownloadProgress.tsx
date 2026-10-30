import { Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
export type DownloadState = "preparing" | "started" | null;
export function DownloadProgress({ state, title, onClose }: { state: DownloadState; title: string; onClose: () => void }) {
  return <Dialog open={state !== null} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="max-w-xs p-6 text-center">
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-primary-foreground ${state === "started" ? "bg-success" : "gradient-primary"}`}>
        {state === "started" ? <Check className="h-7 w-7" /> : <Loader2 className="h-7 w-7 animate-spin" />}
      </div>
      <DialogTitle className="break-words text-base leading-snug">{title}</DialogTitle>
      <DialogDescription className="text-xs" aria-live="polite">{state === "started" ? "Download started — check your downloads." : "Preparing your download…"}</DialogDescription>
      <div className="download-progress" data-started={state === "started"} aria-hidden="true"><div /></div>
      {state === "started" && <Button variant="outline" className="w-full" onClick={onClose}>Done</Button>}
    </DialogContent>
  </Dialog>;
}