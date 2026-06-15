import Link from "next/link";
import { redirect } from "next/navigation";
import { getModerationDashboardData } from "@/app/actions/moderation";
import { ModerationPanel } from "@/components/admin/moderation-panel";
import { requireSuperAdmin } from "@/lib/auth/super-admin";

export default async function AdminModerationPage() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) redirect("/dashboard");

  const data = await getModerationDashboardData();
  if ("error" in data) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="bf-card space-y-3 p-6 text-sm">
          <p className="text-red-400">{data.error}</p>
          <p className="text-neutral-500">
            Run{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-neutral-300">
              supabase/v38_content_moderation.sql
            </code>{" "}
            in Supabase, then refresh.
          </p>
          <Link href="/dashboard" className="text-[var(--bf-accent)] hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Admin
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Content moderation</h1>
          <p className="mt-1.5 text-sm text-neutral-500">
            Manage banned words, categories, blocked content logs, and audit history.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-neutral-400 transition-colors hover:text-white"
        >
          ← Dashboard
        </Link>
      </div>

      <ModerationPanel
        categories={data.categories}
        words={data.words}
        logs={data.logs}
        audit={data.audit}
      />
    </div>
  );
}
