import { createAdminClient } from "@/lib/supabase/admin";
import { PREMIUM_MAX_UPLOAD_BYTES } from "@/lib/uploads/limits";

const UPLOAD_BUCKETS = ["backgrounds", "music"] as const;

/**
 * Raise Supabase bucket caps to match premium upload entitlement (idempotent).
 * Note: per-bucket limits cannot exceed Supabase's global file size limit (50 MB on Free).
 */
export async function syncStorageUploadLimits(): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, error: "Storage admin client is not configured." };
  }

  for (const bucketId of UPLOAD_BUCKETS) {
    const { error } = await admin.storage.updateBucket(bucketId, {
      public: true,
      fileSizeLimit: PREMIUM_MAX_UPLOAD_BYTES,
    });

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  return { ok: true };
}
