"use client";

import { useEffect, useRef, useState } from "react";

import { useToast } from "@/components/layout/toast-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  getAgencyGallery,
  uploadGalleryImage,
  deleteGalleryImage,
  type AgencyGalleryImage,
} from "@/lib/api/agencies";
import { getApiErrorMessage, getMediaUrl } from "@/lib/api/client";

export function AgencyGallery() {
  const { showToast } = useToast();

  const [images, setImages] = useState<AgencyGalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const list = await getAgencyGallery();
      setImages(list);
    } catch (error) {
      showToast({
        variant: "error",
        title: "Could not load gallery",
        message: getApiErrorMessage(error, "Failed to load agency gallery images."),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      await uploadGalleryImage(fd);
      showToast({
        variant: "success",
        title: "Image uploaded",
        message: "Gallery image added successfully.",
      });
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Upload failed",
        message: getApiErrorMessage(error, "Failed to upload gallery image. Please check file format."),
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteGalleryImage(deletingId);
      showToast({
        variant: "success",
        title: "Image deleted",
        message: "Gallery photo removed successfully.",
      });
      setDeletingId(null);
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Delete failed",
        message: getApiErrorMessage(error, "Could not delete this photo."),
      });
    }
  };

  return (
    <section className="legacy-dashboard-panel">
      <div className="legacy-dashboard-panel-head">
        <div>
          <h2>Photo Gallery</h2>
          <p>Images showcased on your agency&apos;s public profile.</p>
        </div>
        <label className="legacy-primary-btn cursor-pointer px-4 py-2 text-sm">
          {uploading ? "Uploading…" : "Upload Image"}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      <div className="p-6">
        {loading ? (
          <p className="text-center text-[var(--legacy-muted)]">Loading…</p>
        ) : images.length === 0 ? (
          <p className="py-8 text-center text-[var(--legacy-muted)]">No images uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="group relative aspect-square overflow-hidden rounded-xl border border-slate-100"
              >
                <img
                  src={getMediaUrl(img.image) ?? img.image}
                  alt="Gallery"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  className="absolute right-2 top-2 hidden rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white shadow group-hover:flex"
                  onClick={() => setDeletingId(img.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deletingId !== null}
        title="Delete Photo"
        message="Are you sure you want to delete this gallery photo? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeletingId(null)}
      />
    </section>
  );
}
