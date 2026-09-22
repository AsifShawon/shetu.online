"use client";

import { useEffect, useRef, useState } from "react";

import { getAgencyGallery, uploadGalleryImage, deleteGalleryImage, type AgencyGalleryImage } from "@/lib/api/agencies";
import { getMediaUrl } from "@/lib/api/client";

export function AgencyGallery() {
  const [images, setImages] = useState<AgencyGalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    getAgencyGallery()
      .then(setImages)
      .catch(() => null)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      await uploadGalleryImage(fd);
      load();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <section className="legacy-dashboard-panel">
      <div className="legacy-dashboard-panel-head">
        <div><h2>Photo Gallery</h2><p>Images showcased on your agency's public profile.</p></div>
        <label className="legacy-primary-btn text-sm px-4 py-2 cursor-pointer">
          {uploading ? "Uploading…" : "Upload Image"}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
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
              <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-100">
                <img
                  src={getMediaUrl(img.image) ?? img.image}
                  alt="Gallery"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  className="absolute right-2 top-2 hidden rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white shadow group-hover:flex"
                  onClick={async () => { if (window.confirm("Delete image?")) { await deleteGalleryImage(img.id); load(); } }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
