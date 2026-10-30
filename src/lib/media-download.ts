import { auth } from "./firebase";
export type MediaSelection = { kind: "movie" | "series" | "comedy"; id: string; episodeId?: string };
function endpoint(selection: MediaSelection) {
  const params = new URLSearchParams({ kind: selection.kind, id: selection.id });
  if (selection.episodeId) params.set("episodeId", selection.episodeId);
  return `/api/public/video-download?${params}`;
}
export async function prepareMediaDownload(selection: MediaSelection): Promise<string> {
  if (!auth.currentUser) throw new Error("Please sign in to download.");
  const idToken = await auth.currentUser.getIdToken(true);
  const response = await fetch(endpoint(selection), { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) });
  const result = await response.json() as { ok?: boolean; error?: string; filename?: string };
  if (!response.ok || !result.ok) throw new Error(result.error || "Download could not be prepared.");
  return result.filename || "movie.mp4";
}
export function launchMediaDownload(selection: MediaSelection, onError: (message: string) => void) {
  const frame = document.createElement("iframe");
  frame.hidden = true;
  frame.title = "Movie download transport";
  frame.src = endpoint(selection);
  frame.addEventListener("load", () => {
    try {
      const text = frame.contentDocument?.body?.textContent;
      if (!text?.trim()) return;
      let message = "The download could not start. Please try again.";
      try { message = (JSON.parse(text) as { error?: string }).error || message; } catch { /* Readable non-media response is not a download. */ }
      onError(message);
      frame.remove();
    } catch { /* Native download navigation is not readable. */ }
  });
  document.body.appendChild(frame);
  // Keep transports mounted: timed cleanup can interrupt large mobile transfers.
}