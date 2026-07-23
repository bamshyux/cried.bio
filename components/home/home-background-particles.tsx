"use client";

const PARTICLES = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: `${(index * 19.7 + 7) % 100}%`,
  top: `${(index * 27.3 + 13) % 100}%`,
  size: index % 3 === 0 ? 1.5 : 1,
  delay: `${(index % 6) * 1.1}s`,
  duration: `${18 + (index % 4) * 4}s`,
}));

export function HomeBackgroundParticles() {
  return (
    <div className="bf-home-particles" aria-hidden>
      {PARTICLES.map((particle) => (
        <span
          key={particle.id}
          className="bf-home-particle"
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
  );
}
