import { LinksEditor } from "@/components/profile/links-editor";
import { cardClassName } from "@/components/dashboard/form-fields";
import { getLinksByPageId } from "@/lib/data/profile-pages";
import { loadProfilePageEditor } from "@/lib/dashboard/load-profile-page-editor";

export default async function ProfilePageLinksPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const { userId, settings } = await loadProfilePageEditor(pageId);
  const links = await getLinksByPageId(userId, pageId);

  return (
    <div className={cardClassName}>
      <LinksEditor links={links} settings={settings} pageId={pageId} />
    </div>
  );
}
