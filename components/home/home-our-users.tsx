import Image from "next/image";
import Link from "next/link";
import { AnimatedCounter } from "@/components/home/animated-counter";
import { HomeSection, HomeSectionHeader } from "@/components/home/home-section-header";
import { Reveal } from "@/components/home/reveal";
import { SITE_HOST } from "@/lib/site";
import type { LandingProfile, LandingStats } from "@/lib/types/landing";

function ProfileAvatar({ profile }: { profile: LandingProfile }) {
  if (profile.avatar_url) {
    return (
      <Image
        src={profile.avatar_url}
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10"
        unoptimized
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-neutral-600 to-neutral-800 text-xs font-semibold text-white ring-1 ring-white/10">
      {(profile.display_name || profile.username).charAt(0).toUpperCase()}
    </div>
  );
}

export function HomeOurUsers({
  profiles,
  totalUsers,
}: {
  profiles: LandingProfile[];
  totalUsers: number;
}) {
  return (
    <HomeSection id="community" withBorder>
      <HomeSectionHeader
        eyebrow="Community"
        title="Our users"
        description="Real creators, gamers, and builders already on cried.bio."
      />

      <Reveal className="mb-10 text-center">
        <p className="text-sm text-neutral-500">
          Join{" "}
          <AnimatedCounter value={totalUsers} className="font-semibold text-white no-underline" />
          {" "}creators on the platform
        </p>
      </Reveal>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {profiles.map((profile, index) => (
          <Reveal key={profile.id} delay={index * 50}>
            <Link
              href={`/${profile.username}`}
              className="bf-home-profile-card group flex items-center gap-3 rounded-2xl bf-home-glass-card p-4 transition-all duration-500 bf-home-ease hover:-translate-y-0.5 hover:border-white/[0.14] hover:shadow-[0_20px_48px_rgba(0,0,0,0.35)]"
            >
              <ProfileAvatar profile={profile} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white group-hover:text-[#fafafa]">
                  {profile.display_name}
                </p>
                <p className="truncate font-mono text-xs text-neutral-500">
                  {SITE_HOST}/{profile.username}
                </p>
              </div>
              <svg
                className="h-4 w-4 shrink-0 text-neutral-600 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </Reveal>
        ))}
      </div>
    </HomeSection>
  );
}

export function HomeStatsSection({ stats }: { stats: LandingStats }) {
  const items = [
    { label: "Total users", value: stats.total_users },
    { label: "Published profiles", value: stats.total_profiles },
    { label: "Profile views", value: stats.total_profile_views },
    { label: "Guestbook posts", value: stats.total_guestbook_posts },
    { label: "Custom themes", value: stats.total_custom_themes },
    { label: "Badges earned", value: stats.total_badges_granted },
  ];

  return (
    <HomeSection id="stats" withBorder>
      <HomeSectionHeader
        eyebrow="Platform"
        title="By the numbers"
        description="cried.bio is growing every day. Here's what's happening across the platform."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <Reveal key={item.label} delay={index * 60} variant={index % 3 === 1 ? "scale" : "up"}>
            <div className="bf-home-stat-card bf-home-glass-card rounded-2xl p-6 transition-all duration-500 bf-home-ease hover:-translate-y-1 hover:border-white/[0.14] hover:shadow-[0_24px_64px_rgba(0,0,0,0.4)]">
              <p className="text-3xl font-semibold tracking-tight text-white no-underline sm:text-4xl">
                <AnimatedCounter value={item.value} className="no-underline" />
              </p>
              <p className="mt-2 text-sm text-neutral-500">{item.label}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </HomeSection>
  );
}
