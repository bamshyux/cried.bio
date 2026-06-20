import { revalidatePath } from "next/cache";

export function revalidateProfileOg(username: string | null | undefined) {
  if (!username) return;
  revalidatePath(`/api/og/${username}`);
}
