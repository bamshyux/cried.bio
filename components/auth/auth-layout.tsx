import Link from "next/link";
import { BioForgeLogo } from "@/components/brand/logo";

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090909] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,229,204,0.06),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center px-6 py-6">
        <Link href="/">
          <BioForgeLogo />
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex max-w-md flex-col px-6 pb-16 pt-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-neutral-500">{subtitle}</p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-[#141414] p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
