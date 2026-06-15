import type { SupabaseClient } from "@supabase/supabase-js";

const USER_BUCKETS = ["profiles", "backgrounds", "music"] as const;

export async function deleteAllUserStorage(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  await Promise.all(
    USER_BUCKETS.map(async (bucket) => {
      const { data: files } = await supabase.storage.from(bucket).list(userId);
      if (!files?.length) return;

      const paths = files.map((file) => `${userId}/${file.name}`);
      await supabase.storage.from(bucket).remove(paths);
    }),
  );
}
