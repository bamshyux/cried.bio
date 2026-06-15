import Link from "next/link";
import { redirect } from "next/navigation";
import { CriedLogo } from "@/components/brand/logo";
import { requireSuperAdmin } from "@/lib/auth/super-admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#090909] text-white">
      <header className="border-b border-white/[0.06] bg-[#0c0c0c]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <CriedLogo size={24} />
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              <Link
                href="/admin/moderation"
                className="font-medium text-white hover:text-neutral-200"
              >
                Moderation
              </Link>
              <Link
                href="/dashboard/accounts"
                className="text-neutral-500 hover:text-neutral-300"
              >
                Accounts
              </Link>
            </nav>
          </div>
          <p className="truncate text-xs text-neutral-500">{auth.email}</p>
        </div>
      </header>
      {children}
    </div>
  );
}
