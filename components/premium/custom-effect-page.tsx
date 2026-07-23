"use client";

import Link from "next/link";
import { PremiumLockBadge } from "@/components/premium/premium-locked";
import { useUpgradeModal } from "@/components/premium/upgrade-modal";
import { DISCORD_COMMUNITY_INVITE_URL, SITE_HOST } from "@/lib/site";

const STEPS = [
  {
    step: "01",
    title: "Describe your vision",
    description: "Tell us the mood, colors, and motion you want — references and sketches welcome.",
  },
  {
    step: "02",
    title: "We design it by hand",
    description: "Our team builds a one-of-a-kind effect tailored to your profile. No AI generation.",
  },
  {
    step: "03",
    title: "Shipped to your page",
    description: "Once approved, your effect goes live on cried.bio. Yours alone.",
  },
] as const;

const CONTACT_OPTIONS = [
  {
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
      </svg>
    ),
    label: "Support ticket",
    description: "Best for detailed requests with attachments.",
    action: "Open the Support button in the bottom-right corner of your dashboard.",
    hint: 'Choose topic: "Billing & premium"',
    external: false,
  },
  {
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.608-1.23.077.077 0 0 0-.079-.036 19.496 19.496 0 0 0-4.885 1.49.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.007-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .078.01c.12.098.246.195.373.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.876 19.876 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.311-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.311-.946 2.38-2.157 2.38z" />
      </svg>
    ),
    label: "Discord",
    description: "Quick questions and back-and-forth with the team.",
    action: "Join the cried.bio community server.",
    href: DISCORD_COMMUNITY_INVITE_URL,
    external: true,
  },
  {
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    label: "Owner DMs",
    description: "Reach bamshy directly for premium requests.",
    action: "Message bamshy on Discord.",
    hint: "Username: bamshy",
    external: false,
  },
] as const;

const EXAMPLE_IDEAS = [
  "Neon pulse username",
  "Floating particle aura",
  "Glitch text reveal",
  "Seasonal snow overlay",
  "Holographic card border",
  "Custom cursor trail",
];

const CHECKLIST = [
  `Your ${SITE_HOST} username`,
  "A clear description of the effect you want",
  "Reference links, images, or mood boards (optional)",
  "Which profile page it should apply to (if not your main page)",
];

function EffectPreviewMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[280px]">
      <div
        className="pointer-events-none absolute -inset-8 rounded-full bg-violet-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-4 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-amber-500/15 blur-2xl"
        aria-hidden
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0c0c0c] p-5 shadow-2xl shadow-black/50">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(167,139,250,0.25), transparent 45%), radial-gradient(circle at 80% 80%, rgba(251,191,36,0.2), transparent 40%)",
          }}
          aria-hidden
        />

        <div className="relative space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0">
              <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-br from-violet-400 to-amber-300 opacity-60 blur-sm" />
              <div className="relative h-full w-full rounded-full border border-white/20 bg-gradient-to-br from-violet-500/40 to-amber-500/30" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate bg-gradient-to-r from-violet-200 via-white to-amber-200 bg-clip-text text-sm font-semibold text-transparent">
                yourname
              </p>
              <p className="text-[11px] text-neutral-500">Custom effect preview</p>
            </div>
          </div>

          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-8 rounded-lg border border-white/[0.06] bg-white/[0.03]"
                style={{ opacity: 1 - i * 0.15 }}
              />
            ))}
          </div>

          <div className="relative overflow-hidden rounded-xl border border-violet-500/30 bg-violet-500/[0.08] px-3 py-2">
            <div
              className="absolute inset-0 -translate-x-full animate-[bf-effect-shimmer_2.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"
              aria-hidden
            />
            <p className="relative text-center text-[10px] font-medium uppercase tracking-[0.2em] text-violet-200/90">
              ✦ Your effect here ✦
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CustomEffectPage({
  allowed,
  username,
}: {
  allowed: boolean;
  username: string | null;
}) {
  const { openUpgrade } = useUpgradeModal();

  return (
    <div className="mx-auto max-w-4xl">
      {!allowed ? (
        <div className="mb-8 overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.08] via-transparent to-violet-500/[0.06] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <PremiumLockBadge />
              <h2 className="mt-3 text-xl font-semibold text-white">Unlock custom effects</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-400">
                Premium Lite members can request one hand-designed profile effect, built exclusively
                for their page.
              </p>
            </div>
            <button type="button" onClick={openUpgrade} className="bf-btn-primary shrink-0">
              Upgrade to Premium Lite
            </button>
          </div>
        </div>
      ) : null}

      <div className={`${!allowed ? "pointer-events-none select-none opacity-50" : ""}`}>
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(251,191,36,0.12), transparent), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(167,139,250,0.08), transparent)",
            }}
            aria-hidden
          />

          <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/[0.08] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-amber-200/90">
                <span aria-hidden>✦</span>
                Premium Lite exclusive
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Custom profile effect
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-neutral-400">
                One fully custom effect designed and implemented by our team — not generated, not
                shared. Yours alone on {SITE_HOST}.
              </p>
              {username ? (
                <p className="mt-4 text-xs text-neutral-600">
                  Requesting as{" "}
                  <span className="rounded-md bg-white/[0.06] px-2 py-0.5 font-medium text-neutral-300">
                    {SITE_HOST}/{username}
                  </span>
                </p>
              ) : null}
            </div>

            <EffectPreviewMockup />
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-neutral-500">
            How it works
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-white/[0.1] hover:bg-white/[0.03]"
              >
                <span className="text-xs font-semibold tabular-nums text-amber-400/80">
                  {item.step}
                </span>
                <h3 className="mt-2 text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-neutral-500">
            Submit your request
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            Pick whichever channel works best — include the details below and we&apos;ll get started.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {CONTACT_OPTIONS.map((option) => (
              <div
                key={option.label}
                className="flex flex-col rounded-xl border border-white/[0.06] bg-[#0c0c0c] p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-neutral-300">
                  {option.icon}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-white">{option.label}</h3>
                <p className="mt-1 text-xs text-neutral-500">{option.description}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-neutral-300">
                  {option.href ? (
                    <a
                      href={option.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-white underline decoration-white/30 underline-offset-2 transition hover:decoration-white/60"
                    >
                      {option.action}
                    </a>
                  ) : (
                    option.action
                  )}
                </p>
                {"hint" in option && option.hint ? (
                  <p className="mt-2 text-xs text-amber-400/80">{option.hint}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h3 className="text-sm font-semibold text-white">What to include</h3>
            <ul className="mt-4 space-y-3">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-neutral-400">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-400"
                    aria-hidden
                  >
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-neutral-600">
              One custom effect per Premium Lite account. Turnaround varies by complexity — we&apos;ll
              confirm timing when you submit.
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h3 className="text-sm font-semibold text-white">Example ideas</h3>
            <p className="mt-2 text-xs text-neutral-500">
              Not sure what to ask for? Here are effects other members have requested:
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {EXAMPLE_IDEAS.map((idea) => (
                <span
                  key={idea}
                  className="rounded-full border border-white/[0.08] bg-black/30 px-3 py-1.5 text-xs text-neutral-400"
                >
                  {idea}
                </span>
              ))}
            </div>
            <div className="mt-6 rounded-lg border border-white/[0.06] bg-black/20 px-4 py-3">
              <p className="text-xs leading-relaxed text-neutral-500">
                Need help with your main profile settings?{" "}
                <Link
                  href="/dashboard/effects"
                  className="text-neutral-300 underline decoration-white/20 underline-offset-2 hover:text-white"
                >
                  Browse built-in effects
                </Link>{" "}
                first — many pages look great without a custom request.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
