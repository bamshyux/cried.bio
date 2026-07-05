"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { updateCardLayoutAction } from "@/app/actions/settings";
import { CARD_LAYOUT_MIN_HEIGHT, clampCardLayout, getCardLayoutStyle } from "@/lib/settings";
import type { ProfileEmbed } from "@/lib/types/embed";
import type { ProfileSettings } from "@/lib/types/settings";
import { ProfileEditWidgetsPanel } from "./profile-edit-widgets-panel";
import { ProfileCardHeightScaler, measureProfileCardNaturalHeight } from "./profile-card-height-scaler";
import { ProfileParallaxCard } from "./profile-parallax";

export type CardLayoutState = {
  offsetX: number;
  offsetY: number;
  width: number;
  maxHeight: number;
};

function layoutFromSettings(settings: ProfileSettings): CardLayoutState {
  return {
    offsetX: settings.card_offset_x,
    offsetY: settings.card_offset_y,
    width: settings.card_width,
    maxHeight: settings.card_max_height,
  };
}

function layoutToPatch(layout: CardLayoutState) {
  return clampCardLayout({
    card_offset_x: layout.offsetX,
    card_offset_y: layout.offsetY,
    card_width: layout.width,
    card_max_height: layout.maxHeight,
  });
}

function layoutFromPatch(patch: ReturnType<typeof clampCardLayout>): CardLayoutState {
  return {
    offsetX: patch.card_offset_x,
    offsetY: patch.card_offset_y,
    width: patch.card_width,
    maxHeight: patch.card_max_height,
  };
}

function measureNaturalHeight(container: HTMLDivElement | null) {
  return measureProfileCardNaturalHeight(container);
}

function resolveResizeHeight(nextHeight: number, naturalHeight: number) {
  const clamped = Math.min(naturalHeight, Math.max(CARD_LAYOUT_MIN_HEIGHT, Math.round(nextHeight)));
  return clamped >= naturalHeight - 4 ? 0 : clamped;
}

function ProfileEditModeBar({
  active,
  dirty,
  saving,
  onToggle,
  onSave,
  onReset,
}: {
  active: boolean;
  dirty: boolean;
  saving: boolean;
  onToggle: () => void;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        onClick={onToggle}
        className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
          active
            ? "border-[var(--bf-accent)]/50 bg-[var(--bf-accent)]/15 text-white"
            : "border-white/15 bg-black/60 text-neutral-300 backdrop-blur-md hover:border-white/25 hover:text-white"
        }`}
      >
        {active ? "Exit edit mode" : "Edit profile mode"}
      </button>
      {active && (
        <>
          <button
            type="button"
            onClick={onSave}
            disabled={!dirty || saving}
            className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-300 transition-colors hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save layout"}
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={saving}
            className="rounded-full border border-white/10 bg-black/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 transition-colors hover:text-neutral-200 disabled:opacity-40"
          >
            Reset
          </button>
        </>
      )}
    </div>
  );
}

export function ProfileCardLayoutEditor({
  settings,
  isOwner,
  parallaxEnabled,
  embeds = [],
  username = "",
  children,
}: {
  settings: ProfileSettings;
  isOwner: boolean;
  parallaxEnabled?: boolean;
  embeds?: ProfileEmbed[];
  username?: string;
  children: React.ReactNode;
}) {
  const [editMode, setEditMode] = useState(false);
  const [layout, setLayout] = useState<CardLayoutState>(() => layoutFromSettings(settings));
  const [savedLayout, setSavedLayout] = useState<CardLayoutState>(() => layoutFromSettings(settings));
  const [saving, startSave] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const next = layoutFromSettings(settings);
    setLayout(next);
    setSavedLayout(next);
  }, [
    settings.updated_at,
    settings.card_offset_x,
    settings.card_offset_y,
    settings.card_width,
    settings.card_max_height,
  ]);

  const dirty =
    layout.offsetX !== savedLayout.offsetX ||
    layout.offsetY !== savedLayout.offsetY ||
    layout.width !== savedLayout.width ||
    layout.maxHeight !== savedLayout.maxHeight;

  const handleSave = useCallback(() => {
    startSave(async () => {
      setStatus(null);
      const patch = layoutToPatch(layout);
      const result = await updateCardLayoutAction(patch);
      if (result.error) {
        setStatus(result.error);
        return;
      }
      const next = layoutFromPatch(patch);
      setLayout(next);
      setSavedLayout(next);
      setStatus("Layout saved");
      setEditMode(false);
    });
  }, [layout]);

  const handleReset = useCallback(() => {
    setLayout(savedLayout);
  }, [savedLayout]);

  const handleToggle = useCallback(() => {
    setEditMode((active) => {
      if (active) setLayout(savedLayout);
      return !active;
    });
    setStatus(null);
  }, [savedLayout]);

  const clampLayout = useCallback((next: CardLayoutState) => layoutFromPatch(layoutToPatch(next)), []);

  const onDragStart = useCallback(
    (e: React.PointerEvent) => {
      if (!editMode) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: layout.offsetX,
        originY: layout.offsetY,
      };
    },
    [editMode, layout.offsetX, layout.offsetY],
  );

  const onDragMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      setLayout((prev) =>
        clampLayout({
          ...prev,
          offsetX: drag.originX + (e.clientX - drag.startX),
          offsetY: drag.originY + (e.clientY - drag.startY),
        }),
      );
    },
    [clampLayout],
  );

  const onDragEnd = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  const handleHorizontalResize = useCallback(
    (e: PointerEvent, start: { startX: number; startWidth: number; containerWidth: number }) => {
      const deltaPx = e.clientX - start.startX;
      const deltaPercent = (deltaPx / Math.max(start.containerWidth, 1)) * 100;
      setLayout((prev) => clampLayout({ ...prev, width: start.startWidth + deltaPercent }));
    },
    [clampLayout],
  );

  const handleVerticalResize = useCallback(
    (
      e: PointerEvent,
      start: { startY: number; startHeight: number; naturalHeight: number },
    ) => {
      const nextHeight = start.startHeight + (e.clientY - start.startY);
      const maxHeight = resolveResizeHeight(nextHeight, start.naturalHeight);
      setLayout((prev) => clampLayout({ ...prev, maxHeight }));
    },
    [clampLayout],
  );

  const handleCornerResize = useCallback(
    (
      e: PointerEvent,
      start: {
        startX: number;
        startY: number;
        startWidth: number;
        startHeight: number;
        naturalHeight: number;
        containerWidth: number;
      },
    ) => {
      const deltaPx = e.clientX - start.startX;
      const deltaPercent = (deltaPx / Math.max(start.containerWidth, 1)) * 100;
      const nextHeight = start.startHeight + (e.clientY - start.startY);
      const maxHeight = resolveResizeHeight(nextHeight, start.naturalHeight);
      setLayout((prev) =>
        clampLayout({
          ...prev,
          width: start.startWidth + deltaPercent,
          maxHeight,
        }),
      );
    },
    [clampLayout],
  );

  const bindResizeListeners = useCallback((target: HTMLDivElement, move: (event: PointerEvent) => void) => {
    const moveHandler = (ev: PointerEvent) => move(ev);
    const upHandler = () => {
      target.removeEventListener("pointermove", moveHandler);
      target.removeEventListener("pointerup", upHandler);
      target.removeEventListener("pointercancel", upHandler);
    };
    target.addEventListener("pointermove", moveHandler);
    target.addEventListener("pointerup", upHandler);
    target.addEventListener("pointercancel", upHandler);
  }, []);

  const startPointerResize = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, move: (event: PointerEvent) => void) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      bindResizeListeners(e.currentTarget, move);
    },
    [bindResizeListeners],
  );

  const clipOverflow = layout.maxHeight > 0 && !parallaxEnabled;

  const wrapperStyle = {
    ...getCardLayoutStyle({
      ...settings,
      card_offset_x: layout.offsetX,
      card_offset_y: layout.offsetY,
      card_width: layout.width,
      card_max_height: layout.maxHeight,
    }),
    ...(clipOverflow ? { height: layout.maxHeight, overflow: "hidden" as const } : { overflow: "visible" as const }),
  };

  if (!isOwner) {
    const viewClipOverflow = settings.card_max_height > 0 && !parallaxEnabled;
    const viewStyle = {
      ...getCardLayoutStyle(settings),
      ...(viewClipOverflow
        ? { height: settings.card_max_height, overflow: "hidden" as const }
        : { overflow: "visible" as const }),
    };

    return (
      <div className="mx-auto w-full overflow-visible" style={viewStyle}>
        <ProfileCardHeightScaler maxHeight={settings.card_max_height} parallaxEnabled={parallaxEnabled}>
          <ProfileParallaxCard enabled={!!parallaxEnabled}>{children}</ProfileParallaxCard>
        </ProfileCardHeightScaler>
      </div>
    );
  }

  return (
    <>
      <div className="pointer-events-none fixed right-5 top-4 z-30 flex max-w-[min(100vw-2.5rem,20rem)] flex-col items-end gap-2 sm:right-8 sm:top-5">
        <ProfileEditModeBar
          active={editMode}
          dirty={dirty}
          saving={saving}
          onToggle={handleToggle}
          onSave={handleSave}
          onReset={handleReset}
        />
        {status && (
          <p className="pointer-events-none rounded-full bg-black/70 px-3 py-1 text-[10px] text-neutral-300 backdrop-blur-sm">
            {status}
          </p>
        )}
      </div>

      {editMode && (
        <p className="pointer-events-none fixed bottom-24 left-1/2 z-30 max-w-sm -translate-x-1/2 px-4 text-center text-[10px] text-neutral-500">
          Drag to move · right edge for width · bottom edge for height
        </p>
      )}

      {editMode && (
        <div className="pointer-events-none fixed right-3 top-[5.75rem] z-40 sm:right-6 sm:top-[6.25rem]">
          <ProfileEditWidgetsPanel settings={settings} embeds={embeds} username={username} />
        </div>
      )}

      <div
        ref={containerRef}
        data-card-editor-root=""
        className={`relative mx-auto w-full overflow-visible ${editMode ? "group/card-edit" : ""}`}
        style={wrapperStyle}
      >
        {editMode && (
          <>
            <div
              className="pointer-events-none absolute inset-0 z-10 box-border rounded-[inherit] border-2 border-dashed border-[var(--bf-accent)]/60"
              style={{ borderRadius: settings.border_radius }}
            />
            <div
              onPointerDown={onDragStart}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onPointerCancel={onDragEnd}
              className="bf-card-editor-handle bf-card-editor-handle--grab absolute -bottom-10 left-1/2 z-20 flex -translate-x-1/2 touch-none items-center gap-2 rounded-full border border-white/15 bg-black/70 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-neutral-300 backdrop-blur-md"
            >
              <span className="inline-flex gap-0.5" aria-hidden>
                <span className="h-1 w-1 rounded-full bg-neutral-500" />
                <span className="h-1 w-1 rounded-full bg-neutral-500" />
                <span className="h-1 w-1 rounded-full bg-neutral-500" />
              </span>
              Move
            </div>
            <div
              role="presentation"
              onPointerDown={(e) => {
                const parent = containerRef.current?.parentElement;
                if (!parent) return;
                const start = {
                  startX: e.clientX,
                  startWidth: layout.width,
                  containerWidth: parent.clientWidth,
                };
                startPointerResize(e, (ev) => handleHorizontalResize(ev, start));
              }}
              className="bf-card-editor-handle bf-card-editor-handle--ew absolute -right-1 top-1/2 z-20 h-16 w-3 -translate-y-1/2 touch-none rounded-full bg-[var(--bf-accent)]/80"
            />
            <div
              role="presentation"
              onPointerDown={(e) => {
                const naturalHeight = measureNaturalHeight(containerRef.current);
                const currentHeight = layout.maxHeight > 0 ? layout.maxHeight : naturalHeight;
                const start = {
                  startY: e.clientY,
                  startHeight: currentHeight,
                  naturalHeight,
                };
                startPointerResize(e, (ev) => handleVerticalResize(ev, start));
              }}
              className="bf-card-editor-handle bf-card-editor-handle--ns absolute -bottom-1 left-1/2 z-20 h-3 w-16 -translate-x-1/2 touch-none rounded-full bg-[var(--bf-accent)]/80"
            />
            <div
              role="presentation"
              onPointerDown={(e) => {
                const parent = containerRef.current?.parentElement;
                if (!parent) return;
                const naturalHeight = measureNaturalHeight(containerRef.current);
                const currentHeight = layout.maxHeight > 0 ? layout.maxHeight : naturalHeight;
                const start = {
                  startX: e.clientX,
                  startY: e.clientY,
                  startWidth: layout.width,
                  startHeight: currentHeight,
                  naturalHeight,
                  containerWidth: parent.clientWidth,
                };
                startPointerResize(e, (ev) => handleCornerResize(ev, start));
              }}
              className="bf-card-editor-handle bf-card-editor-handle--nwse absolute -bottom-1 -right-1 z-20 h-5 w-5 touch-none rounded-sm bg-[var(--bf-accent)]/80"
            />
          </>
        )}
        <ProfileCardHeightScaler maxHeight={layout.maxHeight} parallaxEnabled={parallaxEnabled}>
          <ProfileParallaxCard enabled={!!parallaxEnabled && !editMode}>{children}</ProfileParallaxCard>
        </ProfileCardHeightScaler>
      </div>
    </>
  );
}
