"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export type RevealVariant = "up" | "blur" | "scale";

export function Reveal({
  children,
  className = "",
  delay = 0,
  variant = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: RevealVariant;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -32px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const style = { animationDelay: `${delay}ms` } as CSSProperties;
  const pendingClass =
    variant === "blur"
      ? "bf-home-reveal-pending bf-home-reveal-pending--blur"
      : variant === "scale"
        ? "bf-home-reveal-pending bf-home-reveal-pending--scale"
        : "bf-home-reveal-pending";
  const revealedClass =
    variant === "blur"
      ? "bf-home-revealed bf-home-revealed--blur"
      : variant === "scale"
        ? "bf-home-revealed bf-home-revealed--scale"
        : "bf-home-revealed";

  return (
    <div
      ref={ref}
      style={style}
      className={`${className} ${visible ? revealedClass : pendingClass}`}
    >
      {children}
    </div>
  );
}
