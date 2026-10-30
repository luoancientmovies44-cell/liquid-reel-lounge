import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const APK_URL = "https://pub-1be50268c1e84d6eabf85c0b779e7eb2.r2.dev/Luo%20ancient%20movies.apk";

export function InstallAppButton() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const dismissedAt = localStorage.getItem("app_download_dismissed");
    setDismissed(!!dismissedAt && Date.now() - parseInt(dismissedAt) < 86400000);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("app_download_dismissed", Date.now().toString());
  };

  if (dismissed) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex items-center gap-2 animate-in slide-in-from-bottom-4 fade-in duration-500 lg:bottom-6">
      <Button asChild variant="greeting" className="h-auto gap-2 rounded-full px-4 py-3 shadow-lg">
      <a
        href={APK_URL}
        download
      >
        <Download className="w-5 h-5" />
        Download App
      </a>
      </Button>
      <Button variant="secondary" size="icon"
        onClick={handleDismiss}
        className="rounded-full shadow-md"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
