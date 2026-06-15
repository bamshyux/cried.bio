import { Reveal } from "@/components/home/reveal";
import type { ReactNode } from "react";

type Feature = {
  title: string;
  description: string;
  icon: ReactNode;
};

export function HomeFeatures({ features }: { features: Feature[] }) {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 pb-32">
      <Reveal className="mb-12 text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Built to stand out</h2>
        <p className="mt-3 text-neutral-500">Everything you need. Nothing you don&apos;t.</p>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-3">
        {features.map((feature, index) => (
          <Reveal key={feature.title} delay={index * 90}>
            <div className="h-full rounded-xl border border-white/[0.06] bg-[#141414] p-6 transition-colors hover:border-[#00e5cc]/20 hover:bg-[#1a1a1a]">
              <div className="mb-4 inline-flex rounded-lg border border-white/[0.06] bg-[#0f0f0f] p-2.5 text-[#00e5cc]">
                {feature.icon}
              </div>
              <h3 className="font-medium text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">{feature.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
