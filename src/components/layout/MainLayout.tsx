import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileNav } from "./MobileNav";
import { InstallAppButton } from "@/components/InstallAppButton";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {

  return (
    <div className="min-h-screen relative">
      <div className="library-shell min-w-0 flex flex-col min-h-screen relative">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <MobileNav />
      <InstallAppButton />
    </div>
  );
}
