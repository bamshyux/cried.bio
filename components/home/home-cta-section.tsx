import Link from "next/link";
import { HomePrimaryCta, HomeSecondaryCta } from "@/components/home/home-hero-actions";
import { HomeSection } from "@/components/home/home-section-header";
import { Reveal } from "@/components/home/reveal";

export function HomeCtaSection({
  isLoggedIn,
  username,
}: {
  isLoggedIn: boolean;
  username: string | null;
}) {
  return (
    <HomeSection className="py-24 sm:py-32">
      <Reveal variant="scale">
        <div className="bf-home-cta-panel relative overflow-hidden rounded-3xl border border-white/[0.1] bg-[#141414]/90 px-8 py-16 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(255,255,255,0.08),transparent_65%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <p className="relative text-xs font-medium uppercase tracking-[0.22em] text-neutral-500">
            Ready when you are
          </p>
          <h2 className="relative mt-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Build a profile that feels{" "}
            <span className="bf-home-accent-glow text-[#fafafa]">premium.</span>
          </h2>
          <p className="relative mx-auto mt-4 max-w-lg text-base leading-relaxed text-neutral-500">
            Themes, music, effects, badges, and more — live in minutes, not hours.
          </p>

          <div className="relative mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {isLoggedIn ? (
              <>
                <HomePrimaryCta href="/dashboard">Go to Dashboard</HomePrimaryCta>
                {username ? (
                  <HomeSecondaryCta href={`/${username}`}>View My Profile</HomeSecondaryCta>
                ) : null}
              </>
            ) : (
              <>
                <HomePrimaryCta href="/signup">Create Profile — Free</HomePrimaryCta>
                <HomeSecondaryCta href="/login">Login</HomeSecondaryCta>
              </>
            )}
          </div>

          {!isLoggedIn ? (
            <p className="relative mt-6 text-sm text-neutral-600">
              No credit card.{" "}
              <Link href="/signup" className="text-neutral-400 underline-offset-2 hover:text-white hover:underline">
                Start building
              </Link>
            </p>
          ) : null}
        </div>
      </Reveal>
    </HomeSection>
  );
}
