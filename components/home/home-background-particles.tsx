"use client";

const PARTICLES = Array.from({ length: 28 }, (_, index) => ({
  id: index,
  left: `${(index * 17.3) % 100}%`,
  top: `${(index * 23.7 + 11) % 100}%`,
  size: index % 3 === 0 ? 2 : index % 3 === 1 ? 1.5 : 1,
  delay: `${(index % 7) * 0.8}s`,
  duration: `${14 + (index % 5) * 3}s`,
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
