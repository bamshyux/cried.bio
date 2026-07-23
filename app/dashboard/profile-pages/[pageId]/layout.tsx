import Link from "next/link";
import { ProfilePageEditorSubnav } from "@/components/dashboard/profile-page-editor/subnav";
import { loadProfilePageEditor } from "@/lib/dashboard/load-profile-page-editor";
import { SITE_HOST } from "@/lib/site";

export default async function ProfilePageEditorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const { page, profile } = await loadProfilePageEditor(pageId);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/profile-pages"
          className="text-xs font-medium text-neutral-500 transition-colors hover:text-white"
        >
          ← Back to profile pages
        </Link>
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-amber-400/80">
          Premium profile page
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          {page.label || page.slug}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Customize this page independently from your primary profile at{" "}
          <span className="text-neutral-400">
            {SITE_HOST}/{profile?.username ?? "…"}
          </span>
          .
        </p>
        {profile?.username ? (
          <a
            href={`/${profile.username}/${page.slug}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex text-sm text-neutral-400 transition-colors hover:text-white"
          >
            View live page →
          </a>
        ) : null}
      </div>

      <ProfilePageEditorSubnav pageId={pageId} />
      {children}
    </div>
  );
}
