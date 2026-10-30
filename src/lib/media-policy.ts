import { isPublicR2Source } from "./direct-download";
import { isSubscriptionCurrent } from "./subscription-time";

export function allowedMediaSource(source: string): string | null {
  if (isPublicR2Source(source)) return source;
  try {
    const url = new URL(source);
    if (url.protocol !== "https:" || url.username || url.password || !["drive.google.com", "docs.google.com", "drive.usercontent.google.com"].includes(url.hostname)) return null;
    const id = url.pathname.match(/\/file\/d\/([\w-]+)/)?.[1] || url.searchParams.get("id") || url.searchParams.get("fileId");
    return id && /^[\w-]{1,200}$/.test(id) ? `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t` : null;
  } catch { return null; }
}
export function isMediaContentType(value: string): boolean {
  const type = value.split(";")[0].trim().toLowerCase();
  return type.startsWith("video/") || ["application/octet-stream", "application/x-matroska", "application/mp4"].includes(type);
}
export function mediaFilename(title: string, source: string): string {
  const clean = title.replace(/[\x00-\x1f\x7f<>:"/\\|?*]/g, "").trim().slice(0, 180) || "movie";
  const ext = new URL(source).pathname.match(/\.(mp4|m4v|webm|mkv|mov)$/i)?.[1] || "mp4";
  return /\.(mp4|m4v|webm|mkv|mov)$/i.test(clean) ? clean : `${clean}.${ext}`;
}
export function hasMediaAccess(subscription: { isActive?: boolean; expiresAt?: unknown; plan?: string } | null, agent: boolean, admin: boolean, now = Date.now()): boolean {
  return admin || (isSubscriptionCurrent(subscription, now) && (!agent || subscription?.plan?.trim().toLowerCase().startsWith("agent") === true));
}