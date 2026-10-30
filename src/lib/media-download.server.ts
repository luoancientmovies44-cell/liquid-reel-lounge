import { allowedMediaSource, hasMediaAccess, isMediaContentType, mediaFilename } from "./media-policy";

const cookieName = "luo-media-session";
type Selection = { kind: "movie" | "series" | "comedy"; id: string; episodeId?: string };
const primary = "https://luo-ancient-movies-2-default-rtdb.firebaseio.com";
const legacy = "https://luo-ancient-movies-com-default-rtdb.firebaseio.com";

function selection(params: URLSearchParams): Selection {
  const kind = params.get("kind");
  const id = params.get("id") || "";
  const episodeId = params.get("episodeId") || undefined;
  if (!["movie", "series", "comedy"].includes(kind || "") || !/^[\w-]{1,200}$/.test(id) || (episodeId && !/^[\w-]{1,200}$/.test(episodeId))) throw new Error("Invalid movie selection.");
  if (kind === "series" && !episodeId) throw new Error("Select an episode first.");
  return { kind: kind as Selection["kind"], id, episodeId };
}
async function readContent(path: string, fetcher: typeof fetch) {
  for (const host of [primary, legacy]) {
    const response = await fetcher(`${host}/${path}.json`, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error("The movie library could not be reached.");
    const data = await response.json() as Record<string, unknown> | null;
    if (data) return data;
  }
  throw new Error("This movie is no longer available.");
}
function firestoreValue(value: Record<string, any> | undefined): any {
  if (!value) return undefined;
  if (value.mapValue) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([k, v]) => [k, firestoreValue(v as Record<string, any>)]));
  return value.timestampValue ?? value.stringValue ?? value.booleanValue ?? value.integerValue;
}
async function resolveAccess(token: string, item: Selection, fetcher: typeof fetch) {
  const verification = await fetcher("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=AIzaSyDDxnyI_tieH-VQlzRJnD8Ykb4ric8VgWo", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: token }), signal: AbortSignal.timeout(15000),
  });
  const identity = await verification.json() as { users?: { localId?: string; email?: string; emailVerified?: boolean; disabled?: boolean }[] };
  const user = identity.users?.[0];
  if (!verification.ok || !user?.localId || user.disabled) throw new Error("Please sign in again to download.");
  const profile = await fetcher(`https://firestore.googleapis.com/v1/projects/luo-ancient-movies-2/databases/(default)/documents/users/${encodeURIComponent(user.localId)}`, {
    headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000),
  });
  if (!profile.ok) throw new Error("Your subscription could not be verified.");
  const data = await profile.json() as { fields?: Record<string, any> };
  const subscription = firestoreValue(data.fields?.subscription);
  const content = await readContent(`${item.kind === "movie" ? "movies" : item.kind === "comedy" ? "comedies" : "episodes"}/${item.episodeId || item.id}`, fetcher);
  if (item.kind === "series" && content.seriesId !== item.id) throw new Error("This episode does not belong to the selected series.");
  const agent = item.kind === "series" ? content.isAgent === true : content.isAgent === true && typeof content.agentMarkedAt === "number" && Date.now() - content.agentMarkedAt < 2 * 24 * 60 * 60 * 1000;
  const admin = user.emailVerified === true && user.email === "lightstarrecord@gmail.com";
  if (!hasMediaAccess(subscription, agent, admin)) throw new Error(agent ? "An active Agent Plan is required." : "An active subscription is required.");
  const source = typeof content.videoUrl === "string" ? allowedMediaSource(content.videoUrl) : null;
  if (!source) throw new Error("This provider does not support same-page downloads. Ask admin for a Google Drive or public R2 video link.");
  const title = String(content.title || "movie");
  return { source, filename: mediaFilename(title, source) };
}
async function fetchMedia(source: string, range: string | null, fetcher: typeof fetch) {
  let target = source;
  for (let n = 0; n < 6; n++) {
    const headers = new Headers({ "Accept-Encoding": "identity" });
    if (range) headers.set("Range", range);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    let result: Response;
    try { result = await fetcher(target, { headers, redirect: "manual", signal: controller.signal }); }
    finally { clearTimeout(timeout); }
    if ([301, 302, 303, 307, 308].includes(result.status)) {
      const location = result.headers.get("location");
      await result.body?.cancel();
      if (!location) throw new Error("The video provider returned an invalid redirect.");
      const next = new URL(location, target);
      if (next.protocol !== "https:" || next.username || next.password || !(next.hostname === "drive.usercontent.google.com" || next.hostname.endsWith(".googleusercontent.com"))) throw new Error("The video provider returned an unsupported redirect.");
      target = next.href;
      continue;
    }
    return result;
  }
  throw new Error("The video provider redirected too many times.");
}
export async function handleMediaDownload(request: Request, fetcher: typeof fetch = fetch): Promise<Response> {
  const params = new URL(request.url).searchParams;
  try {
    const item = selection(params);
    const preflight = request.method === "POST";
    if (preflight) {
      const origin = request.headers.get("origin");
      if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Not allowed." }, { status: 403 });
    }
    if (request.headers.get("range") && !/^bytes=\d*-\d*$/.test(request.headers.get("range") || "")) return Response.json({ error: "Invalid byte range." }, { status: 400 });
    const body = preflight ? await request.json() as { idToken?: string } : undefined;
    const raw = request.headers.get("cookie")?.split(";").find(v => v.trim().startsWith(`${cookieName}=`))?.trim().slice(cookieName.length + 1);
    const token = preflight ? body?.idToken : raw ? decodeURIComponent(raw) : undefined;
    if (typeof token !== "string" || token.length < 1 || token.length > 10000) return Response.json({ error: "Please sign in to download." }, { status: 401 });
    const { source, filename } = await resolveAccess(token, item, fetcher);
    const upstream = await fetchMedia(source, preflight ? "bytes=0-0" : request.headers.get("range"), fetcher);
    if (upstream.status === 416) {
      await upstream.body?.cancel();
      return new Response(null, { status: 416, headers: upstream.headers.get("content-range") ? { "Content-Range": upstream.headers.get("content-range") || "", "Cache-Control": "private, no-store" } : {} });
    }
    if (!upstream.ok || !upstream.body || !isMediaContentType(upstream.headers.get("content-type") || "")) {
      await upstream.body?.cancel();
      throw new Error("The provider did not return a video. The file may be unavailable, restricted or over its download quota; ask admin to check its sharing and link.");
    }
    if (preflight) {
      const reader = upstream.body.getReader();
      const first = await reader.read();
      await reader.cancel();
      if (first.done || !first.value?.byteLength) throw new Error("The video file is empty or unavailable.");
      return Response.json({ ok: true, filename }, { headers: { "Cache-Control": "private, no-store", "Set-Cookie": `${cookieName}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/api/public/video-download; Max-Age=3300${new URL(request.url).protocol === "https:" ? "; Secure" : ""}` } });
    }
    const ascii = filename.normalize("NFKD").replace(/[^\x20-\x7e]/g, "") || "movie.mp4";
    const headers = new Headers({ "Content-Type": upstream.headers.get("content-type") || "video/mp4", "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename).replace(/['()*]/g, c => `%${c.charCodeAt(0).toString(16)}`)}`, "Cache-Control": "private, no-store, no-transform", "X-Content-Type-Options": "nosniff" });
    for (const name of ["Content-Range", "Content-Length", "Accept-Ranges"]) { const value = upstream.headers.get(name); if (value) headers.set(name, value); }
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Download unavailable. Please try again." }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  }
}