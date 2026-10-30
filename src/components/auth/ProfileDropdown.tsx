import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { User, Crown, LogOut, Shield } from "lucide-react";
import { ProfileModal } from "./ProfileModal";
import { Button } from "@/components/ui/button";

export function ProfileDropdown() {
  const { user, logout } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);


  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const getPlanDisplay = () => {
    if (!user.plan) return "Free Plan";
    
    const now = new Date();
    const expires = new Date(user.plan.expiresAt);
    const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (user.plan.name === "Lifetime") return "Lifetime";
    if (daysLeft <= 0) return "Expired";
    if (daysLeft === 1) return `${user.plan.name} (1 day left)`;
    return `${user.plan.name} (${daysLeft} days)`;
  };


  // Desktop: Dropdown menu
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="avatar-ring h-10 w-10" aria-label="Open account menu">
            <Avatar className="h-full w-full">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-glass-strong text-primary">{initials || user.email.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="glass-strong w-72 max-w-[calc(100vw-24px)] rounded-2xl p-3">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground break-all">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer">
            <User className="w-4 h-4 mr-2" />
            My Profile
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer">
              <Shield className="w-4 h-4 mr-2" />
              Admin Panel
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
