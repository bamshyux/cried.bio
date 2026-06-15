"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { clearRecentActivityAction, respondFriendRequestAction } from "@/app/actions/social";
import {
  SaveConfirmation,
  useSocialDashboardSection,
} from "@/components/dashboard/use-settings-form";
import { ControlledSelect } from "@/components/dashboard/controlled-fields";
import { SocialUserList } from "@/components/dashboard/social-user-list";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  cardClassName,
  PageHeader,
  ToggleField,
} from "@/components/dashboard/form-fields";
import type { ProfileSettings } from "@/lib/types/settings";
import type { SocialProfile } from "@/lib/types/social";

type FollowTab = "followers" | "following";

function readSocialForm(settings: ProfileSettings) {
  return {
    friends_visibility: settings.friends_visibility,
    show_follow_counts: settings.show_follow_counts,
    show_activity: settings.show_activity,
  };
}

export function SocialEditor({
  settings,
  pendingRequests,
  followers,
  following,
  followerCount,
  followingCount,
  activityCount,
}: {
  settings: ProfileSettings;
  pendingRequests: Array<{ id: string; sender?: { display_name?: string; username?: string } }>;
  followers: SocialProfile[];
  following: SocialProfile[];
  followerCount: number;
  followingCount: number;
  activityCount: number;
}) {
  const router = useRouter();
  const [followTab, setFollowTab] = useState<FollowTab>("followers");
  const [clearMessage, setClearMessage] = useState<string>();
  const [clearError, setClearError] = useState<string>();
  const [isClearing, startClear] = useTransition();

  const { form, patchForm, submit, state, isPending } = useSocialDashboardSection(
    settings,
    readSocialForm,
    "Social settings saved.",
  );

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    submit(form);
  };

  const handleClearActivity = () => {
    if (activityCount === 0) return;
    if (!window.confirm("Clear all recent activity from your public profile? This cannot be undone.")) {
      return;
    }

    setClearMessage(undefined);
    setClearError(undefined);

    startClear(async () => {
      const result = await clearRecentActivityAction();
      if (result.error) {
        setClearError(result.error);
        return;
      }
      setClearMessage(result.success);
      router.refresh();
    });
  };

  return (
    <>
      <PageHeader title="Social" description="Followers, friends, and social visibility." />

      <div className={`${cardClassName} mb-6`}>
        <div className="mb-4 flex gap-2 border-b border-white/[0.06]">
          <button
            type="button"
            onClick={() => setFollowTab("followers")}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              followTab === "followers"
                ? "border-[var(--bf-accent,#fafafa)] text-white"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Followers ({followerCount})
          </button>
          <button
            type="button"
            onClick={() => setFollowTab("following")}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              followTab === "following"
                ? "border-[var(--bf-accent,#fafafa)] text-white"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Following ({followingCount})
          </button>
        </div>

        {followTab === "followers" ? (
          <SocialUserList users={followers} emptyMessage="No followers yet." />
        ) : (
          <SocialUserList users={following} emptyMessage="Not following anyone yet." />
        )}
      </div>

      <div className={`${cardClassName} mb-6`}>
        <form onSubmit={handleSave} data-dashboard-primary-form className="space-y-4">
          <ToggleField
            name="show_follow_counts"
            label="Show followers & following"
            description="Display follower and following counts on your public profile"
            checked={form.show_follow_counts}
            onCheckedChange={(show_follow_counts) => patchForm({ show_follow_counts })}
          />
          <ToggleField
            name="show_activity"
            label="Show recent activity"
            description="Display your recent profile activity feed on your public profile"
            checked={form.show_activity}
            onCheckedChange={(show_activity) => patchForm({ show_activity })}
          />

          {form.show_activity ? (
            <div className="rounded-lg border border-white/[0.06] bg-[#0f0f0f] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-neutral-100">Recent activity</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {activityCount === 0
                      ? "No activity events on your profile."
                      : `${activityCount} event${activityCount === 1 ? "" : "s"} on your public profile.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearActivity}
                  disabled={isClearing || activityCount === 0}
                  className={`${buttonSecondaryClassName} shrink-0 disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {isClearing ? "Clearing..." : "Clear recent activity"}
                </button>
              </div>
              {(clearMessage || clearError) && (
                <p className={`mt-3 text-xs ${clearError ? "text-red-400" : "text-emerald-400"}`}>
                  {clearError ?? clearMessage}
                </p>
              )}
            </div>
          ) : null}

          <ControlledSelect
            label="Friends list visibility"
            value={form.friends_visibility}
            onChange={(friends_visibility) => patchForm({ friends_visibility })}
            options={[
              { value: "public", label: "Public" },
              { value: "friends", label: "Friends only" },
              { value: "private", label: "Private" },
            ]}
          />
          <SaveConfirmation success={state.success} error={state.error} />
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
              <div
                key={req.id}
                className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#0f0f0f] p-4"
              >
                <p className="text-sm text-white">
                  {req.sender?.display_name || req.sender?.username || "User"}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => respondFriendRequestAction(req.id, true).then(() => router.refresh())}
                    className="text-xs text-emerald-400"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => respondFriendRequestAction(req.id, false).then(() => router.refresh())}
                    className="text-xs text-red-400"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
