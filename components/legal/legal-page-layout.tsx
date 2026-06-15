import Link from "next/link";
import { CriedLogo } from "@/components/brand/logo";
import { SITE_HOST } from "@/lib/site";

export function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090909] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255, 255, 255, 0.06),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/">
          <CriedLogo />
        </Link>
        <Link
          href="/"
          className="text-sm text-neutral-500 transition-colors hover:text-neutral-300"
        >
          Back to home
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-6 pb-20 pt-4">
        <div className="mb-10 border-b border-white/[0.06] pb-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-neutral-500">Last updated: {lastUpdated}</p>
        </div>

        <article className="legal-prose">{children}</article>
      </main>

      <footer className="relative z-10 border-t border-white/[0.04] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <p className="text-sm text-neutral-600">© {new Date().getFullYear()} cried.bio</p>
          <div className="flex gap-6 text-sm text-neutral-600">
            <Link href="/terms" className="transition-colors hover:text-neutral-400">
              Terms
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-neutral-400">
              Privacy
            </Link>
            <a
              href={`mailto:support@${SITE_HOST}`}
              className="transition-colors hover:text-neutral-400"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
