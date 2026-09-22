"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface LoginRequiredModalProps {
  consultantName: string;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
}

export function LoginRequiredModal({
  consultantName,
  onClose,
  onConfirm,
  open,
}: LoginRequiredModalProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onEscape);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/48 px-4 py-6 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-required-modal-title"
        className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.24)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">Login required</p>
            <h3 id="login-required-modal-title" className="mt-2 text-xl font-extrabold text-slate-900">
              Save consultant
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Close login prompt"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <p className="text-sm leading-6 text-slate-600">
            You need to log in before saving <span className="font-semibold text-slate-900">{consultantName}</span> to
            your saved consultants list.
          </p>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex items-center justify-center rounded-xl bg-[#173b88] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#14316f]"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
      <button type="button" onClick={onClose} className="absolute inset-0 -z-10 cursor-default" aria-hidden="true" />
    </div>
  );
}
