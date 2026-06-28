"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/components/ThemeProvider';
import toast from 'react-hot-toast';
import type { PlayerProfile, PESPosition } from '@/types';
import BackgroundRemover from '@/components/BackgroundRemover';

interface EditProfileModalProps {
  player: PlayerProfile;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const POSITIONS: PESPosition[] = ['CF', 'SS', 'RWF', 'LWF', 'AMF', 'CMF', 'DMF', 'RMF', 'LMF', 'CB', 'RB', 'LB', 'GK'];
const PLAY_STYLES = ['Goal Poacher', 'Fox in the Box', 'Target Man', 'Deep-Lying Forward', 'Dummy Runner', 'Creative Playmaker', 'Hole Player', 'Classic No. 10', 'Prolific Winger', 'Roaming Flank', 'Cross Specialist', 'Orchestrator', 'Box-to-Box', 'The Destroyer', 'Anchor Man', 'Build Up', 'Extra Frontman', 'Offensive Full-back', 'Defensive Full-back', 'Full-back Finisher', 'Offensive Goalkeeper', 'Defensive Goalkeeper'];

export default function EditProfileModal({ player, isOpen, onClose, onRefresh }: EditProfileModalProps) {
  const { locale } = useLocale();
  const { isOwner } = useAuth();
  const isRTL = locale === 'ar';
  
  const [formData, setFormData] = useState({
    fullName: player.fullName,
    cardName: player.cardName,
    dateOfBirth: player.dateOfBirth,
    height: player.height,
    weight: player.weight,
    primaryPosition: player.primaryPosition,
    secondaryPosition: player.secondaryPosition,
    tertiaryPosition: player.tertiaryPosition,
    playStyle: player.playStyle || '',
    preferredFoot: player.preferredFoot,
    photoUrl: player.photoUrl || ''
  });
  
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;

      const dataToSave = {
        ...formData,
        calculatedAge: age
      };

      if (isOwner) {
        await updateDoc(doc(db, 'players', player.uid), dataToSave);
        toast.success(isRTL ? 'تم حفظ التعديلات بنجاح' : 'Changes saved successfully');
      } else {
        await setDoc(doc(db, 'profileEdits', player.uid), {
          ...dataToSave,
          status: 'pending',
          requestedAt: new Date().toISOString()
        });
        toast.success(isRTL ? 'تم إرسال طلب التعديل للمراجعة' : 'Edit request sent for approval');
      }
      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? 'حدث خطأ أثناء الحفظ' : 'Error saving profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl custom-scrollbar"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <h2 className="mb-4 text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {isRTL ? 'تعديل الملف الشخصي' : 'Edit Profile'}
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                <input type="text" value={formData.fullName} onChange={(e) => handleChange('fullName', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Card Name</label>
                <input type="text" value={formData.cardName} onChange={(e) => handleChange('cardName', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Date of Birth</label>
                <input type="date" value={formData.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Height (cm)</label>
                  <input type="number" value={formData.height} onChange={(e) => handleChange('height', parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Weight (kg)</label>
                  <input type="number" value={formData.weight} onChange={(e) => handleChange('weight', parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Primary Position</label>
                <select value={formData.primaryPosition} onChange={(e) => handleChange('primaryPosition', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors">
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Secondary Position</label>
                <select value={formData.secondaryPosition} onChange={(e) => handleChange('secondaryPosition', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors">
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Tertiary Position</label>
                <select value={formData.tertiaryPosition} onChange={(e) => handleChange('tertiaryPosition', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors">
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Play Style</label>
                <select value={formData.playStyle} onChange={(e) => handleChange('playStyle', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors">
                  <option value="">None</option>
                  {PLAY_STYLES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Preferred Foot</label>
                <select value={formData.preferredFoot} onChange={(e) => handleChange('preferredFoot', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors">
                  <option value="Right">Right</option>
                  <option value="Left">Left</option>
                  <option value="Ambidextrous">Ambidextrous</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Photo</label>
                <BackgroundRemover 
                  onImageReady={(url) => handleChange('photoUrl', url)} 
                  locale={(locale as 'en' | 'ar') ?? 'ar'} 
                  initialImageUrl={formData.photoUrl}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {isSaving ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ' : 'Save')}
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
