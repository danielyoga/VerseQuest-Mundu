import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";

export default function MainLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[var(--vq-canvas)]">
      <main
        id="main-content"
        className="pb-[calc(5.5rem+env(safe-area-inset-bottom))]"
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
