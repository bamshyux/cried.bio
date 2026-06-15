import Link from "next/link";
import { notFound } from "next/navigation";
import { getFollowing } from "@/lib/data/social";
import { getProfileByUsername } from "@/lib/data/profiles";
import { getSettingsByProfileId } from "@/lib/data/settings";
import { isValidUsername, normalizeUsername } from "@/lib/profile";

type PageProps = { params: Promise<{ username: string }> };

export default async function FollowingPage({ params }: PageProps) {
  const { username } = await params;
  const normalized = normalizeUsername(username);
  if (!isValidUsername(normalized)) notFound();

  const profile = await getProfileByUsername(normalized);
  if (!profile) notFound();

  const settings = await getSettingsByProfileId(profile.id);
  if (!settings.show_follow_counts) notFound();

  const following = await getFollowing(profile.id);
  const displayName = profile.display_name || profile.username;

  return (
    <div className="min-h-screen bg-[#090909] px-5 py-16 text-white">
      <div className="mx-auto max-w-lg">
        <Link href={`/${profile.username}`} className="text-sm text-neutral-500 hover:text-white">← {displayName}</Link>
        <h1 className="mt-4 text-2xl font-semibold">Following</h1>
        <ul className="mt-6 space-y-2">
          {following.map((user) => (
            <li key={user.id}>
              <Link href={user.username ? `/${user.username}` : "#"} className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-[#141414] p-3 hover:border-white/10">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-sm font-bold">
                    {(user.display_name || user.username || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <span>{user.display_name || user.username}</span>
              </Link>
            </li>
          ))}
          {following.length === 0 && <p className="text-neutral-500">Not following anyone yet.</p>}
        </ul>
      </div>
    </div>
  );
}
