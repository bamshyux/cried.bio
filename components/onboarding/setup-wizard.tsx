"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { saveProfileImageAction } from "@/app/actions/profile";
import {
  addOnboardingSocialLinkAction,
  publishOnboardingProfileAction,
  saveOnboardingLayoutAction,
  validateOnboardingUsernameAction,
} from "@/app/actions/onboarding";
import { LayoutPreview } from "@/components/dashboard/layout-preview";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  cardClassName,
  FormFeedback,
  inputClassName,
  labelClassName,
} from "@/components/dashboard/form-fields";
import { LinkIcon, PlatformIconGrid } from "@/components/icons/social-icons";
import { LAYOUT_OPTIONS } from "@/lib/settings";
import { getPlatform, type SocialPlatformId } from "@/lib/social-platforms";
import { SITE_HOST } from "@/lib/site";
import type { Profile } from "@/lib/types/profile";
import type { ProfileLink } from "@/lib/types/link";
import type { ProfileLayout, ProfileSettings } from "@/lib/types/settings";
import { uploadProfileImageToStorage } from "@/lib/uploads/profile-client";
import { IMAGE_CROP_PRESETS } from "@/lib/uploads/image-crop";
import { useImageCropPicker } from "@/hooks/use-image-crop-picker";

const TOTAL_STEPS = 5;

const WIZARD_LAYOUTS = LAYOUT_OPTIONS.filter((layout) =>
  ["classic", "modern", "gaming", "minimal", "showcase"].includes(layout.value),
);

const fileInputClassName =
  "block w-full text-sm text-neutral-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#fafafa] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#090909]";

type WizardDraft = {
  username: string;
  displayName: string;
  layout: ProfileLayout;
};

function StepProgress({ step }: { step: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>Step {step} of {TOTAL_STEPS}</span>
        <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-[#fafafa] transition-all duration-300"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>
    </div>
  );
}

function WizardShell({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-8 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
          First-time setup
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-neutral-500">{description}</p>
      </div>

      <div className={`${cardClassName} space-y-6`}>
        <StepProgress step={step} />
        {children}
      </div>
    </div>
  );
}

export function SetupWizard({
  profile,
  settings,
  links,
}: {
  profile: Profile | null;
  settings: ProfileSettings;
  links: ProfileLink[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ error?: string; success?: string }>({});

  const [draft, setDraft] = useState<WizardDraft>({
    username: profile?.username ?? "",
    displayName: profile?.display_name ?? "",
    layout: settings.layout,
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url ?? null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarInputKey, setAvatarInputKey] = useState(0);

  const [socialPlatform, setSocialPlatform] = useState<SocialPlatformId | null>(null);
  const [socialInput, setSocialInput] = useState("");
  const [addedLinks, setAddedLinks] = useState<ProfileLink[]>(links);

  useEffect(() => {
    setAddedLinks(links);
  }, [links]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const goNext = () => setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  const goBack = () => {
    setFeedback({});
    setStep((current) => Math.max(1, current - 1));
  };

  const handleUsernameNext = () => {
    startTransition(async () => {
      setFeedback({});
      const result = await validateOnboardingUsernameAction(draft.username);
      if (result.error) {
        setFeedback({ error: result.error });
        return;
      }
      if (!draft.displayName.trim()) {
        setDraft((prev) => ({
          ...prev,
          displayName: prev.username.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        }));
      }
      goNext();
    });
  };

  const handleAvatarUpload = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setAvatarUploading(true);
    setFeedback({});
    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);

    try {
      const url = await uploadProfileImageToStorage(file, "avatar");
      const result = await saveProfileImageAction("avatar", url);
      if (result.error) {
        setFeedback({ error: result.error });
        setAvatarPreview(profile?.avatar_url ?? null);
        return;
      }
      setFeedback({ success: "Avatar uploaded." });
      router.refresh();
    } catch (error) {
      setFeedback({
        error: error instanceof Error ? error.message : "Avatar upload failed.",
      });
      setAvatarPreview(profile?.avatar_url ?? null);
    } finally {
      setAvatarUploading(false);
      setAvatarInputKey((key) => key + 1);
    }
  }, [profile?.avatar_url, router]);

  const avatarCrop = useImageCropPicker({
    ...IMAGE_CROP_PRESETS.avatar,
    onCropped: (file) => void handleAvatarUpload(file),
  });

  const handleAddSocialLink = () => {
    if (!socialPlatform) return;
    startTransition(async () => {
      setFeedback({});
      const result = await addOnboardingSocialLinkAction(socialPlatform, socialInput);
      if (result.error) {
        setFeedback({ error: result.error });
        return;
      }
      setSocialPlatform(null);
      setSocialInput("");
      setFeedback({ success: "Link added." });
      router.refresh();
    });
  };

  const handleLayoutNext = () => {
    startTransition(async () => {
      setFeedback({});
      const result = await saveOnboardingLayoutAction(draft.layout);
      if (result.error) {
        setFeedback({ error: result.error });
        return;
      }
      goNext();
    });
  };

  const handlePublish = () => {
    startTransition(async () => {
      setFeedback({});
      const result = await publishOnboardingProfileAction({
        username: draft.username,
        displayName: draft.displayName.trim() || draft.username,
      });
      if (result.error) {
        setFeedback({ error: result.error });
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    });
  };

  if (step === 1) {
    return (
      <WizardShell
        step={1}
        title="Choose your username"
        description="This becomes your public cried.bio link."
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="wizard-username" className={labelClassName}>Username</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-500">{SITE_HOST}/</span>
              <input
                id="wizard-username"
                value={draft.username}
                onChange={(e) => setDraft((prev) => ({ ...prev, username: e.target.value.toLowerCase() }))}
                placeholder="yourname"
                pattern="[a-z0-9_]{3,20}"
                className={inputClassName}
              />
            </div>
          </div>
          <div>
            <label htmlFor="wizard-display-name" className={labelClassName}>Display name</label>
            <input
              id="wizard-display-name"
              value={draft.displayName}
              onChange={(e) => setDraft((prev) => ({ ...prev, displayName: e.target.value }))}
              placeholder="Your Name"
              className={inputClassName}
            />
          </div>
        </div>
        <FormFeedback error={feedback.error} success={feedback.success} />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleUsernameNext}
            disabled={isPending || !draft.username.trim()}
            className={buttonPrimaryClassName}
          >
            {isPending ? "Checking..." : "Continue"}
          </button>
        </div>
      </WizardShell>
    );
  }

  if (step === 2) {
    return (
      <WizardShell
        step={2}
        title="Upload your avatar"
        description="Add a photo so people recognize you. You can change this later."
      >
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.08] bg-[#0f0f0f]">
            {avatarPreview ? (
              <Image src={avatarPreview} alt="" width={96} height={96} className="h-full w-full object-cover" unoptimized />
            ) : (
              <span className="text-2xl font-semibold text-neutral-600">
                {(draft.displayName || draft.username || "?").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <label className={labelClassName}>Profile photo</label>
            <input
              key={avatarInputKey}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={avatarUploading}
              onChange={(e) => avatarCrop.open(e.target.files?.[0])}
              className={fileInputClassName}
            />
            <p className="mt-2 text-xs text-neutral-600">JPEG, PNG, WebP, or GIF — max 5 MB.</p>
          </div>
        </div>
        <FormFeedback error={feedback.error} success={feedback.success} />
        {avatarCrop.dialog}
        <div className="flex justify-between gap-3">
          <button type="button" onClick={goBack} className={buttonSecondaryClassName}>Back</button>
          <div className="flex gap-3">
            <button type="button" onClick={goNext} className={buttonSecondaryClassName}>Skip for now</button>
            <button type="button" onClick={goNext} disabled={avatarUploading} className={buttonPrimaryClassName}>
              Continue
            </button>
          </div>
        </div>
      </WizardShell>
    );
  }

  if (step === 3) {
    return (
      <WizardShell
        step={3}
        title="Add social links"
        description="Connect your profiles so visitors can find you elsewhere."
      >
        {addedLinks.length > 0 ? (
          <ul className="space-y-2">
            {addedLinks.map((link) => (
              <li
                key={link.id}
                className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-[#0f0f0f] px-3 py-2"
              >
                <LinkIcon platform={link.icon} size={20} />
                <span className="truncate text-sm text-white">{link.title}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {!socialPlatform ? (
          <div className="space-y-3">
            <p className="text-sm text-neutral-500">Pick a platform to add</p>
            <PlatformIconGrid onSelect={setSocialPlatform} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-[#0f0f0f] p-3">
              <LinkIcon platform={socialPlatform} size={22} />
              <span className="font-medium text-white">{getPlatform(socialPlatform)?.name}</span>
              <button
                type="button"
                onClick={() => setSocialPlatform(null)}
                className="ml-auto text-xs text-neutral-500 hover:text-white"
              >
                Change
              </button>
            </div>
            <div>
              <label htmlFor="wizard-social-input" className={labelClassName}>
                {getPlatform(socialPlatform)?.hint}
              </label>
              <input
                id="wizard-social-input"
                value={socialInput}
                onChange={(e) => setSocialInput(e.target.value)}
                placeholder={getPlatform(socialPlatform)?.placeholder}
                className={inputClassName}
              />
            </div>
            <button
              type="button"
              onClick={handleAddSocialLink}
              disabled={isPending || !socialInput.trim()}
              className={buttonPrimaryClassName}
            >
              {isPending ? "Adding..." : "Add link"}
            </button>
          </div>
        )}

        <FormFeedback error={feedback.error} success={feedback.success} />
        <div className="flex justify-between gap-3">
          <button type="button" onClick={goBack} className={buttonSecondaryClassName}>Back</button>
          <div className="flex gap-3">
            <button type="button" onClick={goNext} className={buttonSecondaryClassName}>Skip for now</button>
            <button type="button" onClick={goNext} className={buttonPrimaryClassName}>Continue</button>
          </div>
        </div>
      </WizardShell>
    );
  }

  if (step === 4) {
    return (
      <WizardShell
        step={4}
        title="Choose a layout"
        description="Pick how your public profile is structured. Customize more later."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {WIZARD_LAYOUTS.map((layout) => {
            const isActive = draft.layout === layout.value;
            return (
              <button
                key={layout.value}
                type="button"
                onClick={() => setDraft((prev) => ({ ...prev, layout: layout.value }))}
                className={`rounded-xl border p-4 text-left transition-all ${
                  isActive
                    ? "border-[#fafafa]/50 bg-[#fafafa]/[0.06] ring-1 ring-[#fafafa]/30"
                    : "border-white/[0.06] bg-[#0f0f0f] hover:border-white/10"
                }`}
              >
                <LayoutPreview layout={layout.value} />
                <p className="mt-3 text-sm font-medium text-white">{layout.label}</p>
                <p className="mt-0.5 text-xs text-neutral-500">{layout.description}</p>
              </button>
            );
          })}
        </div>
        <FormFeedback error={feedback.error} />
        <div className="flex justify-between gap-3">
          <button type="button" onClick={goBack} className={buttonSecondaryClassName}>Back</button>
          <button
            type="button"
            onClick={handleLayoutNext}
            disabled={isPending}
            className={buttonPrimaryClassName}
          >
            {isPending ? "Saving..." : "Continue"}
          </button>
        </div>
      </WizardShell>
    );
  }

  return (
    <WizardShell
      step={5}
      title="Publish your profile"
      description="Review your setup and go live on cried.bio."
    >
      <div className="space-y-4 rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-white/[0.08] bg-[#141414]">
            {avatarPreview ? (
              <Image src={avatarPreview} alt="" width={56} height={56} className="h-full w-full object-cover" unoptimized />
            ) : (
              <span className="text-lg font-semibold text-neutral-500">
                {(draft.displayName || draft.username).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-medium text-white">{draft.displayName || draft.username}</p>
            <p className="font-mono text-xs text-neutral-500">
              {SITE_HOST}/{draft.username}
            </p>
          </div>
        </div>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-neutral-500">Layout</dt>
            <dd className="text-white capitalize">{draft.layout}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Social links</dt>
            <dd className="text-white">{addedLinks.length}</dd>
          </div>
        </dl>
      </div>
      <FormFeedback error={feedback.error} />
      <div className="flex justify-between gap-3">
        <button type="button" onClick={goBack} className={buttonSecondaryClassName}>Back</button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={isPending}
          className={buttonPrimaryClassName}
        >
          {isPending ? "Publishing..." : "Publish profile"}
        </button>
      </div>
    </WizardShell>
  );
}
