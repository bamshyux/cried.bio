"use client";

import { useState, type RefObject } from "react";
import { toPng } from "html-to-image";

type DownloadReceiptButtonProps = {
  targetRef: RefObject<HTMLElement | null>;
  filename: string;
  className?: string;
};

export function DownloadReceiptButton({
  targetRef,
  filename,
  className = "rounded-lg border border-white/[0.1] px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-white/[0.18] hover:text-white disabled:cursor-not-allowed disabled:opacity-50",
}: DownloadReceiptButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    const target = targetRef.current;
    if (!target || downloading) return;

    setDownloading(true);
    setError(null);

    try {
      const dataUrl = await toPng(target, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#141414",
        filter: (node) => {
          if (!(node instanceof HTMLElement)) return true;
          return node.dataset.receiptExclude !== "true";
        },
      });

      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch {
      setError("Could not generate receipt image.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button type="button" disabled={downloading} onClick={() => void download()} className={className}>
        {downloading ? "Generating…" : "Download receipt"}
      </button>
      {error ? <span className="text-[11px] text-red-400">{error}</span> : null}
    </div>
  );
}
