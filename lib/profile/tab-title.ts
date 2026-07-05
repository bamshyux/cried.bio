import type { TabTitleAnimation } from "@/lib/types/settings";

export function buildProfileTabTitle(displayName: string) {
  const name = displayName.trim() || "Profile";
  return `${name} — cried.bio`;
}

export function runTabTitleAnimation(
  fullTitle: string,
  animation: TabTitleAnimation,
  onTitle: (title: string) => void,
): () => void {
  if (animation === "none" || typeof window === "undefined") {
    onTitle(fullTitle);
    return () => {};
  }

  let cancelled = false;
  let intervalId = 0;
  let timeoutId = 0;

  const stop = () => {
    cancelled = true;
    window.clearInterval(intervalId);
    window.clearTimeout(timeoutId);
    onTitle(fullTitle);
  };

  const schedule = (fn: () => void, ms: number) => {
    timeoutId = window.setTimeout(() => {
      if (!cancelled) fn();
    }, ms);
  };

  if (animation === "typewriter") {
    let index = 0;
    let deleting = false;

    const tick = () => {
      if (cancelled) return;

      if (!deleting) {
        index += 1;
        onTitle(fullTitle.slice(0, index));
        if (index >= fullTitle.length) {
          deleting = true;
          window.clearInterval(intervalId);
          schedule(() => {
            intervalId = window.setInterval(tick, 55);
          }, 1200);
        }
        return;
      }

      index -= 1;
      onTitle(index > 0 ? fullTitle.slice(0, index) : " ");
      if (index <= 0) {
        deleting = false;
        window.clearInterval(intervalId);
        schedule(() => {
          intervalId = window.setInterval(tick, 70);
        }, 350);
      }
    };

    intervalId = window.setInterval(tick, 70);
    return stop;
  }

  if (animation === "marquee") {
    const loop = `${fullTitle}   •   `;
    let offset = 0;
    intervalId = window.setInterval(() => {
      if (cancelled) return;
      offset = (offset + 1) % loop.length;
      onTitle(loop.slice(offset) + loop.slice(0, offset));
    }, 140);
    return stop;
  }

  if (animation === "blink") {
    let visible = true;
    intervalId = window.setInterval(() => {
      if (cancelled) return;
      visible = !visible;
      onTitle(visible ? fullTitle : "▮");
    }, 550);
    return stop;
  }

  if (animation === "pulse") {
    const compact = fullTitle.replace(" — ", " • ");
    let showFull = true;
    intervalId = window.setInterval(() => {
      if (cancelled) return;
      showFull = !showFull;
      onTitle(showFull ? fullTitle : compact);
    }, 1800);
    return stop;
  }

  if (animation === "scroll") {
    const padded = `   ${fullTitle}   `;
    let position = 0;
    let direction = 1;
    const windowSize = Math.min(28, Math.max(fullTitle.length + 4, 18));

    intervalId = window.setInterval(() => {
      if (cancelled) return;
      onTitle(padded.slice(position, position + windowSize).trim() || fullTitle);
      position += direction;
      if (position + windowSize >= padded.length) direction = -1;
      if (position <= 0) direction = 1;
    }, 110);
    return stop;
  }

  onTitle(fullTitle);
  return stop;
}
