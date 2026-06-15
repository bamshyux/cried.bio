import Link from "next/link";
import { redirect } from "next/navigation";
import { syncFounderBadges, syncSignupBadgesAction } from "@/app/actions/badges";
import { BioForgeLogo } from "@/components/brand/logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getProfileByUserId } from "@/lib/data/profiles";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub as string;
  await syncFounderBadges(userId);
  await syncSignupBadgesAction(userId);
  const email = (data.claims.email as string | undefined) ?? "User";
  const profile = await getProfileByUserId(userId);

  return (
    <div className="min-h-screen bg-[#090909] text-neutral-100">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#090909]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="lg:hidden">
            <BioForgeLogo size={28} />
          </Link>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-4">
            <span className="hidden text-[13px] text-neutral-500 sm:inline">{email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-8 lg:flex-row lg:px-8">
        <DashboardSidebar username={profile?.username} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
