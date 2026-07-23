"use client";

import React, { useRef, useState } from "react";
import { Upload, Loader2, CheckCircle } from "lucide-react";
import Image from "next/image";

interface BlobPhotoUploadProps {
  uid: string;
  currentUrl?: string;
  isRTL: boolean;
  onUploaded: (url: string) => void;
}

export default function BlobPhotoUpload({ uid, currentUrl, isRTL, onUploaded }: BlobPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview locally
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setSuccess(false);
    setUploading(true);

    try {
      const response = await fetch(`/api/avatar/upload?filename=${encodeURIComponent(file.name)}&uid=${uid}`, {
        method: "POST",
        body: file,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Upload failed");
      }

      const { url } = await response.json();
      onUploaded(url);
      setSuccess(true);
    } catch (err: any) {
      console.error("[Blob] Upload error:", err);
      alert(isRTL ? `فشل رفع الصورة: ${err.message}` : `Photo upload failed: ${err.message}`);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-3 flex items-center gap-3 p-3 rounded-xl border border-dashed border-emerald-400/50 bg-emerald-50/30 dark:bg-emerald-900/10">
      {(preview || currentUrl) && (
        <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-emerald-400/50">
          <Image src={preview || currentUrl!} alt="Preview" fill className="object-cover" unoptimized />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
          {isRTL ? "رفع صورة مباشرة (Vercel)" : "Direct Photo Upload (Vercel)"}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {isRTL ? "JPG, PNG, WEBP — حد أقصى 4.5MB" : "JPG, PNG, WEBP — max 4.5MB"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
      >
        {uploading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : success ? (
          <CheckCircle className="w-3.5 h-3.5" />
        ) : (
          <Upload className="w-3.5 h-3.5" />
        )}
        {uploading ? (isRTL ? "جارٍ الرفع..." : "Uploading...") : success ? (isRTL ? "تم!" : "Done!") : (isRTL ? "رفع" : "Upload")}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
