'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { removeBackground } from '@imgly/background-removal';
import { CLOUDINARY_CONFIG } from '@/lib/firebase';

/* ──────────────────────────────────────────────
   Translations
   ────────────────────────────────────────────── */
const translations = {
  en: {
    title: 'Player Photo',
    subtitle: 'Upload your photo and we\'ll remove the background automatically',
    dragDrop: 'Drag & drop your photo here',
    or: 'or',
    browse: 'Browse Files',
    processing: 'Removing background...',
    processingHint: 'This may take a moment (WASM processing)',
    uploadingCloud: 'Uploading to cloud...',
    done: 'Photo ready!',
    failed: 'Background removal failed',
    failedHint: 'You can still upload the original photo',
    confirm: 'Confirm & Upload',
    uploadOriginal: 'Upload Original Instead',
    retake: 'Choose Another Photo',
    before: 'Before',
    after: 'After',
    comparing: 'Slide to compare',
    maxSize: 'Max file size: 10MB',
    invalidFile: 'Please select a valid image file',
    fileTooLarge: 'File too large. Maximum 10MB allowed.',
  },
  ar: {
    title: 'صورة اللاعب',
    subtitle: 'ارفع صورتك وسنزيل الخلفية تلقائياً',
    dragDrop: 'اسحب وأفلت صورتك هنا',
    or: 'أو',
    browse: 'تصفح الملفات',
    processing: 'جارٍ إزالة الخلفية...',
    processingHint: 'قد يستغرق هذا بضع لحظات (معالجة WASM)',
    uploadingCloud: 'جارٍ الرفع إلى السحابة...',
    done: 'الصورة جاهزة!',
    failed: 'فشلت إزالة الخلفية',
    failedHint: 'لا يزال بإمكانك رفع الصورة الأصلية',
    confirm: 'تأكيد ورفع',
    uploadOriginal: 'رفع الصورة الأصلية بدلاً من ذلك',
    retake: 'اختر صورة أخرى',
    before: 'قبل',
    after: 'بعد',
    comparing: 'اسحب للمقارنة',
    maxSize: 'الحد الأقصى لحجم الملف: 10 ميجابايت',
    invalidFile: 'يرجى اختيار ملف صورة صالح',
    fileTooLarge: 'الملف كبير جداً. الحد الأقصى 10 ميجابايت.',
  },
} as const;

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */
type ProcessingStatus = 'idle' | 'processing' | 'done' | 'failed' | 'uploading' | 'uploaded';

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
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [comparePosition, setComparePosition] = useState(50);

  /* ── File validation ── */
  const validateFile = useCallback((file: File): string | null => {
    if (!file.type.startsWith('image/')) return txt.invalidFile;
    if (file.size > 10 * 1024 * 1024) return txt.fileTooLarge;
    return null;
  }, [txt]);

  /* ── Process image ── */
  const processImage = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setOriginalFile(file);
    const localUrl = URL.createObjectURL(file);
    setOriginalPreview(localUrl);
    setProcessedPreview(null);
    setProcessedBlob(null);
    setStatus('processing');

    try {
      const blob = await removeBackground(file);
      const processedUrl = URL.createObjectURL(blob);
      setProcessedPreview(processedUrl);
      setProcessedBlob(blob);
      setStatus('done');
    } catch (err) {
      console.error('Background removal error:', err);
      setStatus('failed');
    }
  }, [validateFile]);

  /* ── Upload to Cloudinary ── */
  const uploadToCloudinary = useCallback(async (blob: Blob) => {
    setStatus('uploading');
    try {
      const formData = new FormData();
      formData.append('file', blob);
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
  }, [onImageReady]);

  /* ── Handle confirm ── */
  const handleConfirm = useCallback(() => {
    if (processedBlob) {
      uploadToCloudinary(processedBlob);
    }
  }, [processedBlob, uploadToCloudinary]);

  /* ── Upload original as fallback ── */
  const handleUploadOriginal = useCallback(() => {
    if (originalFile) {
      uploadToCloudinary(originalFile);
    }
  }, [originalFile, uploadToCloudinary]);

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    setStatus('idle');
    setOriginalPreview(null);
    setProcessedPreview(null);
    setProcessedBlob(null);
    setOriginalFile(null);
    setError(null);
    setComparePosition(50);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  /* ── File input handler ── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
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
    if (file) processImage(file);
  };

  /* ── Compare slider handler ── */
  const handleCompareSlider = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setComparePosition((x / rect.width) * 100);
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

      {/* ─── PROCESSING: Loading state ─── */}
      {status === 'processing' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full h-56 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col items-center justify-center gap-4 relative overflow-hidden"
        >
          {/* Original image behind loading overlay */}
          {originalPreview && (
            <img
              src={originalPreview}
              alt="Original"
              className="absolute inset-0 w-full h-full object-contain opacity-20"
            />
          )}
          <div className="relative z-10 flex flex-col items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-500"
            />
            <p className="text-emerald-400 font-semibold text-sm">{txt.processing}</p>
            <p className="text-slate-500 text-xs">{txt.processingHint}</p>
          </div>
        </motion.div>
      )}

      {/* ─── UPLOADING: Cloud upload state ─── */}
      {status === 'uploading' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full h-56 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col items-center justify-center gap-4"
        >
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
        </motion.div>
      )}

      {/* ─── UPLOADED: Success ─── */}
      {status === 'uploaded' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full h-56 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center gap-3"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="text-5xl"
          >
            ✅
          </motion.div>
          <p className="text-emerald-400 font-bold text-lg">{txt.done}</p>
        </motion.div>
      )}

      {/* ─── DONE / FAILED: Before/After comparison ─── */}
      {(status === 'done' || status === 'failed') && originalPreview && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Before/After Comparison */}
          {status === 'done' && processedPreview && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 text-center">{txt.comparing}</p>
              <div
                className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-700/50 cursor-col-resize select-none"
                onMouseMove={handleCompareSlider}
              >
                {/* After (processed) – full background */}
                <div className="absolute inset-0">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%)',
                      backgroundSize: '16px 16px',
                    }}
                  />
                  <img
                    src={processedPreview}
                    alt="After"
                    className="w-full h-full object-contain relative z-10"
                  />
                </div>

                {/* Before (original) – clipped */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${comparePosition}%` }}
                >
                  <img
                    src={originalPreview}
                    alt="Before"
                    className="w-full h-full object-contain"
                    style={{ width: `${(100 / comparePosition) * 100}%`, maxWidth: 'none' }}
                  />
                </div>

                {/* Divider line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white/80 z-20"
                  style={{ left: `${comparePosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                    <span className="text-slate-800 text-xs font-bold">⟷</span>
                  </div>
                </div>

                {/* Labels */}
                <div className="absolute top-2 left-2 z-30 bg-slate-900/70 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  {txt.before}
                </div>
                <div className="absolute top-2 right-2 z-30 bg-emerald-600/70 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  {txt.after}
                </div>
              </div>
            </div>
          )}

          {/* Failed state – show original only */}
          {status === 'failed' && (
            <div className="space-y-2">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3">
                <span className="text-amber-400 text-xl">⚠️</span>
                <div>
                  <p className="text-amber-300 text-sm font-medium">{txt.failed}</p>
                  <p className="text-amber-400/60 text-xs">{txt.failedHint}</p>
                </div>
              </div>
              <div className="w-full h-48 rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-800/40">
                <img
                  src={originalPreview}
                  alt="Original"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {status === 'done' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/30 transition-all text-sm"
              >
                ☁️ {txt.confirm}
              </motion.button>
            )}

            {status === 'failed' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUploadOriginal}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded-xl shadow-lg shadow-amber-900/30 transition-all text-sm"
              >
                📤 {txt.uploadOriginal}
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReset}
              className="flex-1 py-3 px-6 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-all text-sm"
            >
              🔄 {txt.retake}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
