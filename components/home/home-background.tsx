export function HomeBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="bf-home-ambient absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255, 255, 255, 0.12),transparent)]" />
      <div className="bf-home-orb bf-home-orb--a absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#fafafa]/10 blur-[100px]" />
      <div className="bf-home-orb bf-home-orb--b absolute -right-16 top-1/3 h-96 w-96 rounded-full bg-[#fafafa]/[0.07] blur-[120px]" />
      <div className="bf-home-orb bf-home-orb--c absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-indigo-500/[0.06] blur-[90px]" />
      <div className="bf-home-grid absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_72%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#fafafa]/40 to-transparent bf-home-shimmer-line" />
    </div>
  );
}
