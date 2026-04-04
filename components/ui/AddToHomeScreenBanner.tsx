"use client";

import { useEffect, useRef, useState } from "react";

type Platform = "ios" | "android" | null;

export default function AddToHomeScreenBanner() {
  const [platform, setPlatform] = useState<Platform>(null);
  const deferredPrompt = useRef<Event & { prompt(): void; userChoice: Promise<{ outcome: string }> } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ua = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua) || navigator.maxTouchPoints > 1;
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).standalone === true;

    if (!isMobile || isStandalone) return;

    if (isIOS) {
      const dismissed = localStorage.getItem("vq_aths_ios_dismissed") === "true";
      if (!dismissed) setPlatform("ios");
      return;
    }

    if (isAndroid) {
      const handler = (e: Event) => {
        e.preventDefault();
        deferredPrompt.current = e as typeof deferredPrompt.current;
        setPlatform("android");
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

  async function handleAndroidInstall() {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === "accepted") setPlatform(null);
    deferredPrompt.current = null;
  }

  function handleIOSDismiss() {
    localStorage.setItem("vq_aths_ios_dismissed", "true");
    setPlatform(null);
  }

  if (!platform) return null;

  return (
    <div className="flex w-full items-center gap-3 border-t border-[var(--vq-border)] bg-[var(--vq-bg)] px-4 py-3">
      <span className="text-[22px]">📱</span>

      <p className="flex-1 text-[14px] leading-snug text-[var(--vq-text)]">
        {platform === "android"
          ? "Tambahkan ke layar utama untuk akses lebih cepat"
          : 'Tap ikon Bagikan (⬆) lalu pilih "Tambahkan ke Layar Utama"'}
      </p>

      {platform === "android" && (
        <button
          type="button"
          onClick={() => void handleAndroidInstall()}
          className="shrink-0 whitespace-nowrap rounded-[10px] bg-[#534AB7] px-4 py-2 text-[14px] font-medium text-white"
        >
          Pasang
        </button>
      )}

      {platform === "ios" && (
        <button
          type="button"
          onClick={handleIOSDismiss}
          className="shrink-0 px-2 py-1 text-[18px] text-[var(--vq-muted)]"
          aria-label="Tutup"
        >
          ✕
        </button>
      )}
    </div>
  );
}
