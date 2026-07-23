import Image from "next/image";
import Link from "next/link";
import { HomeSection, HomeSectionHeader } from "@/components/home/home-section-header";
import { Reveal } from "@/components/home/reveal";
import type { LandingTestimonial } from "@/lib/types/landing";

export function HomeTestimonials({ testimonials }: { testimonials: LandingTestimonial[] }) {
  if (!testimonials.length) return null;

  return (
    <HomeSection id="testimonials" withBorder>
      <HomeSectionHeader
        eyebrow="Testimonials"
        title="What creators are saying"
        description="Real feedback from people building on cried.bio."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((item, index) => (
          <Reveal key={item.id} delay={index * 70} variant={index % 2 === 0 ? "blur" : "up"}>
            <blockquote className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-[#141414]/90 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.12] hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
              <svg className="mb-4 h-6 w-6 text-neutral-700" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.016 3.016 0 0 1-3.016 3.016c-1.181 0-2.267-.707-2.746-1.879ZM12.583 17.321c-1.03-1.094-1.583-2.321-1.583-4.31 0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.016 3.016 0 0 1-3.016 3.016c-1.181 0-2.267-.707-2.746-1.879Z" />
              </svg>
              <p className="flex-1 text-sm leading-relaxed text-neutral-300">&ldquo;{item.quote}&rdquo;</p>
              <footer className="mt-5 flex items-center gap-3 border-t border-white/[0.06] pt-4">
                {item.author_avatar_url ? (
                  <Image
                    src={item.author_avatar_url}
                    alt=""
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full object-cover ring-1 ring-white/10"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 text-sm font-medium text-neutral-300">
                    {item.author_name.charAt(0)}
                  </div>
                )}
                <div>
                  {item.author_username ? (
                    <Link href={`/${item.author_username}`} className="text-sm font-medium text-white hover:underline">
                      {item.author_name}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-white">{item.author_name}</p>
                  )}
                  {item.author_title ? (
                    <p className="text-xs text-neutral-500">{item.author_title}</p>
                  ) : null}
                </div>
              </footer>
            </blockquote>
          </Reveal>
        ))}
      </div>
    </HomeSection>
  );
}
