'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CLOUDINARY_CONFIG } from '@/lib/firebase';

/* ──────────────────────────────────────────────
   Translations
   ────────────────────────────────────────────── */
const translations = {
  en: {
    title: 'Player Photo',
    subtitle: 'Upload your photo (Optional)',
    dragDrop: 'Drag & drop your photo here',
    or: 'or',
    browse: 'Browse Files',
    uploadingCloud: 'Uploading to cloud...',
    done: 'Photo ready!',
    failed: 'Upload failed',
    retake: 'Choose Another Photo',
    maxSize: 'Max file size: 10MB',
    invalidFile: 'Please select a valid image file',
    fileTooLarge: 'File too large. Maximum 10MB allowed.',
  },
  ar: {
    title: 'صورة اللاعب',
    subtitle: 'ارفع صورتك (اختياري)',
    dragDrop: 'اسحب وأفلت صورتك هنا',
    or: 'أو',
    browse: 'تصفح الملفات',
    uploadingCloud: 'جارٍ الرفع إلى السحابة...',
    done: 'الصورة جاهزة!',
    failed: 'فشل الرفع',
    retake: 'اختر صورة أخرى',
    maxSize: 'الحد الأقصى لحجم الملف: 10 ميجابايت',
    invalidFile: 'يرجى اختيار ملف صورة صالح',
    fileTooLarge: 'الملف كبير جداً. الحد الأقصى 10 ميجابايت.',
  },
} as const;

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */
type ProcessingStatus = 'idle' | 'uploading' | 'uploaded' | 'failed';

interface BackgroundRemoverProps {
  onImageReady: (cloudinaryUrl: string) => void;
  locale?: 'en' | 'ar';
}

/* ──────────────────────────────────────────────
   Component
   ────────────────────────────────────────────── */
export default function BackgroundRemover({ onImageReady, locale = 'ar' }: BackgroundRemoverProps) {
  const txt = translations[locale];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  /* ── File validation ── */
  const validateFile = useCallback((file: File): string | null => {
    if (!file.type.startsWith('image/')) return txt.invalidFile;
    if (file.size > 10 * 1024 * 1024) return txt.fileTooLarge;
    return null;
  }, [txt]);

  /* ── Upload to Cloudinary ── */
  const uploadToCloudinary = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const localUrl = URL.createObjectURL(file);
    setOriginalPreview(localUrl);
    setStatus('uploading');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
      const data = await res.json();
      setStatus('uploaded');
      onImageReady(data.secure_url);
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      setStatus('failed');
      setError('Upload failed. Please try again.');
    }
  }, [onImageReady, validateFile]);

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    setStatus('idle');
    setOriginalPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onImageReady(''); // Clear image on reset
  }, [onImageReady]);

  /* ── File input handler ── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadToCloudinary(file);
  };

  /* ── Drag & drop handlers ── */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadToCloudinary(file);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">{txt.title}</h2>
        <p className="text-sm text-slate-400 mt-1">{txt.subtitle}</p>
      </div>

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm text-center"
          >
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── IDLE: Drop zone ─── */}
      {status === 'idle' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative w-full h-56 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer
            transition-all duration-300 group
            ${isDragging
              ? 'border-emerald-400 bg-emerald-500/10 scale-[1.02]'
              : 'border-slate-600 bg-slate-800/40 hover:border-emerald-500/50 hover:bg-slate-800/60'
            }
          `}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-4xl"
          >
            📸
          </motion.div>
          <p className="text-slate-300 font-medium text-sm">{txt.dragDrop}</p>
          <p className="text-slate-500 text-xs">{txt.or}</p>
          <div className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-full transition-colors">
            {txt.browse}
          </div>
          <p className="text-slate-600 text-xs">{txt.maxSize}</p>
        </motion.div>
      )}

      {/* ─── UPLOADING: Cloud upload state ─── */}
      {status === 'uploading' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full h-56 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col items-center justify-center gap-4 relative overflow-hidden"
        >
          {originalPreview && (
            <img
              src={originalPreview}
              alt="Uploading"
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
          )}
          <div className="relative z-10 flex flex-col items-center gap-3">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              className="text-4xl"
            >
              ☁️
            </motion.div>
            <p className="text-sky-400 font-semibold text-sm">{txt.uploadingCloud}</p>
            <div className="w-48 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 3, ease: 'easeInOut' }}
                className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 rounded-full"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── UPLOADED: Success ─── */}
      {status === 'uploaded' && originalPreview && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full h-56 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center gap-3 relative overflow-hidden"
        >
          <img
            src={originalPreview}
            alt="Uploaded"
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="text-5xl drop-shadow-xl"
            >
              ✅
            </motion.div>
            <p className="text-emerald-300 font-bold text-lg mt-2 drop-shadow-md">{txt.done}</p>
          </div>
        </motion.div>
      )}

      {/* ─── FAILED ─── */}
      {status === 'failed' && originalPreview && (
        <div className="w-full h-48 rounded-2xl overflow-hidden border border-red-500/50 bg-red-500/10 flex flex-col items-center justify-center">
          <span className="text-red-400 text-3xl mb-2">⚠️</span>
          <p className="text-red-300 text-sm font-medium">{txt.failed}</p>
        </div>
      )}

      {/* Action buttons */}
      {(status === 'uploaded' || status === 'failed') && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleReset}
          className="w-full py-3 px-6 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-all text-sm mt-4"
        >
          🔄 {txt.retake}
        </motion.button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*, image/heic"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
