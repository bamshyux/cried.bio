import Link from "next/link";
import { BioForgeLogo } from "@/components/brand/logo";
import { HomeNav } from "@/components/home/home-nav";
import { getProfileByUserId } from "@/lib/data/profiles";
import { SITE_HOST } from "@/lib/site";
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
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,229,204,0.08),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/">
          <BioForgeLogo />
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-neutral-500 sm:flex">
          <Link href="#features" className="transition-colors hover:text-white">Features</Link>
          <Link href="#preview" className="transition-colors hover:text-white">Preview</Link>
        </nav>

        <HomeNav isLoggedIn={isLoggedIn} username={profile?.username ?? null} />
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-20 text-center sm:pt-28">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-[#141414] px-4 py-1.5 text-sm text-neutral-400">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00e5cc]" />
            Bio links, rebuilt for creators
          </div>

          <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            Your profile.
            <br />
            <span className="text-[#00e5cc]">One link.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-neutral-500">
            A clean, customizable bio page for creators, gamers, and builders.
            Premium feel. Zero clutter.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#00e5cc] px-8 py-3 text-sm font-semibold text-[#090909] transition-colors hover:bg-[#00c9b4]"
                >
                  Go to Dashboard
                </Link>
                {profile?.username && (
                  <Link
                    href={`/${profile.username}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#141414] px-8 py-3 text-sm font-semibold text-white transition-colors hover:border-white/[0.14] hover:bg-[#1a1a1a]"
                  >
                    View My Profile
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#00e5cc] px-8 py-3 text-sm font-semibold text-[#090909] transition-colors hover:bg-[#00c9b4]"
                >
                  Create Profile
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#141414] px-8 py-3 text-sm font-semibold text-white transition-colors hover:border-white/[0.14] hover:bg-[#1a1a1a]"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </section>

        <section id="preview" className="mx-auto max-w-md px-6 pb-24">
          <div className="rounded-2xl border border-white/[0.06] bg-[#141414]/80 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 shrink-0 rounded-full bg-[#1a1a1a] ring-1 ring-white/[0.06]" />
              <div className="text-left">
                <p className="font-medium text-white">@yourname</p>
                <p className="text-sm text-neutral-500">Creator · Gamer</p>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              {["Discord", "Twitch", "Portfolio"].map((link) => (
                <div
                  key={link}
                  className="rounded-lg border border-white/[0.04] bg-[#0f0f0f] px-4 py-2.5 text-sm text-neutral-300 transition-colors hover:border-[#00e5cc]/20"
                >
                  {link}
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-neutral-600">{SITE_HOST}/yourname</p>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-6 pb-32">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Built to stand out</h2>
            <p className="mt-3 text-neutral-500">Everything you need. Nothing you don&apos;t.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-white/[0.06] bg-[#141414] p-6 transition-colors hover:border-white/[0.1] hover:bg-[#1a1a1a]"
              >
                <div className="mb-4 inline-flex rounded-lg border border-white/[0.06] bg-[#0f0f0f] p-2.5 text-[#00e5cc]">
                  {feature.icon}
                </div>
                <h3 className="font-medium text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/[0.04] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <p className="text-sm text-neutral-600">© {new Date().getFullYear()} BioForge</p>
          <div className="flex gap-6 text-sm text-neutral-600">
            <Link href="/terms" className="transition-colors hover:text-neutral-400">Terms</Link>
            <Link href="/privacy" className="transition-colors hover:text-neutral-400">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
