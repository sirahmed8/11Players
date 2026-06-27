"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLocale } from '@/components/ThemeProvider';
import type { PlayerProfile, PESPosition } from '@/types';

interface EditProfileModalProps {
  player: PlayerProfile;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const POSITIONS: PESPosition[] = ['CF', 'SS', 'RWF', 'LWF', 'AMF', 'CMF', 'DMF', 'RMF', 'LMF', 'CB', 'RB', 'LB', 'GK'];
const PLAY_STYLES = ['Goal Poacher', 'Fox in the Box', 'Target Man', 'Creative Playmaker', 'Box-to-Box', 'Anchor Man', 'Build Up', 'Offensive Goalkeeper', 'Defensive Goalkeeper'];

export default function EditProfileModal({ player, isOpen, onClose, onRefresh }: EditProfileModalProps) {
  const { locale, t } = useLocale();
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
    preferredFoot: player.preferredFoot
  });
  
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'players', player.uid), {
        ...formData
      });
      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error saving profile');
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
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl custom-scrollbar"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <h2 className="mb-4 text-xl font-bold text-emerald-400">
            {t('Edit Profile', 'تعديل الملف الشخصي')}
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Full Name</label>
                <input type="text" value={formData.fullName} onChange={(e) => handleChange('fullName', e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-200" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Card Name</label>
                <input type="text" value={formData.cardName} onChange={(e) => handleChange('cardName', e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-200" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Date of Birth</label>
                <input type="date" value={formData.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Height (cm)</label>
                  <input type="number" value={formData.height} onChange={(e) => handleChange('height', parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-200" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Weight (kg)</label>
                  <input type="number" value={formData.weight} onChange={(e) => handleChange('weight', parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-200" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Primary Position</label>
                <select value={formData.primaryPosition} onChange={(e) => handleChange('primaryPosition', e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-200">
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Secondary Position</label>
                <select value={formData.secondaryPosition} onChange={(e) => handleChange('secondaryPosition', e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-200">
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Tertiary Position</label>
                <select value={formData.tertiaryPosition} onChange={(e) => handleChange('tertiaryPosition', e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-200">
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Play Style</label>
                <select value={formData.playStyle} onChange={(e) => handleChange('playStyle', e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-200">
                  <option value="">None</option>
                  {PLAY_STYLES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Preferred Foot</label>
                <select value={formData.preferredFoot} onChange={(e) => handleChange('preferredFoot', e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-200">
                  <option value="Right">Right</option>
                  <option value="Left">Left</option>
                  <option value="Ambidextrous">Ambidextrous</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {isSaving ? t('Saving...', 'جاري الحفظ...') : t('Save', 'حفظ')}
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-700 px-4 py-2.5 font-semibold text-slate-300 transition-colors hover:bg-slate-800"
            >
              {t('Cancel', 'إلغاء')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
