import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import AddToHomeScreenBanner from "@/components/ui/AddToHomeScreenBanner";
import { UserContextProvider } from "@/contexts/UserContext";
import { StatsRefresher } from "@/components/layout/StatsRefresher";

export default function MainLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <UserContextProvider>
      <StatsRefresher />
      <div className="min-h-screen bg-[var(--vq-canvas)]">
        <main
          id="main-content"
          className="pb-[calc(64px+env(safe-area-inset-bottom))]"
        >
          {children}
        </main>
        <AddToHomeScreenBanner />
        <BottomNav />
      </div>
    </UserContextProvider>
  );
}
