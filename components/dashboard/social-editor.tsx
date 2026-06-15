"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  respondFriendRequestAction,
  updateSocialSettingsAction,
} from "@/app/actions/social";
import {
  buttonPrimaryClassName,
  cardClassName,
  FormFeedback,
  PageHeader,
  ToggleField,
} from "@/components/dashboard/form-fields";
import { useSettingsRefresh } from "@/components/dashboard/use-settings-refresh";
import type { ProfileSettings, SettingsFormState } from "@/lib/types/settings";

const initial: SettingsFormState = {};

export function SocialEditor({
  settings,
  pendingRequests,
  followerCount,
  followingCount,
}: {
  settings: ProfileSettings;
  pendingRequests: Array<{ id: string; sender?: { display_name?: string; username?: string } }>;
  followerCount: number;
  followingCount: number;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updateSocialSettingsAction, initial);
  useSettingsRefresh(state);

  return (
    <>
      <PageHeader title="Social" description="Followers, friends, and social visibility." />
      <div className={`${cardClassName} mb-6 grid gap-4 sm:grid-cols-2`}>
        <div className="rounded-lg border border-white/[0.06] bg-[#0f0f0f] p-4">
          <p className="text-2xl font-bold text-white">{followerCount}</p>
          <p className="text-xs text-neutral-500">Followers</p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-[#0f0f0f] p-4">
          <p className="text-2xl font-bold text-white">{followingCount}</p>
          <p className="text-xs text-neutral-500">Following</p>
        </div>
      </div>

      <div className={`${cardClassName} mb-6`}>
        <form action={formAction} data-dashboard-primary-form className="space-y-4">
          <ToggleField
            name="show_follow_counts"
            label="Show followers & following"
            description="Display follower and following counts on your public profile"
            defaultChecked={settings.show_follow_counts}
          />
          <ToggleField
            name="show_activity"
            label="Show recent activity"
            description="Display your recent profile activity feed on your public profile"
            defaultChecked={settings.show_activity}
          />
          <div>
            <label htmlFor="friends_visibility" className="mb-1.5 block text-[13px] font-medium text-neutral-400">Friends list visibility</label>
            <select id="friends_visibility" name="friends_visibility" defaultValue={settings.friends_visibility} className="bf-input w-full">
              <option value="public">Public</option>
              <option value="friends">Friends only</option>
              <option value="private">Private</option>
            </select>
          </div>
          <FormFeedback error={state.error} success={state.success} />
          <button type="submit" disabled={isPending} className={buttonPrimaryClassName}>
            {isPending ? "Saving..." : "Save social settings"}
          </button>
        </form>
      </div>

      {pendingRequests.length > 0 && (
        <div className={cardClassName}>
          <h2 className="mb-4 text-sm font-medium text-white">Friend requests</h2>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#0f0f0f] p-4">
                <p className="text-sm text-white">{req.sender?.display_name || req.sender?.username || "User"}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => respondFriendRequestAction(req.id, true).then(() => router.refresh())} className="text-xs text-emerald-400">Accept</button>
                  <button type="button" onClick={() => respondFriendRequestAction(req.id, false).then(() => router.refresh())} className="text-xs text-red-400">Decline</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
