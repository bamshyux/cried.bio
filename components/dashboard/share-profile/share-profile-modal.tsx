"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { IconExternal, IconShare } from "@/components/icons/dashboard-icons";
import { formatPublicProfileDisplay } from "@/lib/profile/public-profile-url";
import {
  ShareIconDiscord,
  ShareIconFacebook,
  ShareIconInstagram,
  ShareIconReddit,
  ShareIconSnapchat,
  ShareIconTelegram,
  ShareIconWhatsapp,
  ShareIconX,
} from "@/components/dashboard/share-profile/share-social-icons";

type ShareProfileModalProps = {
  open: boolean;
  onClose: () => void;
  username: string;
  profileUrl: string;
};

type ToastState = { message: string; id: number } | null;

const QR_SIZE = 196;
const QR_SIZE_ENLARGED = 300;

function shareMessage(profileUrl: string): string {
  return `Check out my cried.bio profile: ${profileUrl}`;
}

export function ShareProfileModal({
  open,
  onClose,
  username,
  profileUrl,
}: ShareProfileModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enlargedCanvasRef = useRef<HTMLCanvasElement>(null);
  const [enlarged, setEnlarged] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [qrReady, setQrReady] = useState(false);
  const [mounted, setMounted] = useState(false);

  const displayUrl = formatPublicProfileDisplay(username);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = useCallback((message: string) => {
    const id = Date.now();
    setToast({ message, id });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 2600);
  }, []);

  const renderQr = useCallback(
    async (canvas: HTMLCanvasElement | null, size: number) => {
      if (!canvas) return;
      await QRCode.toCanvas(canvas, profileUrl, {
        width: size,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#090909", light: "#ffffff" },
      });
    },
    [profileUrl],
  );

  useEffect(() => {
    if (!open) {
      setEnlarged(false);
      setQrReady(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await renderQr(canvasRef.current, QR_SIZE);
        if (!cancelled) setQrReady(true);
      } catch {
        if (!cancelled) showToast("Could not generate QR code.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, profileUrl, renderQr, showToast]);

  useEffect(() => {
    if (!open || !enlarged) return;

    void renderQr(enlargedCanvasRef.current, QR_SIZE_ENLARGED);
  }, [open, enlarged, renderQr]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (enlarged) {
          setEnlarged(false);
        } else {
          onClose();
        }
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, enlarged, onClose]);

  const copyText = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage);
    } catch {
      showToast("Copy failed. Try selecting the link manually.");
    }
  };

  const copyProfileUrl = () => void copyText(profileUrl, "Profile URL copied!");

  const copyQrImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("blob");

      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        showToast("QR code copied to clipboard!");
        return;
      }

      throw new Error("unsupported");
    } catch {
      showToast("Image copy is not supported in this browser.");
    }
  };

  const downloadQr = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `cried-bio-${username}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    showToast("QR code downloaded!");
  };

  const openShareWindow = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer,width=600,height=640");
  };

  if (!open || !mounted) return null;

  const modal = (
    <>
      <div
        className="bf-share-modal-backdrop fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        role="presentation"
        onClick={onClose}
      >
        <div
          className="bf-share-modal-panel relative flex max-h-[min(88dvh,820px)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0c0c0c] shadow-[0_24px_80px_rgba(0,0,0,0.75)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-profile-title"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/[0.04] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[var(--bf-accent)]/[0.05] blur-3xl" />

          <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-5 sm:px-6">
              <div className="min-w-0 pr-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                  Share
                </p>
                <h2 id="share-profile-title" className="mt-2 text-xl font-semibold tracking-tight text-white">
                  Share Your Profile
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                  Share your profile anywhere and let more people discover your page.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.03] p-2 text-neutral-400 transition hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white"
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setEnlarged(true)}
                  disabled={!qrReady}
                  className="bf-share-qr group relative overflow-hidden rounded-2xl border border-white/[0.1] bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition hover:scale-[1.02] hover:border-white/[0.16] disabled:cursor-wait disabled:opacity-70"
                  aria-label="Enlarge QR code"
                >
                  <canvas ref={canvasRef} className="block max-w-full rounded-xl" />
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2 text-[11px] font-medium text-white/90 opacity-0 transition group-hover:opacity-100">
                    Click to enlarge
                  </span>
                </button>

                <div className="mt-4 flex w-full items-center gap-2 rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5">
                  <p className="min-w-0 flex-1 truncate font-mono text-sm text-neutral-300">{displayUrl}</p>
                  <button
                    type="button"
                    onClick={copyProfileUrl}
                    className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#090909] transition hover:bg-[#e5e5e5]"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <QuickActionButton
                label="Open Profile"
                onClick={() => window.open(profileUrl, "_blank", "noopener,noreferrer")}
                icon={<IconExternal size={15} />}
              />
              <QuickActionButton
                label="Download QR"
                onClick={downloadQr}
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 3v12M7 11l5 5 5-5M5 21h14" />
                  </svg>
                }
              />
              <QuickActionButton
                label="Copy QR Image"
                onClick={() => void copyQrImage()}
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="12" height="12" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                }
              />
            </div>

            <div className="mt-6">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-neutral-600">
                Share to
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <ShareChip
                  label="Discord"
                  icon={<ShareIconDiscord />}
                  onClick={() => void copyText(shareMessage(profileUrl), "Copied! Paste in Discord to share.")}
                />
                <ShareChip
                  label="X"
                  icon={<ShareIconX />}
                  onClick={() =>
                    openShareWindow(
                      `https://twitter.com/intent/tweet?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent("Check out my cried.bio profile")}`,
                    )
                  }
                />
                <ShareChip
                  label="Reddit"
                  icon={<ShareIconReddit />}
                  onClick={() =>
                    openShareWindow(
                      `https://www.reddit.com/submit?url=${encodeURIComponent(profileUrl)}&title=${encodeURIComponent("My cried.bio profile")}`,
                    )
                  }
                />
                <ShareChip
                  label="Facebook"
                  icon={<ShareIconFacebook />}
                  onClick={() =>
                    openShareWindow(
                      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
                    )
                  }
                />
                <ShareChip
                  label="WhatsApp"
                  icon={<ShareIconWhatsapp />}
                  onClick={() =>
                    openShareWindow(
                      `https://wa.me/?text=${encodeURIComponent(shareMessage(profileUrl))}`,
                    )
                  }
                />
                <ShareChip
                  label="Telegram"
                  icon={<ShareIconTelegram />}
                  onClick={() =>
                    openShareWindow(
                      `https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent("Check out my cried.bio profile")}`,
                    )
                  }
                />
                <ShareChip
                  label="Instagram"
                  icon={<ShareIconInstagram />}
                  onClick={() =>
                    void copyText(profileUrl, "Copied! Paste in your Instagram bio or story.")
                  }
                />
                <ShareChip
                  label="Snapchat"
                  icon={<ShareIconSnapchat />}
                  onClick={() =>
                    void copyText(profileUrl, "Copied! Paste in Snapchat to share.")
                  }
                />
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-600">
                Current Profile
              </p>
              <p className="mt-1 font-mono text-sm text-neutral-300">{displayUrl}</p>
            </div>
            </div>
          </div>
        </div>
      </div>

      {enlarged ? (
        <div
          className="bf-share-modal-backdrop fixed inset-0 z-[210] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          role="presentation"
          onClick={() => setEnlarged(false)}
        >
          <div
            className="relative rounded-3xl border border-white/[0.12] bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <canvas ref={enlargedCanvasRef} className="block max-w-[min(80vw,320px)] rounded-2xl" />
            <button
              type="button"
              onClick={() => setEnlarged(false)}
              className="absolute -right-2 -top-2 rounded-full border border-white/[0.12] bg-[#111] p-2 text-neutral-300 transition hover:text-white"
              aria-label="Close enlarged QR code"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div
          className="bf-share-toast fixed bottom-6 left-1/2 z-[220] -translate-x-1/2 rounded-full border border-white/[0.12] bg-[#141414]/95 px-4 py-2.5 text-sm font-medium text-white shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      ) : null}
    </>
  );

  return createPortal(modal, document.body);
}

function QuickActionButton({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bf-share-action inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-neutral-200 transition hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white"
    >
      {icon}
      {label}
    </button>
  );
}

function ShareChip({
  label,
  icon,
  onClick,
  className = "",
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`bf-share-chip inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-2 py-2 text-[10px] font-medium leading-none text-neutral-300 transition hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-white sm:gap-2 sm:px-2.5 sm:text-[11px] ${className}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

export const shareProfileButtonClassName =
  "inline-flex max-w-full shrink-0 items-center gap-2.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_18px_rgba(0,0,0,0.35)] transition-all duration-200 hover:border-white/[0.2] hover:bg-white/[0.08] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_6px_24px_rgba(0,0,0,0.4)] active:scale-[0.98]";

export function ShareProfileTriggerIcon() {
  return <IconShare size={14} className="shrink-0 text-neutral-300" />;
}
