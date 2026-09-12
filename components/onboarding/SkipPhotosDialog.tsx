"use client";

import { SKIP_PHOTOS_DIALOG_COPY } from "@/lib/onboarding";

type Props = {
  open: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function SkipPhotosDialog({ open, busy, onCancel, onConfirm }: Props) {
  if (!open) return null;

  return (
    <div
      aria-labelledby="skip-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
    >
      <div className="max-w-md rounded-2xl border border-pink-200 bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-zinc-900" id="skip-dialog-title">
          Continue without photos?
        </h2>
        <p className="mt-2 text-sm text-zinc-600">{SKIP_PHOTOS_DIALOG_COPY}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            className="cursor-pointer rounded-md border border-pink-200 px-4 py-2 text-sm text-zinc-800"
            disabled={busy}
            type="button"
            onClick={onCancel}
          >
            Go back
          </button>
          <button
            className="cursor-pointer rounded-md bg-pink-300 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            disabled={busy}
            type="button"
            onClick={onConfirm}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
