"use client";

import { useState, useTransition } from "react";
import { importProfilePresetAction } from "@/app/actions/profile-presets";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  cardClassName,
  FormFeedback,
} from "@/components/dashboard/form-fields";
import type { ImportedPresetMeta } from "@/lib/profile-presets/import";
import type { ProfilePresetData } from "@/lib/types/profile-preset";

export function ImportPresetModal({
  presetData,
  meta,
  onClose,
  onImported,
}: {
  presetData: ProfilePresetData;
  meta: ImportedPresetMeta;
  onClose: () => void;
  onImported: (presetId: string) => void;
}) {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const handleImport = () => {
    startTransition(async () => {
      setError(undefined);
      const result = await importProfilePresetAction(
        JSON.stringify(presetData),
        meta.name,
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.presetId) onImported(result.presetId);
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className={`${cardClassName} w-full max-w-md`}>
        <h3 className="text-lg font-semibold text-white">Import Preset</h3>

        <dl className="mt-5 space-y-3 text-sm">
          <div>
            <dt className="text-neutral-500">Preset Name</dt>
            <dd className="mt-0.5 font-medium text-white">{meta.name}</dd>
          </div>
          {meta.createdBy ? (
            <div>
              <dt className="text-neutral-500">Created by</dt>
              <dd className="mt-0.5 font-medium text-white">{meta.createdBy}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-neutral-500">Version</dt>
            <dd className="mt-0.5 font-medium text-white">{meta.versionLabel}</dd>
          </div>
        </dl>

        <p className="mt-5 text-sm text-neutral-400">
          This will create a new preset in your library.
        </p>

        <FormFeedback error={error} />

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} disabled={isPending} className={buttonSecondaryClassName}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={isPending}
            className={buttonPrimaryClassName}
          >
            {isPending ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
