"use client";
import { useState, useEffect } from "react";
import { getSession, type AppUser } from "@/lib/session";

export function useUser() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getSession());
    setLoading(false);
  }, []);

  const refresh = () => setUser(getSession());

  return { user, loading, refresh };
}
