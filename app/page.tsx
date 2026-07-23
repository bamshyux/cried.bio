import { Suspense } from "react";
import Link from "next/link";
import { DiscordCommunityPromo } from "@/components/discord/discord-community-promo";
import { CriedLogo } from "@/components/brand/logo";
import { HomeCtaSection } from "@/components/home/home-cta-section";
import { HomeFeaturedProfiles } from "@/components/home/home-featured-profiles";
import { EmailVerifiedNotice } from "@/components/home/email-verified-notice";
import { HomeBackground } from "@/components/home/home-background";
import {
  HomeHeroActions,
  HomePrimaryCta,
  HomeSecondaryCta,
} from "@/components/home/home-hero-actions";
import { HomeHero } from "@/components/home/home-hero";
import { HomeNavLinks } from "@/components/home/home-nav-links";
import { HomeNav } from "@/components/home/home-nav";
import { HomeOurUsers, HomeStatsSection } from "@/components/home/home-our-users";
import { HomeRoadmap } from "@/components/home/home-roadmap";
import { HomeTestimonials } from "@/components/home/home-testimonials";
import { HomeWhyChoose } from "@/components/home/home-why-choose";
import { HumanVerificationGate } from "@/components/security/human-verification-gate";
import {
  getFeaturedProfiles,
  getLandingRoadmap,
  getLandingStats,
  getLandingTestimonials,
  getRandomPublicProfiles,
  getTrendingPublicProfiles,
} from "@/lib/data/landing";
import { getProfileByUserId } from "@/lib/data/profiles";
import type { LandingProfile } from "@/lib/types/landing";
import { createClient } from "@/lib/supabase/server";

const NAV_LINKS = [
  { href: "#community", label: "Community" },
  { href: "#features", label: "Features" },
  { href: "#stats", label: "Stats" },
  { href: "#roadmap", label: "Roadmap" },
];

function mergeShowcaseProfiles(
  featured: LandingProfile[],
  trending: LandingProfile[],
): LandingProfile[] {
  const seen = new Set<string>();
  const merged: LandingProfile[] = [];

  for (const profile of [...featured, ...trending]) {
    if (seen.has(profile.id)) continue;
    seen.add(profile.id);
    merged.push(profile);
    if (merged.length >= 8) break;
  }

  return merged;
}

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
    trendingProfiles,
    testimonials,
    roadmap,
  ] = await Promise.all([
    getLandingStats(),
    getRandomPublicProfiles(12),
    getFeaturedProfiles(),
    getTrendingPublicProfiles(6),
    getLandingTestimonials(),
    getLandingRoadmap(),
  ]);

  const showcaseProfiles = mergeShowcaseProfiles(featuredProfiles, trendingProfiles);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#090909] text-white">
      <HomeBackground />
      <EmailVerifiedNotice />

      <header className="bf-home-enter bf-home-enter-0 relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/">
          <CriedLogo />
        </Link>

        <HomeNavLinks links={NAV_LINKS} />

        <HomeNav isLoggedIn={isLoggedIn} username={profile?.username ?? null} />
      </header>

      <main className="relative z-10">
        <HomeHero profiles={showcaseProfiles}>
          <div className="bf-home-enter bf-home-enter-1 mb-7 inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-[#141414]/80 px-4 py-1.5 text-sm text-neutral-400 backdrop-blur-md">
            <span className="bf-home-pulse-dot h-1.5 w-1.5 rounded-full bg-[#fafafa]" />
            {stats.total_profiles.toLocaleString()}+ creators already here
          </div>

          <h1 className="bf-home-enter bf-home-enter-2 text-[clamp(2.75rem,7.5vw,5.75rem)] font-semibold leading-[0.92] tracking-[-0.035em]">
            Designed to be
            <br />
            <span className="bf-home-accent-glow text-[#fafafa]">yours.</span>
          </h1>

          <p className="bf-home-enter bf-home-enter-3 mt-5 max-w-md text-base leading-relaxed text-neutral-500 sm:text-lg">
            A customizable bio page for creators, gamers, and builders — themes, music, effects, and more.
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
        </HomeHero>

        <HomeStatsSection stats={stats} />
        <HomeFeaturedProfiles profiles={featuredProfiles} />
        <HomeOurUsers profiles={randomProfiles} totalUsers={stats.total_users} />
        <HomeWhyChoose />
        <HomeRoadmap items={roadmap} />
        <HomeTestimonials testimonials={testimonials} />
        <HomeCtaSection isLoggedIn={isLoggedIn} username={profile?.username ?? null} />
        <DiscordCommunityPromo variant="section" />
      </main>

      <DiscordCommunityPromo variant="floating" />

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
      <Suspense fallback={null}>
        <HumanVerificationGate />
      </Suspense>
    </div>
  );
}
