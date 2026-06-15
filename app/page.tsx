import Link from "next/link";
import { CriedLogo } from "@/components/brand/logo";
import { HomeBackground } from "@/components/home/home-background";
import { HomeFeatures } from "@/components/home/home-features";
import {
  HomeHeroActions,
  HomePrimaryCta,
  HomeSecondaryCta,
} from "@/components/home/home-hero-actions";
import { HomeNav } from "@/components/home/home-nav";
import { HomePreview } from "@/components/home/home-preview";
import { getProfileByUserId } from "@/lib/data/profiles";
import { createClient } from "@/lib/supabase/server";

const features = [
  {
    title: "Custom Profiles",
    description: "Themes, layouts, effects, and backgrounds — tuned to your style.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
  {
    title: "Social Links",
    description: "One-click presets for every platform. Discord, Twitch, YouTube, and more.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
      </svg>
    ),
  },
  {
    title: "Analytics",
    description: "Track views, clicks, and sessions. Know what resonates with your audience.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
];

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  const profile = userId ? await getProfileByUserId(userId) : null;
  const isLoggedIn = !!userId;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090909] text-white">
      <HomeBackground />

      <header className="bf-home-enter bf-home-enter-0 relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/">
          <CriedLogo />
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-neutral-500 sm:flex">
          <Link href="#features" className="transition-colors hover:text-white">
            Features
          </Link>
          <Link href="#preview" className="transition-colors hover:text-white">
            Preview
          </Link>
        </nav>

        <HomeNav isLoggedIn={isLoggedIn} username={profile?.username ?? null} />
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-20 text-center sm:pt-28">
          <div className="bf-home-enter bf-home-enter-1 mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#141414]/90 px-4 py-1.5 text-sm text-neutral-400 backdrop-blur-sm">
            <span className="bf-home-pulse-dot h-1.5 w-1.5 rounded-full bg-[#fafafa]" />
            Bio links, rebuilt for creators
          </div>

          <h1 className="bf-home-enter bf-home-enter-2 mx-auto max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            Designed to be{" "}
            <span className="bf-home-accent-glow text-[#fafafa]">yours.</span>
          </h1>

          <p className="bf-home-enter bf-home-enter-3 mx-auto mt-6 max-w-xl text-lg leading-relaxed text-neutral-500">
            A clean, customizable bio page for creators, gamers, and builders.
            Premium feel. Zero clutter.
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
        </section>

        <HomePreview />

        <HomeFeatures features={features} />
      </main>

      <footer className="bf-home-enter bf-home-enter-6 relative z-10 border-t border-white/[0.04] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <p className="text-sm text-neutral-600">© {new Date().getFullYear()} cried.bio</p>
          <div className="flex gap-6 text-sm text-neutral-600">
            <Link href="/terms" className="transition-colors hover:text-neutral-400">
              Terms
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-neutral-400">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
