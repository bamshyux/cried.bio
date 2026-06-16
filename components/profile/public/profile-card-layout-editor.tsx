"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { updateCardLayoutAction } from "@/app/actions/settings";
import { clampCardLayout, getCardLayoutStyle } from "@/lib/settings";
import type { ProfileEmbed } from "@/lib/types/embed";
import type { ProfileSettings } from "@/lib/types/settings";
import { ProfileEditWidgetsPanel } from "./profile-edit-widgets-panel";

export type CardLayoutState = {
  offsetX: number;
  offsetY: number;
  width: number;
};

function layoutFromSettings(settings: ProfileSettings): CardLayoutState {
  return {
    offsetX: settings.card_offset_x,
    offsetY: settings.card_offset_y,
    width: settings.card_width,
  };
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
    <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2">
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

import { ProfileParallaxCard } from "./profile-parallax";

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
  }, [settings.updated_at, settings.card_offset_x, settings.card_offset_y, settings.card_width]);

  const dirty =
    layout.offsetX !== savedLayout.offsetX ||
    layout.offsetY !== savedLayout.offsetY ||
    layout.width !== savedLayout.width;

  const handleSave = useCallback(() => {
    startSave(async () => {
      setStatus(null);
      const patch = clampCardLayout({
        card_offset_x: layout.offsetX,
        card_offset_y: layout.offsetY,
        card_width: layout.width,
      });
      const result = await updateCardLayoutAction(patch);
      if (result.error) {
        setStatus(result.error);
        return;
      }
      const next = {
        offsetX: patch.card_offset_x,
        offsetY: patch.card_offset_y,
        width: patch.card_width,
      };
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

  const clampLayout = useCallback((next: CardLayoutState) => {
    const clamped = clampCardLayout({
      card_offset_x: next.offsetX,
      card_offset_y: next.offsetY,
      card_width: next.width,
    });
    return {
      offsetX: clamped.card_offset_x,
      offsetY: clamped.card_offset_y,
      width: clamped.card_width,
    };
  }, []);

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

  const onDragMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    setLayout((prev) =>
      clampLayout({
        ...prev,
        offsetX: drag.originX + (e.clientX - drag.startX),
        offsetY: drag.originY + (e.clientY - drag.startY),
      }),
    );
  }, [clampLayout]);

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

  const wrapperStyle = {
    width: `${layout.width}%`,
    maxWidth: "100%",
    transform: `translate(${layout.offsetX}px, ${layout.offsetY}px)`,
  };

  if (!isOwner) {
    return (
      <div className="mx-auto w-full" style={getCardLayoutStyle(settings)}>
        <ProfileParallaxCard enabled={!!parallaxEnabled}>
          {children}
        </ProfileParallaxCard>
      </div>
    );
  }

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-16 z-30 flex flex-col items-center gap-2 px-4 sm:top-[4.5rem]">
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
        {editMode && (
          <p className="pointer-events-none max-w-sm text-center text-[10px] text-neutral-500">
            Drag the card to move · drag the right edge to resize width
          </p>
        )}
        {editMode && (
          <ProfileEditWidgetsPanel settings={settings} embeds={embeds} username={username} />
        )}
      </div>

      <div
        ref={containerRef}
        data-card-editor-root=""
        className={`relative mx-auto w-full ${editMode ? "group/card-edit" : ""}`}
        style={wrapperStyle}
      >
        {editMode && (
          <>
            <div
              className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] border-2 border-dashed border-[var(--bf-accent)]/60"
              style={{ borderRadius: settings.border_radius }}
            />
            <div
              onPointerDown={onDragStart}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onPointerCancel={onDragEnd}
              className="absolute -bottom-10 left-1/2 z-20 flex -translate-x-1/2 cursor-grab touch-none items-center gap-2 rounded-full border border-white/15 bg-black/70 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-neutral-300 backdrop-blur-md active:cursor-grabbing"
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
                e.preventDefault();
                e.stopPropagation();
                const parent = containerRef.current?.parentElement;
                if (!parent) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                const start = {
                  startX: e.clientX,
                  startWidth: layout.width,
                  containerWidth: parent.clientWidth,
                };
                const target = e.currentTarget;
                const move = (ev: PointerEvent) => handleHorizontalResize(ev, start);
                const up = () => {
                  target.removeEventListener("pointermove", move);
                  target.removeEventListener("pointerup", up);
                };
                target.addEventListener("pointermove", move);
                target.addEventListener("pointerup", up);
              }}
              className="absolute -right-1 top-1/2 z-20 h-10 w-2 -translate-y-1/2 touch-none rounded-full bg-[var(--bf-accent)]/80"
              style={{ cursor: "ew-resize" }}
            />
            <div
              role="presentation"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const parent = containerRef.current?.parentElement;
                if (!parent) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                const start = {
                  startX: e.clientX,
                  startWidth: layout.width,
                  containerWidth: parent.clientWidth,
                };
                const target = e.currentTarget;
                const move = (ev: PointerEvent) => handleHorizontalResize(ev, start);
                const up = () => {
                  target.removeEventListener("pointermove", move);
                  target.removeEventListener("pointerup", up);
                };
                target.addEventListener("pointermove", move);
                target.addEventListener("pointerup", up);
              }}
              className="absolute -bottom-1 -right-1 z-20 h-4 w-4 touch-none rounded-sm bg-[var(--bf-accent)]/80"
              style={{ cursor: "nwse-resize" }}
            />
          </>
        )}
        <ProfileParallaxCard enabled={!!parallaxEnabled && !editMode}>
          {children}
        </ProfileParallaxCard>
      </div>
    </>
  );
}
