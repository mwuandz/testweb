"use client";

import { useEffect, useState } from "react";

export function Snow({ count = 40 }: { count?: number }) {
  const [flakes, setFlakes] = useState<
    { id: number; left: number; delay: number; duration: number; size: number }[]
  >([]);

  useEffect(() => {
    setFlakes(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 8 + Math.random() * 12,
        size: 2 + Math.random() * 4,
      }))
    );
  }, [count]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {flakes.map((f) => (
        <span
          key={f.id}
          className="absolute top-[-10px] rounded-full bg-white/80 animate-snowfall"
          style={{
            left: `${f.left}%`,
            width: f.size,
            height: f.size,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
