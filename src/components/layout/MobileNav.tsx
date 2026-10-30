import { Link, useLocation } from "react-router-dom";
import { Home, Film, Tv, Music, Megaphone, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const location = useLocation();

  const mobileNavItems = [
    { title: "Home", href: "/", icon: Home },
    { title: "Movies", href: "/movies", icon: Film },
    { title: "Luo Champion", href: "/luo-champion", icon: Trophy, longLabel: true },
    { title: "TV", href: "/tv-series", icon: Tv },
    { title: "Music", href: "https://luomusic.luoancientmovies.com/", icon: Music, external: true },
    { title: "Guide", href: "/adverts", icon: Megaphone },
  ];

  return (
    <>
      <nav className="liquid-dock fixed bottom-0 left-1/2 w-full max-w-[768px] -translate-x-1/2 z-40">
        <div className="flex items-center justify-around px-1 py-2">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;


            return item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-colors relative"
              >
                <div className={cn(
                  "p-[2px] rounded-xl transition-all duration-300",
                  isActive ? "gradient-primary text-primary-foreground" : "text-muted-foreground"
                )}>
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                    isActive ? "bg-transparent" : "bg-glass"
                  )}>
                    <Icon className={cn("w-[18px] h-[18px] transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                  </div>
                </div>
                <span className={cn(
                  "font-medium leading-none transition-colors whitespace-nowrap",
                  item.longLabel ? "text-[8px]" : "text-[10px]",
                  isActive ? "text-primary-foreground" : "text-muted-foreground"
                )}>
                  {item.title}
                </span>
              </a>
            ) : (
              <Link
                key={item.href}
                to={item.href}
                className="flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-colors relative"
              >
                <div className={cn(
                  "p-[2px] rounded-xl transition-all duration-300",
                  isActive ? "gradient-primary text-primary-foreground" : "text-muted-foreground"
                )}>
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                    isActive ? "bg-transparent" : "bg-glass"
                  )}>
                    <Icon className={cn("w-[18px] h-[18px] transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                  </div>
                </div>
                <span className={cn(
                  "font-medium leading-none transition-colors whitespace-nowrap",
                  item.longLabel ? "text-[8px]" : "text-[10px]",
                  isActive ? "text-primary-foreground" : "text-muted-foreground"
                )}>
                  {item.title}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
