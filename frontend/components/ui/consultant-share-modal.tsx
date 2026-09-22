"use client";

import { Copy, ExternalLink, Facebook, Instagram, Linkedin, Share2, X } from "lucide-react";
import { useEffect, useMemo } from "react";

import { useToast } from "@/components/layout/toast-provider";

interface ConsultantShareModalProps {
  consultantName: string;
  open: boolean;
  onClose: () => void;
  profileUrl: string;
}

const CHANNEL_BUTTON_CLASS =
  "flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50";

export function ConsultantShareModal({
  consultantName,
  open,
  onClose,
  profileUrl,
}: ConsultantShareModalProps) {
  const { showToast } = useToast();

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

  const shareTargets = useMemo(
    () => ({
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`,
      x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(
        `Check out ${consultantName} on Shetu`,
      )}`,
    }),
    [consultantName, profileUrl],
  );

  if (!open) return null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      showToast({
        title: "Profile link copied",
        message: `${consultantName}'s consultant profile link is ready to share.`,
        variant: "success",
      });
    } catch {
      showToast({
        title: "Could not copy link",
        message: "Please copy the consultant profile link manually.",
        variant: "error",
      });
    }
  };

  const openShareWindow = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleInstagramShare = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      showToast({
        title: "Link copied for Instagram",
        message: "Instagram does not support direct web sharing here. Paste the copied link in the app or DM.",
        variant: "info",
      });
    } catch {
      showToast({
        title: "Could not prepare Instagram share",
        message: "Copy the profile URL manually and share it in Instagram.",
        variant: "warning",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/48 px-4 py-6 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consultant-share-modal-title"
        className="w-full max-w-lg overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.24)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">Share profile</p>
            <h3 id="consultant-share-modal-title" className="mt-2 text-xl font-extrabold text-slate-900">
              {consultantName}
            </h3>
            <p className="mt-1 text-sm text-slate-500">Copy the link or open a share target directly.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Close share modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
            <label htmlFor="consultant-share-link" className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Consultant profile link
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="consultant-share-link"
                readOnly
                value={profileUrl}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
              />
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-2 rounded-xl bg-[#173b88] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#14316f]"
              >
                <Copy size={16} />
                Copy
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => openShareWindow(shareTargets.facebook)} className={CHANNEL_BUTTON_CLASS}>
              <span className="inline-flex items-center gap-3">
                <Facebook size={18} className="text-[#1877f2]" />
                Facebook
              </span>
              <ExternalLink size={16} className="text-slate-400" />
            </button>
            <button type="button" onClick={() => openShareWindow(shareTargets.linkedin)} className={CHANNEL_BUTTON_CLASS}>
              <span className="inline-flex items-center gap-3">
                <Linkedin size={18} className="text-[#0a66c2]" />
                LinkedIn
              </span>
              <ExternalLink size={16} className="text-slate-400" />
            </button>
            <button type="button" onClick={() => openShareWindow(shareTargets.x)} className={CHANNEL_BUTTON_CLASS}>
              <span className="inline-flex items-center gap-3">
                <Share2 size={18} className="text-slate-800" />
                X
              </span>
              <ExternalLink size={16} className="text-slate-400" />
            </button>
            <button type="button" onClick={handleInstagramShare} className={CHANNEL_BUTTON_CLASS}>
              <span className="inline-flex items-center gap-3">
                <Instagram size={18} className="text-[#d62976]" />
                Instagram
              </span>
              <Copy size={16} className="text-slate-400" />
            </button>
          </div>
        </div>
      </div>
      <button type="button" onClick={onClose} className="absolute inset-0 -z-10 cursor-default" aria-hidden="true" />
    </div>
  );
}
