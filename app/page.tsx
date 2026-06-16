import Link from "next/link";
import { CriedLogo } from "@/components/brand/logo";
import { HomeActivityFeed } from "@/components/home/home-activity-feed";
import { HomeFeaturedProfiles } from "@/components/home/home-featured-profiles";
import { HomeFloatingCards } from "@/components/home/home-floating-cards";
import { EmailVerifiedNotice } from "@/components/home/email-verified-notice";
import { HomeAuthRedirect } from "@/components/home/home-auth-redirect";
import { HomeBackground } from "@/components/home/home-background";
import {
  HomeHeroActions,
  HomePrimaryCta,
  HomeSecondaryCta,
} from "@/components/home/home-hero-actions";
import { HomeNavLinks } from "@/components/home/home-nav-links";
import { HomeNav } from "@/components/home/home-nav";
import { HomeOurUsers, HomeStatsSection } from "@/components/home/home-our-users";
import { HomePreview } from "@/components/home/home-preview";
import { HomeRoadmap } from "@/components/home/home-roadmap";
import { HomeTestimonials } from "@/components/home/home-testimonials";
import { HomeWhyChoose } from "@/components/home/home-why-choose";
import { HumanVerificationGate } from "@/components/security/human-verification-gate";
import {
  getFeaturedProfiles,
  getFloatingProfileCards,
  getLandingActivityFeed,
  getLandingRoadmap,
  getLandingStats,
  getLandingTestimonials,
  getRandomPublicProfiles,
} from "@/lib/data/landing";
import { getProfileByUserId } from "@/lib/data/profiles";
import { createClient } from "@/lib/supabase/server";

const NAV_LINKS = [
  { href: "#community", label: "Community" },
  { href: "#features", label: "Features" },
  { href: "#stats", label: "Stats" },
  { href: "#roadmap", label: "Roadmap" },
];

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  const profile = userId ? await getProfileByUserId(userId) : null;
  const isLoggedIn = !!userId;

  const [
    stats,
    randomProfiles,
    featuredProfiles,
    activityFeed,
    testimonials,
    roadmap,
    floatingProfiles,
  ] = await Promise.all([
    getLandingStats(),
    getRandomPublicProfiles(12),
    getFeaturedProfiles(),
    getLandingActivityFeed(20),
    getLandingTestimonials(),
    getLandingRoadmap(),
    getFloatingProfileCards(6),
  ]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#090909] text-white">
      <HomeBackground />
      <HomeAuthRedirect />
      <EmailVerifiedNotice />

      <header className="bf-home-enter bf-home-enter-0 relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/">
          <CriedLogo />
        </Link>

        <HomeNavLinks links={NAV_LINKS} />

        <HomeNav isLoggedIn={isLoggedIn} username={profile?.username ?? null} />
      </header>

      <main className="relative z-10">
        <section className="relative mx-auto max-w-6xl px-6 pb-16 pt-20 text-center sm:pt-28">
          <HomeFloatingCards profiles={floatingProfiles} />

          <div className="relative">
            <div className="bf-home-enter bf-home-enter-1 mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#141414]/90 px-4 py-1.5 text-sm text-neutral-400 backdrop-blur-sm">
              <span className="bf-home-pulse-dot h-1.5 w-1.5 rounded-full bg-[#fafafa]" />
              {stats.total_profiles.toLocaleString()}+ creators already here
            </div>

            <h1 className="bf-home-enter bf-home-enter-2 mx-auto max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
              Designed to be{" "}
              <span className="bf-home-accent-glow text-[#fafafa]">yours.</span>
            </h1>

            <p className="bf-home-enter bf-home-enter-3 mx-auto mt-6 max-w-xl text-lg leading-relaxed text-neutral-500">
              A clean, customizable bio page for creators, gamers, and builders.
              Premium feel. Zero clutter. Join a platform that&apos;s actually alive.
            </p>

            <HomeHeroActions>
              {isLoggedIn ? (
                <>
                  <HomePrimaryCta href="/dashboard">Go to Dashboard</HomePrimaryCta>
                  {profile?.username && (
                    <HomeSecondaryCta href={`/${profile.username}`}>View My Profile</HomeSecondaryCta>
                  )}
                </>
              ) : (
                <>
                  <HomePrimaryCta href="/signup">Create Profile</HomePrimaryCta>
                  <HomeSecondaryCta href="/login">Login</HomeSecondaryCta>
                </>
              )}
            </HomeHeroActions>
          </div>
        </section>

        <section className="relative">
          <HomeFloatingCards profiles={floatingProfiles.slice(3, 6)} />
          <HomeStatsSection stats={stats} />
        </section>
        <HomePreview />
        <HomeActivityFeed items={activityFeed} />
        <HomeFeaturedProfiles profiles={featuredProfiles} />
        <HomeOurUsers profiles={randomProfiles} totalUsers={stats.total_users} />
        <HomeWhyChoose />
        <HomeRoadmap items={roadmap} />
        <HomeTestimonials testimonials={testimonials} />
      </main>

      <footer className="bf-home-enter bf-home-enter-6 relative z-10 border-t border-white/[0.04] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <p className="text-sm text-neutral-600">© {new Date().getFullYear()} cried.bio</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-neutral-600">
            <Link href="/terms" className="transition-colors hover:text-neutral-400">
              Terms
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-neutral-400">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
      <HumanVerificationGate />
    </div>
  );
}
