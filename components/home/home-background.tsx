import { HomeBackgroundParticles } from "@/components/home/home-background-particles";

export function HomeBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="bf-home-ambient absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(255,255,255,0.14),transparent_58%)]" />
      <div className="bf-home-ambient absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_20%,rgba(255,255,255,0.04),transparent_50%)]" style={{ animationDelay: "2s" }} />
      <div className="bf-home-orb bf-home-orb--a absolute -left-32 top-16 h-80 w-80 rounded-full bg-[#fafafa]/[0.08] blur-[110px]" />
      <div className="bf-home-orb bf-home-orb--b absolute -right-20 top-1/4 h-[28rem] w-[28rem] rounded-full bg-[#fafafa]/[0.05] blur-[130px]" />
      <div className="bf-home-orb bf-home-orb--c absolute bottom-[-4rem] left-1/4 h-72 w-72 rounded-full bg-[#fafafa]/[0.04] blur-[100px]" />
      <HomeBackgroundParticles />
      <div className="bf-home-grid absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.022)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.45)_100%)]" />
      <div className="bf-home-grain absolute inset-0 opacity-[0.35]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#fafafa]/35 to-transparent bf-home-shimmer-line" />
    </div>
  );
}
