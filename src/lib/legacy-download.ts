import { usesDirectVideoPlayer } from "@/lib/upload-policy";
import { startDirectVideoDownload } from "@/lib/direct-download";
import { createDownloadLink, getFileIdFromUrl } from "@/lib/download-service";

export type DownloadFrame = { url: string; title: string; fallbackUrl?: string; fileId?: string };

/** Original download method: direct R2 files download immediately; Drive files open the download frame. */
export async function startOriginalDownload(id: string, title: string, rawUrl: string, userId: string): Promise<DownloadFrame | "direct"> {
  if (usesDirectVideoPlayer(rawUrl)) {
    const ext = new URL(rawUrl).pathname.match(/\.(mp4|m4v|webm|mov|m3u8)$/i)?.[1] || "mp4";
    startDirectVideoDownload(rawUrl, `${title}.${ext}`);
    return "direct";
  }
  const fileId = getFileIdFromUrl(rawUrl);
  const link = await createDownloadLink(id, title, rawUrl, userId);
  if (!link) throw new Error("Invalid video URL.");
  return {
    url: link.downloadUrl,
    title: link.filename,
    fallbackUrl: fileId ? `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t` : rawUrl,
    fileId: fileId ?? undefined,
  };
}
