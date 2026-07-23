import Link from "next/link";
import { ProfilePageEditorSubnav } from "@/components/dashboard/profile-page-editor/subnav";
import { loadProfilePageEditor } from "@/lib/dashboard/load-profile-page-editor";
import { SITE_HOST } from "@/lib/site";

export default async function ContentPageEditorLayout({
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
          href="/dashboard/pages"
          className="text-xs font-medium text-neutral-500 transition-colors hover:text-white"
        >
          ← Back to pages
        </Link>
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-amber-400/80">
          Content page
        </p>
        <div className="mt-2 flex items-center gap-2">
          {page.icon ? <span className="text-2xl leading-none">{page.icon}</span> : null}
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {page.label || page.slug}
          </h1>
          {!page.published ? (
            <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
              Draft
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-neutral-500">
          Style this page, add links and music, then publish when ready.
        </p>
        {profile?.username ? (
          <a
            href={`/${profile.username}/${page.slug}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex text-sm text-neutral-400 transition-colors hover:text-white"
          >
            {SITE_HOST}/{profile.username}/{page.slug} →
          </a>
        ) : null}
      </div>

      <ProfilePageEditorSubnav pageId={pageId} />
      {children}
    </div>
  );
}
