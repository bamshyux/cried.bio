import { getActiveAnnouncement, getPlatformSettings } from "@/lib/data/admin";

export async function GlobalSiteBanner() {
  const [announcement, settings] = await Promise.all([
    getActiveAnnouncement(),
    getPlatformSettings(),
  ]);

  const title = announcement?.title?.trim();
  const body = announcement?.body?.trim();
  const fallbackBanner = settings?.global_banner?.trim();

  if (!title && !fallbackBanner) return null;

  const type = announcement?.announcement_type ?? settings?.global_banner_type ?? "info";
  const tone =
    type === "warning"
      ? "border-amber-500/30 bg-amber-500/15 text-amber-50"
      : type === "maintenance"
        ? "border-red-500/30 bg-red-500/15 text-red-50"
        : type === "update"
          ? "border-sky-500/30 bg-sky-500/15 text-sky-50"
          : "border-white/10 bg-white/[0.06] text-neutral-100";

  return (
    <div
      className={`relative z-[120] border-b px-4 py-3 text-center text-sm ${tone}`}
      role="status"
      aria-live="polite"
    >
      {title ? (
        <p>
          <span className="font-semibold">{title}</span>
          {body ? <span className="text-white/80"> — {body}</span> : null}
        </p>
      ) : (
        <p>{fallbackBanner}</p>
      )}
    </div>
  );
}
