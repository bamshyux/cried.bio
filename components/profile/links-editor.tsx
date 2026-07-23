"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createLinkAction,
  createSocialLinkAction,
  deleteLinkAction,
  reorderLinksAction,
  updateLinkAction,
} from "@/app/actions/links";
import { updateSettingsAction } from "@/app/actions/settings";
import { LinkIcon, PlatformIconGrid } from "@/components/icons/social-icons";
import { buildLinkIconProps } from "@/lib/link-icon-effects";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  ColorField,
  FormFeedback,
  inputClassName,
  labelClassName,
  PageHeader,
  SliderField,
  ToggleField,
} from "@/components/dashboard/form-fields";
import { LINK_ANIMATION_OPTIONS, LINKS_BUTTON_STYLE_OPTIONS, LINKS_SPACING_OPTIONS } from "@/lib/settings";
import { isCustomLinkIcon, LINKS_ICON_SIZE_MAX, LINKS_ICON_SIZE_MIN } from "@/lib/links";
import { ProfileLinkButton, SocialIconOnlyRow, SocialIconRow } from "@/components/profile/public/profile-links";
import { uploadLinkIconToStorage } from "@/lib/uploads/link-icon-client";
import { getPlatform, type SocialPlatformId } from "@/lib/social-platforms";
import { useSettingsRefresh } from "@/components/dashboard/use-settings-refresh";
import type { LinkFormState, ProfileLink } from "@/lib/types/link";
import type { ProfileSettings, SettingsFormState } from "@/lib/types/settings";

const initial: LinkFormState = {};
const settingsInitial: SettingsFormState = {};

const fileInputClassName =
  "block w-full text-sm text-neutral-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#fafafa] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#090909]";

function readBackgroundOpacity(color: string | null | undefined): number {
  if (!color) return 5;
  const match = color.match(/rgba?\([^)]*,\s*([\d.]+)\s*\)/);
  if (!match) return 5;
  const alpha = parseFloat(match[1] ?? "");
  return Number.isFinite(alpha) ? Math.min(100, Math.max(0, Math.round(alpha * 100))) : 5;
}

function LinksDisplayPreview({
  settings,
  links,
  contentPage,
}: {
  settings: ProfileSettings;
  links: ProfileLink[];
  contentPage: boolean;
}) {
  const first = links[0];
  const sample: ProfileLink = {
    id: "preview",
    profile_id: "preview",
    title: first?.title ?? (contentPage ? "cried.bio" : "My Website"),
    url: first?.url ?? "https://cried.bio",
    icon: first?.icon ?? "link",
    color: first?.color ?? settings.text_color,
    background_color: first?.background_color ?? "rgba(255,255,255,0.05)",
    animation: "none",
    is_featured: false,
    sort_order: 0,
    created_at: new Date().toISOString(),
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Live preview</p>
      <div className="mx-auto max-w-sm rounded-xl border border-white/[0.06] bg-[#050505] p-4">
        {settings.links_style === "icons" ? (
          <SocialIconRow links={[sample, ...(links[1] ? [links[1]] : [])]} settings={settings} profileId="preview" />
        ) : settings.links_style === "icons_only" ? (
          <SocialIconOnlyRow links={[sample]} settings={settings} profileId="preview" />
        ) : (
          <ProfileLinkButton link={sample} settings={settings} profileId="preview" />
        )}
      </div>
      <p className="mt-3 text-xs text-neutral-600">Preview uses your saved settings and first link as sample.</p>
    </div>
  );
}

function LinkBackgroundField({
  defaultOpacity,
}: {
  defaultOpacity: number;
}) {
  const [opacity, setOpacity] = useState(defaultOpacity);

  return (
    <div>
      <SliderField
        name="link_bg_opacity_display"
        label="Button background"
        min={0}
        max={100}
        value={opacity}
        onChange={setOpacity}
        unit="%"
      />
      <input type="hidden" name="background_color" value={`rgba(255,255,255,${(opacity / 100).toFixed(2)})`} />
      <p className="mt-1 text-xs text-neutral-600">Background strength for this link when using filled buttons.</p>
    </div>
  );
}

function CustomLinkIconField({
  icon,
  onIconChange,
  onUploadingChange,
}: {
  icon: string;
  onIconChange: (icon: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [uploadPending, setUploadPending] = useState(false);
  const [uploadError, setUploadError] = useState<string>();
  const [fileInputKey, setFileInputKey] = useState(0);

  useEffect(() => {
    onUploadingChange?.(uploadPending);
  }, [uploadPending, onUploadingChange]);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;

    setUploadPending(true);
    setUploadError(undefined);

    try {
      const url = await uploadLinkIconToStorage(file);
      onIconChange(url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploadPending(false);
      setFileInputKey((key) => key + 1);
    }
  };

  return (
    <div>
      <label className={labelClassName}>Icon</label>
      <div className="flex items-center gap-4 rounded-lg border border-white/[0.06] bg-[#0f0f0f] p-4">
        <LinkIcon platform={icon} size={32} />
        <div className="min-w-0 flex-1 space-y-2">
          <input
            key={fileInputKey}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploadPending}
            onChange={(e) => handleUpload(e.target.files?.[0])}
            className={fileInputClassName}
          />
          <p className="text-xs text-neutral-600">JPEG, PNG, WebP, or GIF — max 2 MB. Leave empty for the default link icon.</p>
          {isCustomLinkIcon(icon) ? (
            <button
              type="button"
              onClick={() => onIconChange("link")}
              className="text-xs font-medium text-neutral-500 transition-colors hover:text-white"
            >
              Remove custom icon
            </button>
          ) : null}
          {uploadError ? <p className="text-xs text-red-400">{uploadError}</p> : null}
          {uploadPending ? <p className="text-xs text-neutral-500">Uploading icon...</p> : null}
        </div>
      </div>
    </div>
  );
}

function AddSocialForm({ onDone, pageId }: { onDone: () => void; pageId?: string }) {
  const [state, formAction, isPending] = useActionState(createSocialLinkAction, initial);
  const [platform, setPlatform] = useState<SocialPlatformId | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onDone();
    }
  }, [state.success, router, onDone]);

  if (!platform) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-neutral-500">Choose a platform</p>
        <PlatformIconGrid onSelect={setPlatform} />
        <button type="button" onClick={onDone} className={buttonSecondaryClassName}>Cancel</button>
      </div>
    );
  }

  const p = getPlatform(platform)!;

  return (
    <form action={formAction} className="space-y-4">
      {pageId ? <input type="hidden" name="_page_id" value={pageId} /> : null}
      <input type="hidden" name="platform" value={platform} />
      <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-[#0f0f0f] p-3">
        <LinkIcon platform={platform} size={22} />
        <span className="font-medium text-white">{p.name}</span>
        <button type="button" onClick={() => setPlatform(null)} className="ml-auto text-xs text-neutral-500 hover:text-white">
          Change
        </button>
      </div>
      <div>
        <label htmlFor="social-input" className={labelClassName}>{p.hint}</label>
        <input id="social-input" name="input" type="text" required placeholder={p.placeholder} className={inputClassName} />
      </div>
      <FormFeedback error={state.error} success={state.success} />
      <div className="flex gap-3">
        <button type="submit" disabled={isPending} className={buttonPrimaryClassName}>
          {isPending ? "Adding..." : "Add social link"}
        </button>
        <button type="button" onClick={onDone} className={buttonSecondaryClassName}>Cancel</button>
      </div>
    </form>
  );
}

function AddCustomLinkForm({ onDone, pageId }: { onDone: () => void; pageId?: string }) {
  const [state, formAction, isPending] = useActionState(createLinkAction, initial);
  const [icon, setIcon] = useState("link");
  const [iconUploading, setIconUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onDone();
    }
  }, [state.success, router, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      {pageId ? <input type="hidden" name="_page_id" value={pageId} /> : null}
      <input type="hidden" name="icon" value={icon} />
      <CustomLinkIconField icon={icon} onIconChange={setIcon} onUploadingChange={setIconUploading} />
      <div>
        <label htmlFor="custom-title" className={labelClassName}>Title</label>
        <input id="custom-title" name="title" type="text" required placeholder="My Website" className={inputClassName} />
      </div>
      <div>
        <label htmlFor="custom-url" className={labelClassName}>URL</label>
        <input id="custom-url" name="url" type="url" required placeholder="https://example.com" className={inputClassName} />
      </div>
      <ColorField name="color" label="Text color" defaultValue="#ffffff" />
      <LinkBackgroundField defaultOpacity={5} />
      <FormFeedback error={state.error} success={state.success} />
      <div className="flex gap-3">
        <button type="submit" disabled={isPending || iconUploading} className={buttonPrimaryClassName}>
          {isPending ? "Adding..." : "Add custom link"}
        </button>
        <button type="button" onClick={onDone} className={buttonSecondaryClassName}>Cancel</button>
      </div>
    </form>
  );
}

function LinkRow({
  link,
  index,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  pageId,
  allowFeatured = false,
}: {
  link: ProfileLink;
  index: number;
  onDragStart: (i: number) => void;
  onDragOver: (e: React.DragEvent, i: number) => void;
  onDrop: (i: number) => void;
  isDragging: boolean;
  pageId?: string;
  allowFeatured?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction, isSaving] = useActionState(updateLinkAction.bind(null, link.id), initial);
  const [icon, setIcon] = useState(link.icon);
  const [iconUploading, setIconUploading] = useState(false);

  useEffect(() => {
    if (state.success) {
      router.refresh();
      setIsEditing(false);
    }
  }, [state.success, router]);

  const handleDelete = () => {
    startTransition(async () => {
      await deleteLinkAction(link.id, pageId);
      router.refresh();
    });
  };

  if (isEditing) {
    return (
      <form action={formAction} className="space-y-4 rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4">
        {pageId ? <input type="hidden" name="_page_id" value={pageId} /> : null}
        <input type="hidden" name="icon" value={icon} />
        <CustomLinkIconField icon={icon} onIconChange={setIcon} onUploadingChange={setIconUploading} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClassName}>Title</label>
            <input name="title" type="text" required defaultValue={link.title} className={inputClassName} />
          </div>
          <div>
            <label className={labelClassName}>URL</label>
            <input name="url" type="url" required defaultValue={link.url} className={inputClassName} />
          </div>
        </div>
        <ColorField name="color" label="Text color" defaultValue={link.color ?? "#ffffff"} />
        <LinkBackgroundField defaultOpacity={readBackgroundOpacity(link.background_color)} />
        {allowFeatured ? (
          <ToggleField
            name="is_featured"
            label="Featured link"
            description="Highlight this link with accent styling at the top of your profile"
            defaultChecked={link.is_featured}
          />
        ) : (
          <input type="hidden" name="is_featured" value="false" />
        )}
        {state.error && <p className="text-sm text-red-400">{state.error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={isSaving || iconUploading} className={buttonPrimaryClassName}>Save</button>
          <button type="button" onClick={() => setIsEditing(false)} className={buttonSecondaryClassName}>Cancel</button>
        </div>
      </form>
    );
  }

  const platformName = isCustomLinkIcon(link.icon)
    ? "Custom icon"
    : getPlatform(link.icon)?.name ?? link.title;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
      className={`flex cursor-grab items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0f0f0f] p-4 active:cursor-grabbing ${isDragging ? "opacity-40" : ""}`}
    >
      <span className="text-neutral-600 select-none" aria-hidden>⠿</span>
      <LinkIcon platform={link.icon} size={20} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">
          {link.title}
          {link.is_featured ? (
            <span className="ml-2 rounded-md bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-300">
              Featured
            </span>
          ) : null}
        </p>
        <p className="truncate text-xs text-neutral-500">{platformName} · {link.url}</p>
      </div>
      <div className="flex gap-1">
        <button type="button" onClick={() => { setIcon(link.icon); setIsEditing(true); }} className="rounded-lg border border-white/[0.06] px-3 py-1 text-xs text-neutral-400 hover:text-white">Edit</button>
        <button type="button" disabled={isPending} onClick={handleDelete} className="rounded-lg border border-red-500/20 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10">Delete</button>
      </div>
    </div>
  );
}

export function LinksEditor({
  links: initialLinks,
  settings,
  pageId,
  contentPage = false,
}: {
  links: ProfileLink[];
  settings: ProfileSettings;
  pageId?: string;
  contentPage?: boolean;
}) {
  const router = useRouter();
  const [links, setLinks] = useState(initialLinks);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [addMode, setAddMode] = useState<"none" | "social" | "custom">("none");
  const [linkSettingsState, linkSettingsAction, linkSettingsPending] = useActionState(
    updateSettingsAction,
    settingsInitial,
  );

  useSettingsRefresh(linkSettingsState, linkSettingsPending);

  useEffect(() => {
    setLinks(initialLinks);
  }, [initialLinks]);

  const handleDrop = (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      return;
    }
    const reordered = [...links];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    setLinks(reordered);
    setDragIndex(null);
    startTransition(async () => {
      await reorderLinksAction(reordered.map((l) => l.id), pageId);
      router.refresh();
    });
  };

  return (
    <>
      <PageHeader
        title="Links"
        description={
          contentPage
            ? "Add links that appear on this page."
            : "Social platforms and custom links with drag-and-drop reorder."
        }
      />

      <div className="bf-card mb-6 p-5">
        <h2 className="mb-4 text-sm font-medium text-white">Link display</h2>
        <form action={linkSettingsAction} className="space-y-6">
          <input type="hidden" name="_section" value="links" />
          {pageId ? <input type="hidden" name="_page_id" value={pageId} /> : null}

          <LinksDisplayPreview settings={settings} links={links} contentPage={contentPage} />

          <div>
            <label htmlFor="links_style" className={labelClassName}>Link style</label>
            <select id="links_style" name="links_style" className={inputClassName} defaultValue={settings.links_style}>
              <option value="buttons">Full buttons</option>
              <option value="icons">Icon boxes</option>
              <option value="icons_only">Icons only</option>
            </select>
            <p className="mt-1.5 text-xs text-neutral-500">
              Full buttons show titles; icon boxes wrap icons in a tile; icons only show bare platform icons.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="links_button_style" className={labelClassName}>Button look</label>
              <select
                id="links_button_style"
                name="links_button_style"
                className={inputClassName}
                defaultValue={settings.links_button_style ?? "filled"}
              >
                {LINKS_BUTTON_STYLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} — {option.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="links_spacing" className={labelClassName}>Spacing</label>
              <select
                id="links_spacing"
                name="links_spacing"
                className={inputClassName}
                defaultValue={settings.links_spacing ?? "default"}
              >
                {LINKS_SPACING_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <SliderField
              name="links_border_radius"
              label="Corner radius"
              min={0}
              max={48}
              defaultValue={settings.links_border_radius ?? 0}
              unit="px"
            />
            <SliderField
              name="links_button_opacity"
              label="Fill strength"
              min={0}
              max={100}
              defaultValue={settings.links_button_opacity ?? 100}
              unit="%"
            />
          </div>
          <p className="-mt-3 text-xs text-neutral-600">
            Corner radius 0 uses your profile card radius. Fill strength applies to filled buttons and icon boxes.
          </p>

          <SliderField
            name="links_icon_size"
            label="Icon size"
            min={LINKS_ICON_SIZE_MIN}
            max={LINKS_ICON_SIZE_MAX}
            defaultValue={settings.links_icon_size}
            unit="px"
          />

          <div>
            <label htmlFor="link_animation" className={labelClassName}>Link animation</label>
            <select id="link_animation" name="link_animation" className={inputClassName} defaultValue={settings.link_animation}>
              {LINK_ANIMATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-white/[0.06] bg-[#0a0a0a] p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Icon effects</p>
            <p className="mb-3 text-xs text-neutral-600">
              Brand icons keep their official artwork — these add visual effects on top.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <ToggleField
                name="links_icon_glow"
                label="Icon glow"
                description="Illuminated glow on each link icon"
                defaultChecked={settings.links_icon_glow}
              />
              <ToggleField
                name="links_icon_shadow"
                label="Icon shadow"
                description="Subtle drop shadow for depth"
                defaultChecked={settings.links_icon_shadow}
              />
              <ToggleField
                name="links_icon_pulse"
                label="Icon pulse"
                description="Gentle breathing animation on icons"
                defaultChecked={settings.links_icon_pulse}
              />
              <ToggleField
                name="links_monochrome"
                label="Monochrome links"
                description={`Use text color (${settings.text_color}) for all icons`}
                defaultChecked={settings.links_monochrome}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg border border-white/[0.06] bg-[#0f0f0f] p-4">
              <LinkIcon {...buildLinkIconProps("roblox", settings, settings.links_icon_size)} />
              <LinkIcon {...buildLinkIconProps("discord", settings, settings.links_icon_size)} />
              <LinkIcon {...buildLinkIconProps("youtube", settings, settings.links_icon_size)} />
              <span className="text-xs text-neutral-600">Icon preview</span>
            </div>
          </div>

          <ToggleField
            name="links_show_hostname"
            label="Show link URL"
            description="Always show the hostname on full buttons (otherwise only on hover)"
            defaultChecked={settings.links_show_hostname ?? false}
          />

          <FormFeedback error={linkSettingsState.error} success={linkSettingsState.success} />
          <button type="submit" disabled={linkSettingsPending} className={buttonSecondaryClassName}>
            {linkSettingsPending ? "Saving..." : "Save link settings"}
          </button>
        </form>
      </div>

      {links.length > 0 && (
        <div className="mb-6 space-y-2">
          {links.map((link, index) => (
            <LinkRow
              key={link.id}
              link={link}
              index={index}
              isDragging={dragIndex === index}
              onDragStart={setDragIndex}
              onDragOver={(e, i) => { e.preventDefault(); if (dragIndex !== null && dragIndex !== i) setDragIndex(i); }}
              onDrop={handleDrop}
              pageId={pageId}
              allowFeatured={!pageId && !contentPage}
            />
          ))}
          {isPending && <p className="text-xs text-neutral-600">Saving order...</p>}
        </div>
      )}

      {links.length === 0 && addMode === "none" && (
        <p className="mb-6 text-sm text-neutral-600">No links yet. Add a social profile or custom link below.</p>
      )}

      {addMode === "none" ? (
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setAddMode("social")} className={buttonPrimaryClassName}>
            + Add Social
          </button>
          <button type="button" onClick={() => setAddMode("custom")} className={buttonSecondaryClassName}>
            + Add Custom Link
          </button>
        </div>
      ) : addMode === "social" ? (
        <div className="bf-card p-5">
          <AddSocialForm onDone={() => setAddMode("none")} pageId={pageId} />
        </div>
      ) : (
        <div className="bf-card p-5">
          <AddCustomLinkForm onDone={() => setAddMode("none")} pageId={pageId} />
        </div>
      )}
    </>
  );
}
