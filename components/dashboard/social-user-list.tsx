import Link from "next/link";
import type { SocialProfile } from "@/lib/types/social";

export function SocialUserList({
  users,
  emptyMessage,
}: {
  users: SocialProfile[];
  emptyMessage: string;
}) {
  if (users.length === 0) {
    return <p className="py-6 text-center text-sm text-neutral-500">{emptyMessage}</p>;
  }

  return (
    <ul className="divide-y divide-white/[0.06]">
      {users.map((user) => {
        const label = user.display_name || user.username || "User";
        const href = user.username ? `/${user.username}` : "#";

        return (
          <li key={user.id}>
            <Link
              href={href}
              className="flex items-center gap-3 px-1 py-3 transition-colors hover:bg-white/[0.02]"
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-sm font-bold text-neutral-300">
                  {label.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{label}</p>
                {user.username ? (
                  <p className="truncate text-xs text-neutral-500">@{user.username}</p>
                ) : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
