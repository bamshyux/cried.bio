"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  cardClassName,
} from "@/components/dashboard/form-fields";
import { formatLinkConfirmDisplay, isCustomProfileLink } from "@/lib/links";
import type { ProfileLink } from "@/lib/types/link";
import { trackLinkClick } from "./analytics-tracker";

type PendingLink = {
  url: string;
  onContinue: () => void;
};

type ExternalLinkConfirmContextValue = {
  requestConfirm: (url: string, onContinue: () => void) => void;
};

const ExternalLinkConfirmContext = createContext<ExternalLinkConfirmContextValue | null>(null);

function ExternalLinkConfirmModal({
  pending,
  onCancel,
  onContinue,
}: {
  pending: PendingLink;
  onCancel: () => void;
  onContinue: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const { hostname, full } = formatLinkConfirmDisplay(pending.url);

  useEffect(() => {
    cancelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="external-link-confirm-title"
        aria-describedby="external-link-confirm-description"
        className={`${cardClassName} w-full max-w-md border border-white/[0.1] p-6 shadow-2xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="external-link-confirm-title" className="text-lg font-semibold text-white">
          Are you sure?
        </h2>
        <p id="external-link-confirm-description" className="mt-3 text-sm leading-relaxed text-neutral-400">
          You&apos;re about to leave cried.bio and go to{" "}
          <span className="font-medium text-white">{hostname}</span>.
        </p>
        {full !== hostname ? (
          <p className="mt-2 break-all font-mono text-xs text-neutral-500">{full}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button ref={cancelRef} type="button" onClick={onCancel} className={buttonSecondaryClassName}>
            Cancel
          </button>
          <button type="button" onClick={onContinue} className={buttonPrimaryClassName}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export function ExternalLinkConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingLink | null>(null);

  const requestConfirm = useCallback((url: string, onContinue: () => void) => {
    setPending({ url, onContinue });
  }, []);

  const handleCancel = useCallback(() => {
    setPending(null);
  }, []);

  const handleContinue = useCallback(() => {
    if (!pending) return;
    const url = pending.url;
    pending.onContinue();
    setPending(null);
    window.open(url, "_blank", "noopener,noreferrer");
  }, [pending]);

  return (
    <ExternalLinkConfirmContext.Provider value={{ requestConfirm }}>
      {children}
      {pending ? (
        <ExternalLinkConfirmModal pending={pending} onCancel={handleCancel} onContinue={handleContinue} />
      ) : null}
    </ExternalLinkConfirmContext.Provider>
  );
}

export function useProfileLinkClick(profileId: string) {
  const context = useContext(ExternalLinkConfirmContext);

  return (event: MouseEvent<HTMLAnchorElement>, link: ProfileLink) => {
    if (profileId === "preview" || !isCustomProfileLink(link)) {
      trackLinkClick(profileId, link.id);
      return;
    }

    event.preventDefault();

    if (!context) {
      trackLinkClick(profileId, link.id);
      window.open(link.url, "_blank", "noopener,noreferrer");
      return;
    }

    context.requestConfirm(link.url, () => trackLinkClick(profileId, link.id));
  };
}
