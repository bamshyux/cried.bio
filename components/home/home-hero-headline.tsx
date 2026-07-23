"use client";

import { useEffect, useState } from "react";

const ROTATING_WORDS = ["bio link", "profile", "identity"] as const;

export function HomeHeroHeadline() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setWordIndex((current) => (current + 1) % ROTATING_WORDS.length);
    }, 3600);
    return () => window.clearInterval(timer);
  }, []);

  const word = ROTATING_WORDS[wordIndex];

  return (
    <h1 className="bf-home-enter bf-home-enter-2 mt-4 text-[clamp(2.25rem,5.2vw,3.75rem)] font-semibold leading-[1.06] tracking-[-0.042em] text-white lg:mt-5 xl:text-[clamp(2.5rem,4.5vw,4.25rem)]">
      Your{" "}
      <span className="relative inline-block min-w-[5.5ch] text-left">
        <span key={word} className="bf-home-headline-word inline-block">
          {word},
        </span>
      </span>
      <br />
      <span className="text-neutral-400">elevated.</span>
    </h1>
  );
}
