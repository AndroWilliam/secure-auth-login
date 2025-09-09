"use client";
import { useEffect, useRef } from "react";

export default function PresenceBeacon() {
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const beat = async () => {
      try {
        await fetch("/api/presence/beat", { method: "POST", cache: "no-store" });
      } catch {}
    };

    // initial beat + interval
    beat();
    timer.current = setInterval(beat, 30_000);

    const onVis = () => { if (document.visibilityState === "visible") beat(); };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      if (timer.current) clearInterval(timer.current);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return null;
}
