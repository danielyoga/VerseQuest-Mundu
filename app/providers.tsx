"use client";

import { DisplayOrderProvider } from "@/contexts/DisplayOrderContext";
import { LocaleProvider } from "@/contexts/LocaleContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <DisplayOrderProvider>{children}</DisplayOrderProvider>
    </LocaleProvider>
  );
}
