"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  changePasswordAction,
  deleteAccountAction,
  resetProfileAction,
  revokeSessionAction,
  signOutAllDevicesAction,
  updateContactPreferencesAction,
  updateEmailAction,
  updatePrivacyPreferencesAction,
  updateProfileVisibilityAction,
  updateUsernameAction,
} from "@/app/actions/account-settings";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  FormFeedback,
  inputClassName,
  labelClassName,
  PageHeader,
  ToggleField,
} from "@/components/dashboard/form-fields";
import { MfaSettings } from "./mfa-settings";
import { SettingRow, SettingsNav, SettingsSection } from "./settings-ui";
import type { AccountSettingsData, AccountSettingsFormState, SettingsCategory } from "@/lib/types/account-settings";
import {
  formatUsernameChangeAvailableDate,
  USERNAME_CHANGE_COOLDOWN_DAYS,
} from "@/lib/username-cooldown";

const initial: AccountSettingsFormState = {};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AccountSettingsShell({ data }: { data: AccountSettingsData }) {
  const router = useRouter();
  const [category, setCategory] = useState<SettingsCategory>("account");

  const [usernameState, usernameAction, usernamePending] = useActionState(updateUsernameAction, initial);
  const [emailState, emailAction, emailPending] = useActionState(updateEmailAction, initial);
  const [passwordState, passwordAction, passwordPending] = useActionState(changePasswordAction, initial);
  const [visibilityState, visibilityAction, visibilityPending] = useActionState(updateProfileVisibilityAction, initial);
  const [contactState, contactAction, contactPending] = useActionState(updateContactPreferencesAction, initial);
  const [privacyState, privacyAction, privacyPending] = useActionState(updatePrivacyPreferencesAction, initial);
  const [resetState, resetAction, resetPending] = useActionState(resetProfileAction, initial);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteAccountAction, initial);

  const [sessionMsg, setSessionMsg] = useState<string>();
  const [signOutPending, setSignOutPending] = useState(false);

  const currentSessionHash = data.sessions[0]?.session_token_hash;

  async function handleSignOutAll() {
    setSignOutPending(true);
    await signOutAllDevicesAction();
  }

  async function handleRevokeSession(id: string) {
    const result = await revokeSessionAction(id);
    setSessionMsg(result.success ?? result.error);
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your account, security, contact preferences, and privacy."
      />

      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="lg:w-44 lg:shrink-0">
          <SettingsNav active={category} onChange={(id) => setCategory(id as SettingsCategory)} />
        </div>

        <div className="min-w-0 flex-1 space-y-8">
          {category === "account" ? (
            <>
              <SettingsSection title="Account" description="Your cried.bio identity and login credentials.">
                <SettingRow
                  label="Username"
                  description={`Your public profile URL. 3–20 characters, lowercase. Can be changed once every ${USERNAME_CHANGE_COOLDOWN_DAYS} days.`}
                >
                  <form action={usernameAction} className="space-y-3">
                    <input
                      name="username"
                      defaultValue={data.username ?? ""}
                      className={inputClassName}
                      placeholder="username"
                      autoComplete="username"
                      readOnly={!data.usernameChangeCooldown.canChange}
                    />
                    {!data.usernameChangeCooldown.canChange && data.usernameChangeCooldown.nextChangeAt ? (
                      <p className="text-xs text-amber-400/90">
                        Username locked until{" "}
                        {formatUsernameChangeAvailableDate(data.usernameChangeCooldown.nextChangeAt)}.
                      </p>
                    ) : null}
                    <FormFeedback error={usernameState.error} success={usernameState.success} />
                    <button
                      type="submit"
                      disabled={usernamePending || !data.usernameChangeCooldown.canChange}
                      className={buttonPrimaryClassName}
                    >
                      {usernamePending ? "Saving..." : "Save username"}
                    </button>
                  </form>
                </SettingRow>

                <SettingRow label="Email address" description="Used for login and account notifications.">
                  <form action={emailAction} className="space-y-3">
                    <input
                      name="email"
                      type="email"
                      defaultValue={data.email}
                      className={inputClassName}
                      autoComplete="email"
                    />
                    <FormFeedback error={emailState.error} success={emailState.success} />
                    <button type="submit" disabled={emailPending} className={buttonPrimaryClassName}>
                      {emailPending ? "Saving..." : "Update email"}
                    </button>
                  </form>
                </SettingRow>

                <SettingRow label="Change password" description="Use at least 6 characters.">
                  <form action={passwordAction} className="space-y-3">
                    <input
                      name="password"
                      type="password"
                      className={inputClassName}
                      placeholder="New password"
                      autoComplete="new-password"
                    />
                    <input
                      name="repeatPassword"
                      type="password"
                      className={inputClassName}
                      placeholder="Confirm password"
                      autoComplete="new-password"
                    />
                    <FormFeedback error={passwordState.error} success={passwordState.success} />
                    <button type="submit" disabled={passwordPending} className={buttonPrimaryClassName}>
                      {passwordPending ? "Updating..." : "Update password"}
                    </button>
                  </form>
                </SettingRow>

                <SettingRow
                  label="Profile visibility"
                  description="Control who can view your public profile page."
                >
                  <form action={visibilityAction} className="space-y-3">
                    <select
                      name="profile_visibility"
                      defaultValue={data.preferences.profile_visibility}
                      className={inputClassName}
                    >
                      <option value="public">Public — anyone with the link</option>
                      <option value="unlisted">Unlisted — hidden from search</option>
                      <option value="private">Private — only you</option>
                    </select>
                    <FormFeedback error={visibilityState.error} success={visibilityState.success} />
                    <button type="submit" disabled={visibilityPending} className={buttonPrimaryClassName}>
                      {visibilityPending ? "Saving..." : "Save visibility"}
                    </button>
                  </form>
                </SettingRow>

                <SettingRow
                  label="Delete account"
                  description="Permanently remove your cried.bio account and all data."
                  danger
                >
                  <button
                    type="button"
                    onClick={() => setCategory("danger")}
                    className={buttonSecondaryClassName}
                  >
                    Open Danger Zone
                  </button>
                </SettingRow>
              </SettingsSection>
            </>
          ) : null}

          {category === "security" ? (
            <SettingsSection title="Security" description="Protect your account and monitor sign-in activity.">
              <MfaSettings
                mfaEnabled={data.mfaEnabled}
                mfaFactorId={data.mfaFactorId}
                recoveryRemaining={data.recoveryCodes.remaining}
                recoveryTotal={data.recoveryCodes.total}
              />

              <SettingRow
                label="Active sessions"
                description="Devices currently signed in to your account."
              >
                <div className="space-y-2">
                  {data.sessions.length === 0 ? (
                    <p className="text-xs text-neutral-500">No tracked sessions yet.</p>
                  ) : (
                    data.sessions.map((session, index) => (
                      <div
                        key={session.id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-white/[0.06] bg-[#0a0a0a] p-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">
                            {session.device_label ?? "Unknown device"}
                            {index === 0 ? (
                              <span className="ml-2 text-[10px] font-normal text-neutral-500">(current)</span>
                            ) : null}
                          </p>
                          <p className="mt-0.5 text-[11px] text-neutral-500">
                            {session.ip_address ?? "Unknown IP"} · Last active {formatWhen(session.last_active_at)}
                          </p>
                        </div>
                        {index !== 0 ? (
                          <button
                            type="button"
                            onClick={() => handleRevokeSession(session.id)}
                            className="shrink-0 text-xs text-neutral-400 hover:text-white"
                          >
                            Revoke
                          </button>
                        ) : null}
                      </div>
                    ))
                  )}
                  {sessionMsg ? <p className="text-xs text-neutral-400">{sessionMsg}</p> : null}
                </div>
              </SettingRow>

              <SettingRow
                label="Sign out all devices"
                description="Ends every active session. You will need to sign in again."
              >
                <button
                  type="button"
                  onClick={handleSignOutAll}
                  disabled={signOutPending}
                  className={buttonSecondaryClassName}
                >
                  {signOutPending ? "Signing out..." : "Sign out everywhere"}
                </button>
              </SettingRow>

              <SettingRow label="Login history" description="Recent sign-in attempts on your account.">
                <div className="max-h-56 space-y-2 overflow-y-auto">
                  {data.loginHistory.length === 0 ? (
                    <p className="text-xs text-neutral-500">No login history recorded yet.</p>
                  ) : (
                    data.loginHistory.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-lg border border-white/[0.06] bg-[#0a0a0a] px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium text-white">
                            {entry.device_label ?? "Unknown device"}
                          </p>
                          <span
                            className={`text-[10px] ${entry.success ? "text-neutral-500" : "text-red-400"}`}
                          >
                            {entry.success ? "Success" : "Failed"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-neutral-500">
                          {entry.ip_address ?? "Unknown IP"} · {formatWhen(entry.created_at)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </SettingRow>
            </SettingsSection>
          ) : null}

          {category === "contact" ? (
            <SettingsSection title="Contact" description="How cried.bio reaches you.">
              <form action={contactAction}>
                <SettingRow label="Phone number" description="Optional. Used for account recovery and alerts.">
                  <input
                    name="phone_number"
                    type="tel"
                    defaultValue={data.preferences.phone_number}
                    className={inputClassName}
                    placeholder="+1 555 000 0000"
                    autoComplete="tel"
                  />
                </SettingRow>

                <div className="space-y-3 p-5">
                  <ToggleField
                    name="email_notifications"
                    label="Email notifications"
                    description="Security alerts, guestbook messages, and account updates"
                    defaultChecked={data.preferences.email_notifications}
                  />
                  <ToggleField
                    name="marketing_emails"
                    label="Marketing emails"
                    description="Product updates, tips, and cried.bio news"
                    defaultChecked={data.preferences.marketing_emails}
                  />
                </div>

                <div className="border-t border-white/[0.06] p-5">
                  <FormFeedback error={contactState.error} success={contactState.success} />
                  <button type="submit" disabled={contactPending} className={buttonPrimaryClassName}>
                    {contactPending ? "Saving..." : "Save contact settings"}
                  </button>
                </div>
              </form>
            </SettingsSection>
          ) : null}

          {category === "privacy" ? (
            <SettingsSection title="Privacy" description="Control what others see on your profile.">
              <form action={privacyAction}>
                <div className="space-y-3 p-5">
                  <ToggleField
                    name="show_in_search"
                    label="Show profile in search results"
                    description="When search launches, your profile can be discovered"
                    defaultChecked={data.preferences.show_in_search}
                  />
                  <ToggleField
                    name="hide_view_counts"
                    label="Hide view counts"
                    description="Visitors won't see your profile view count"
                    defaultChecked={data.preferences.hide_view_counts || !data.showViewCount}
                  />
                  <ToggleField
                    name="allow_guestbook"
                    label="Allow guestbook messages"
                    description="Let visitors leave messages on your profile"
                    defaultChecked={data.guestbookEnabled}
                  />
                  <ToggleField
                    name="allow_direct_contact"
                    label="Allow direct contact buttons"
                    description="Show email, phone, or contact links on your profile"
                    defaultChecked={data.preferences.allow_direct_contact}
                  />
                </div>

                <div className="border-t border-white/[0.06] p-5">
                  <FormFeedback error={privacyState.error} success={privacyState.success} />
                  <button type="submit" disabled={privacyPending} className={buttonPrimaryClassName}>
                    {privacyPending ? "Saving..." : "Save privacy settings"}
                  </button>
                </div>
              </form>
            </SettingsSection>
          ) : null}

          {category === "danger" ? (
            <SettingsSection
              title="Danger Zone"
              description="Irreversible actions. Proceed with caution."
            >
              <SettingRow
                label="Reset profile"
                description="Clears your bio, avatar, banner, links, embeds, and design settings. Your account and username are kept."
                danger
              >
                <form action={resetAction} className="space-y-3">
                  <div>
                    <label htmlFor="reset-confirm" className={labelClassName}>
                      Type RESET to confirm
                    </label>
                    <input
                      id="reset-confirm"
                      name="confirm"
                      className={inputClassName}
                      placeholder="RESET"
                      autoComplete="off"
                    />
                  </div>
                  <FormFeedback error={resetState.error} success={resetState.success} />
                  <button
                    type="submit"
                    disabled={resetPending}
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/15 disabled:opacity-50"
                  >
                    {resetPending ? "Resetting..." : "Reset profile"}
                  </button>
                </form>
              </SettingRow>

              <SettingRow
                label="Delete account"
                description="Permanently deletes your cried.bio account, profile, and all associated data."
                danger
              >
                <form action={deleteAction} className="space-y-3">
                  <div>
                    <label htmlFor="delete-confirm" className={labelClassName}>
                      Type your username to confirm
                    </label>
                    <input
                      id="delete-confirm"
                      name="confirm_username"
                      className={inputClassName}
                      placeholder={data.username ?? "username"}
                      autoComplete="off"
                    />
                  </div>
                  <FormFeedback error={deleteState.error} success={deleteState.success} />
                  <button
                    type="submit"
                    disabled={deletePending}
                    className="rounded-lg border border-red-500/40 bg-red-600/20 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-600/30 disabled:opacity-50"
                  >
                    {deletePending ? "Deleting..." : "Delete account permanently"}
                  </button>
                </form>
              </SettingRow>
            </SettingsSection>
          ) : null}
        </div>
      </div>
    </div>
  );
}
