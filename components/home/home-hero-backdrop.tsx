"use client";

const HERO_PARTICLES = Array.from({ length: 24 }, (_, index) => ({
  id: index,
  left: `${(index * 13.7 + 5) % 100}%`,
  top: `${(index * 19.3 + 8) % 100}%`,
  size: index % 4 === 0 ? 1.5 : 1,
  delay: `${(index % 8) * 0.9}s`,
  duration: `${20 + (index % 5) * 5}s`,
}));

export function HomeHeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="bf-home-hero-grid absolute inset-x-0 top-[8%] h-[min(92%,920px)] opacity-[0.35]" />
      <div className="bf-home-hero-gradient bf-home-hero-gradient--a absolute left-[18%] top-[12%] h-[min(42vw,380px)] w-[min(42vw,380px)] rounded-full" />
      <div className="bf-home-hero-gradient bf-home-hero-gradient--b absolute right-[12%] top-[22%] h-[min(36vw,320px)] w-[min(36vw,320px)] rounded-full" />
      <div className="bf-home-hero-gradient bf-home-hero-gradient--c absolute bottom-[18%] left-[42%] h-[min(30vw,280px)] w-[min(30vw,280px)] rounded-full" />
      <div className="bf-home-hero-particles absolute inset-0">
        {HERO_PARTICLES.map((particle) => (
          <span
            key={particle.id}
            className="bf-home-hero-particle absolute rounded-full bg-white"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
            }}
          />
        ))}
      </div>
    </div>
  );
}
