import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUniqueBadgeSlug } from "@/lib/badges/slug";

const MAX_BADGE_ICON_SIZE = 2 * 1024 * 1024;

const STATIC_BADGE_ICON_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);

const ANIMATED_BADGE_ICON_TYPES = new Set([
  "image/gif",
  "image/webp",
  "image/apng",
  "image/png",
  "image/jpeg",
]);

function extensionForMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/svg+xml":
      return "svg";
    case "image/apng":
      return "png";
    default:
      return "png";
  }
}

export function validateStoreBadgeIcon(file: File, animated: boolean): string | null {
  const allowed = animated ? ANIMATED_BADGE_ICON_TYPES : STATIC_BADGE_ICON_TYPES;

  if (!allowed.has(file.type)) {
    if (animated) {
      return "Animated badges must be GIF, WebP, PNG, or JPEG.";
    }
    return "Static badges must be JPEG, PNG, WebP, or SVG — animated GIFs are not allowed.";
  }

  if (!animated && file.type === "image/gif") {
    return "Static badges cannot use animated GIFs.";
  }

  if (file.size > MAX_BADGE_ICON_SIZE) {
    return "Badge images must be 2 MB or smaller.";
  }

  return null;
}

export async function uploadStoreBadgeIcon(
  slug: string,
  file: File,
  animated: boolean,
): Promise<string> {
  const validationError = validateStoreBadgeIcon(file, animated);
  if (validationError) throw new Error(validationError);

  const admin = createAdminClient();
  if (!admin) throw new Error("Badge upload is temporarily unavailable.");

  const extension = extensionForMime(file.type);
  const path = `store/${slug}.${extension}`;

  const { error } = await admin.storage
    .from("badges")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = admin.storage.from("badges").getPublicUrl(path);

  return publicUrl;
}

export async function insertStoreCustomBadge(input: {
  userId: string;
  name: string;
  description: string;
  iconFile: File;
  animated: boolean;
}): Promise<{ badgeId: string; slug: string; name: string }> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Badge creation is temporarily unavailable.");

  const slug = await resolveUniqueBadgeSlug(admin, input.name);
  const iconUrl = await uploadStoreBadgeIcon(slug, input.iconFile, input.animated);

  const { data: badge, error } = await admin
    .from("badges")
    .insert({
      slug,
      name: input.name,
      icon: slug,
      icon_url: iconUrl,
      color: "#fafafa",
      description: input.description,
      category: "custom",
      rarity: "mythic",
      is_system: false,
      is_assignable: false,
    })
    .select("id, slug, name")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("Badge slug already exists. Try a different name.");
    throw new Error(error.message);
  }

  const { error: assignError } = await admin.from("profile_badges").insert({
    profile_id: input.userId,
    badge_id: badge.id,
    assigned_by: input.userId,
    award_source: "store",
  });

  if (assignError) {
    if (assignError.code === "23505") throw new Error("You already have this badge.");
    throw new Error(assignError.message);
  }

  return { badgeId: badge.id, slug: badge.slug, name: badge.name };
}
