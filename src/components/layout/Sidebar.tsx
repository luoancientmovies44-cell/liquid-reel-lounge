import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Film,
  Tv,
  Megaphone,
  Download,
  TrendingUp,
  Clock,
  Star,
  Shield,
  UserCheck,
  Music,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import luoAncientLogo from "@/assets/luo-ancient-logo.png";
import { SubscriptionModal } from "@/components/subscription/SubscriptionModal";
import { GreetingAdvertModal } from "@/components/greetings/GreetingAdvertModal";
import { useAdmin } from "@/contexts/AdminContext";
import { useActivityTracker } from "@/hooks/useActivityTracker";

const navItems = [
  { title: "Home", href: "/", icon: Home },
  { title: "Movies", href: "/movies", icon: Film },
  { title: "TV Series", href: "/tv-series", icon: Tv },
  { title: "Luo Champion", href: "/luo-champion", icon: Trophy },
  { title: "Music", href: "https://luomusic.luoancientmovies.com/", icon: Music, external: true },
  { title: "Agent", href: "/agent", icon: UserCheck },
  { title: "Guide", href: "/adverts", icon: Megaphone },
  { title: "Apps", href: "/apps", icon: Download },
  { title: "Trending", href: "/trending", icon: TrendingUp },
  { title: "Recently Added", href: "/recent", icon: Clock },
  { title: "Top Rated", href: "/top-rated", icon: Star },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { track } = useActivityTracker();
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [greetingOpen, setGreetingOpen] = useState(false);

  return (
    <>
      <aside aria-label="Desktop sidebar" className="glass hidden lg:flex flex-col fixed left-0 top-0 h-dvh w-56 z-40 border-r border-sidebar-border">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-4 border-b border-sidebar-border">
          <img 
            src={luoAncientLogo} 
            alt="Luo Ancient Movies" 
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
          <h1 className="brand-title sidebar-brand-title min-w-0">
            LUO ANCIENT MOVIES
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              if ((item as any).external) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track("Navigate", `Navigated to ${item.title}`, item.href)}
                    className="nav-link nav-link-inactive"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{item.title}</span>
                  </a>
                );
              }
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => track("Navigate", `Navigated to ${item.title}`, item.href)}
                  className={`nav-link ${isActive ? "nav-link-active" : "nav-link-inactive"}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.title}</span>
                </Link>
              );
            })}

            <Button variant="ghost"
              type="button"
              onClick={() => setGreetingOpen(true)}
              className="nav-link nav-link-inactive w-full justify-start"
            >
              <Megaphone className="w-5 h-5" />
              <span className="text-sm">Greeting</span>
            </Button>
            
            {/* Admin Panel Link - only visible for admin */}
            {isAdmin && (
              <Button variant="ghost"
                onClick={() => navigate("/admin")}
                className={`nav-link w-full justify-start ${
                  location.pathname.startsWith("/admin") ? "nav-link-active" : "nav-link-inactive"
                }`}
              >
                <Shield className="w-5 h-5" />
                <span className="text-sm">Admin Panel</span>
              </Button>
            )}
          </div>
        </nav>

        {/* Subscribe CTA */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex flex-col gap-4">
            <div className="relative z-10">
              <h3 className="text-foreground text-xl font-bold leading-tight">
                Subscribe<br />Now
              </h3>
              <p className="text-muted-foreground text-xs mt-1.5 leading-snug">
                Get unlimited access to all content
              </p>
            </div>

            <Button
              onClick={() => setSubscriptionOpen(true)}
              className="w-full"
            >
              View Plans
            </Button>
          </div>
        </div>
      </aside>

      <SubscriptionModal open={subscriptionOpen} onOpenChange={setSubscriptionOpen} />
      <GreetingAdvertModal open={greetingOpen} onOpenChange={setGreetingOpen} />
    </>
  );
}
