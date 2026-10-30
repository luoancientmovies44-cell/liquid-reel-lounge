import { useState } from "react";
import { UserCheck, Megaphone, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { GreetingAdvertModal } from "@/components/greetings/GreetingAdvertModal";
import { Button } from "@/components/ui/button";


/**
 * Mobile-only bar under the hero slide. Shows the support phone number,
 * a shortcut to the Agent page, and the Greeting button — all stretched to
 * fill the row. Spans exactly the same width as the movie grid below it
 * (same px-4 padding, no max-width) so it never overflows or stops short.
 */
export function SupportCallBar() {
  const [advertOpen, setAdvertOpen] = useState(false);

  return (
    <div className="lg:hidden px-4 py-2">
      <div className="grid w-full grid-cols-[minmax(0,1.2fr)_minmax(0,0.82fr)_minmax(0,0.95fr)] items-stretch gap-1.5">
        <Button asChild variant="greeting" className="min-w-0 w-full gap-1 rounded-lg px-1 py-2 text-[11px] sm:text-xs">
        <a
          href="https://pub-1be50268c1e84d6eabf85c0b779e7eb2.r2.dev/Luo%20ancient%20movies.apk"
          download
          aria-label="Download the app"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span className="min-w-0 text-[11px] font-bold whitespace-nowrap sm:text-xs">Download App</span>
        </a>
        </Button>


        <Button asChild variant="greeting" className="min-w-0 w-full gap-1 rounded-lg px-1 py-2 text-xs">
        <Link
          to="/agent"
          aria-label="Become an agent"
        >
          <UserCheck className="w-3.5 h-3.5 shrink-0" />
          <span>Agent</span>
        </Link>
        </Button>

        <Button variant="greeting"
          type="button"
          onClick={() => setAdvertOpen(true)}
          className="min-w-0 w-full gap-1 rounded-lg px-1 py-2 text-xs"
          aria-label="Send a greeting"
        >
          <Megaphone className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">Greeting</span>
        </Button>
      </div>

      <GreetingAdvertModal open={advertOpen} onOpenChange={setAdvertOpen} />
    </div>
  );
}
