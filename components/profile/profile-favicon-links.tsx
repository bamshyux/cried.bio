import {
  buildProfileFaviconHref,
  faviconMimeFromStoredUrl,
} from "@/lib/profile/favicon";

export function ProfileFaviconLinks({
  username,
  faviconUrl,
}: {
  username: string;
  faviconUrl: string | null;
}) {
  const href = buildProfileFaviconHref(username, faviconUrl);
  if (!href) return null;

  const type = faviconMimeFromStoredUrl(faviconUrl);

  return (
    <>
      <link rel="icon" href={href} type={type} sizes="32x32" />
      <link rel="shortcut icon" href={href} type={type} />
      <link rel="apple-touch-icon" href={href} />
    </>
  );
}
