import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/public/video-download")({
  server: { handlers: {
    POST: async ({ request }) => { const { handleMediaDownload } = await import("@/lib/media-download.server"); return handleMediaDownload(request); },
    GET: async ({ request }) => { const { handleMediaDownload } = await import("@/lib/media-download.server"); return handleMediaDownload(request); },
  } },
});