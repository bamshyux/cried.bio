import { HomeBackgroundParticles } from "@/components/home/home-background-particles";

export function HomeBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="bf-home-ambient absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-5%,rgba(255,255,255,0.14),transparent_58%)]" />
      <div
        className="bf-home-ambient absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_22%,rgba(255,255,255,0.05),transparent_62%)]"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="bf-home-ambient absolute inset-0 bg-[radial-gradient(ellipse_35%_28%_at_88%_18%,rgba(255,255,255,0.04),transparent_55%)]"
        style={{ animationDelay: "3.5s" }}
      />
      <div
        className="bf-home-ambient absolute inset-0 bg-[radial-gradient(ellipse_30%_25%_at_10%_28%,rgba(255,255,255,0.035),transparent_55%)]"
        style={{ animationDelay: "5s" }}
      />
      <div className="bf-home-orb bf-home-orb--a absolute -left-40 top-12 h-96 w-96 rounded-full bg-[#fafafa]/[0.06] blur-[120px]" />
      <div className="bf-home-orb bf-home-orb--b absolute -right-32 top-1/3 h-[26rem] w-[26rem] rounded-full bg-[#fafafa]/[0.04] blur-[140px]" />
      <HomeBackgroundParticles />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_28%,rgba(0,0,0,0.55)_100%)]" />
      <div className="bf-home-grain absolute inset-0 opacity-[0.32]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#fafafa]/25 to-transparent bf-home-shimmer-line" />
    </div>
  );
}
