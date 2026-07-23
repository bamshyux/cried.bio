import Image from "next/image";
import Link from "next/link";
import { HomeSection, HomeSectionHeader } from "@/components/home/home-section-header";
import { Reveal } from "@/components/home/reveal";
import { SITE_HOST } from "@/lib/site";
import type { LandingFeaturedProfile } from "@/lib/types/landing";

export function HomeFeaturedProfiles({ profiles }: { profiles: LandingFeaturedProfile[] }) {
  if (!profiles.length) return null;

  return (
    <HomeSection id="featured" withBorder>
      <HomeSectionHeader
        eyebrow="Spotlight"
        title="Featured profiles"
        description="Hand-picked pages that showcase what's possible on cried.bio."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((profile, index) => (
          <Reveal key={profile.id} delay={index * 70} variant="scale">
            <Link
              href={`/${profile.username}`}
              className="bf-home-profile-card group block overflow-hidden rounded-2xl bf-home-glass-card transition-all duration-500 bf-home-ease hover:-translate-y-1 hover:border-white/[0.14] hover:shadow-[0_24px_64px_rgba(0,0,0,0.4)]"
            >
              <div className="relative h-24 bg-gradient-to-br from-neutral-800 via-neutral-900 to-[#090909]">
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(20,20,20,1)_100%)]" />
              </div>
              <div className="relative px-5 pb-5 pt-0">
                <div className="-mt-8 mb-3 flex items-end gap-3">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt=""
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-full object-cover ring-2 ring-[#141414]"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-neutral-500 to-neutral-700 text-lg font-semibold ring-2 ring-[#141414]">
                      {profile.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 pb-1">
                    <p className="truncate font-medium text-white">{profile.display_name}</p>
                    <p className="truncate font-mono text-xs text-neutral-500">@{profile.username}</p>
                  </div>
                </div>
                {profile.bio ? (
                  <p className="line-clamp-2 text-sm leading-relaxed text-neutral-500">{profile.bio}</p>
                ) : null}
                {profile.view_count && profile.view_count > 0 ? (
                  <p className="mt-2 text-xs text-neutral-600">
                    {profile.view_count >= 1000
                      ? `${(profile.view_count / 1000).toFixed(1).replace(/\.0$/, "")}k views`
                      : `${profile.view_count.toLocaleString()} views`}
                  </p>
                ) : null}
                <p className="mt-3 font-mono text-[11px] text-neutral-600 group-hover:text-neutral-400">
                  {SITE_HOST}/{profile.username}
                </p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </HomeSection>
  );
}
