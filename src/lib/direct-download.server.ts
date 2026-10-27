import { isPublicR2Source } from "./direct-download";

// Public R2 objects are already public; this adds attachment headers, not access protection.
export async function streamMediaDownload(request: Request, fetcher: typeof fetch = fetch): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const source = params.get("source") || "";
  const filename = params.get("filename") || "video.mp4";
  if (source.length > 4096 || filename.length > 240 || !isPublicR2Source(source)) {
    return new Response("Invalid download", { status: 400 });
  }
  const safeFilename = filename.replace(/[\x00-\x1f\x7f<>:"/\\|?*]/g, "").trim() || "video.mp4";
  // Older download managers use filename rather than UTF-8 filename*.
  const asciiFilename = safeFilename.normalize("NFKD").replace(/[^\x20-\x7e]/g, "");
  const headers = new Headers();
  const range = request.headers.get("range");
  if (range) headers.set("Range", range);
  // Ask for the raw bytes so the size header matches what the browser receives.
  headers.set("Accept-Encoding", "identity");
  try {
    const upstream = await fetcher(source, { headers, redirect: "error", signal: request.signal });
    if (!upstream.ok) return new Response("Video unavailable", { status: upstream.status });
    const output = new Headers({
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename).replace(/['()*]/g, c => `%${c.charCodeAt(0).toString(16)}`)}`,
      "Cache-Control": "private, no-store, no-transform",
      "X-Content-Type-Options": "nosniff",
    });
    for (const name of ["Content-Length", "Content-Range", "Accept-Ranges", "ETag"]) {
      const value = upstream.headers.get(name);
      if (value) output.set(name, value);
    }
    let length = Number(upstream.headers.get("Content-Length") || "");
    if (!(length > 0) && !range) {
      // Some upstreams omit the size on GET; a HEAD request reveals it.
      try {
        const head = await fetcher(source, { method: "HEAD", redirect: "error", headers: { "Accept-Encoding": "identity" } });
        const headLength = Number(head.headers.get("Content-Length") || "");
        if (head.ok && headLength > 0) {
          length = headLength;
          output.set("Content-Length", String(headLength));
        }
      } catch {
        // Keep streaming without a size rather than failing the download.
      }
    }
    let body: ReadableStream<Uint8Array> | null = upstream.body;
    // Workers drop Content-Length on streamed bodies unless they are wrapped in a fixed-length stream.
    const FixedLength = (globalThis as { FixedLengthStream?: new (n: number) => TransformStream<Uint8Array, Uint8Array> }).FixedLengthStream;
    if (body && length > 0 && FixedLength) {
      body = body.pipeThrough(new FixedLength(length));
    }
    return new Response(body, { status: upstream.status, headers: output });
  } catch {
    return new Response("Download unavailable. Please try again.", { status: 502 });
  }
}