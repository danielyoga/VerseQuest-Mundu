"use client";

import { DisplayOrderProvider } from "@/contexts/DisplayOrderContext";
import { DisplayPrefsProvider } from "@/contexts/DisplayPrefsContext";
import { LocaleProvider } from "@/contexts/LocaleContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <DisplayOrderProvider>
        <DisplayPrefsProvider>
          {children}
        </DisplayPrefsProvider>
      </DisplayOrderProvider>
    </LocaleProvider>
  );
}
