import { HomeFeatureVisual } from "@/components/home/home-feature-visual";
import { HomeSection, HomeSectionHeader } from "@/components/home/home-section-header";
import { Reveal } from "@/components/home/reveal";

const FEATURES = [
  {
    title: "Custom CSS themes",
    description: "Write scoped CSS with a live editor. Full control over every pixel of your page.",
    visual: "themes" as const,
  },
  {
    title: "Profile effects",
    description: "Particles, glassmorphism, neon glow, parallax, cursor effects, and animated gradients.",
    visual: "effects" as const,
  },
  {
    title: "Music integration",
    description: "Embed tracks with a built-in player. Autoplay, loop, and volume controls included.",
    visual: "music" as const,
  },
  {
    title: "Guestbooks",
    description: "Let visitors leave messages with emoji reactions. Moderation and approval built in.",
    visual: "guestbook" as const,
  },
  {
    title: "Badges & milestones",
    description: "Earn badges for views, signups, and milestones. Display them with glow and custom styling.",
    visual: "badges" as const,
  },
  {
    title: "Analytics",
    description: "Track profile views, link clicks, visitor countries, and daily trends from your dashboard.",
    visual: "analytics" as const,
  },
  {
    title: "37 layouts",
    description: "From classic and minimal to gaming, terminal, glass, aurora, and custom CSS layouts.",
    visual: "layouts" as const,
  },
  {
    title: "Deep customization",
    description: "Accent colors, fonts, bio styling, link animations, enter gates, Discord presence, and more.",
    visual: "customize" as const,
  },
];

export function HomeWhyChoose() {
  return (
    <HomeSection id="features" withBorder>
      <HomeSectionHeader
        eyebrow="Features"
        title="Why choose cried.bio?"
        description="Everything you need to build a bio page that actually feels like yours — not a template."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature, index) => (
          <Reveal key={feature.title} delay={index * 50} variant={index % 2 === 0 ? "up" : "blur"}>
            <div className="bf-home-feature-card group h-full overflow-hidden rounded-2xl bf-home-glass-card p-4 transition-all duration-500 bf-home-ease hover:-translate-y-1 hover:border-white/[0.14] hover:shadow-[0_24px_64px_rgba(0,0,0,0.4)]">
              <HomeFeatureVisual type={feature.visual} />
              <h3 className="text-sm font-medium text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">{feature.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </HomeSection>
  );
}
