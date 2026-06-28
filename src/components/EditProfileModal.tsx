"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateDoc, doc, setDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunity } from '@/contexts/CommunityContext';
import { useLocale } from '@/components/ThemeProvider';
import toast from 'react-hot-toast';
import type { PlayerProfile, PESPosition, PlayerAttributes, CommunityStats } from '@/types';
import BackgroundRemover from '@/components/BackgroundRemover';

interface EditProfileModalProps {
  player: PlayerProfile;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const POSITIONS: PESPosition[] = ['CF', 'SS', 'RWF', 'LWF', 'AMF', 'CMF', 'DMF', 'RMF', 'LMF', 'CB', 'RB', 'LB', 'GK'];
const PLAY_STYLES = ['Goal Poacher', 'Fox in the Box', 'Target Man', 'Deep-Lying Forward', 'Dummy Runner', 'Creative Playmaker', 'Hole Player', 'Classic No. 10', 'Prolific Winger', 'Roaming Flank', 'Cross Specialist', 'Orchestrator', 'Box-to-Box', 'The Destroyer', 'Anchor Man', 'Build Up', 'Extra Frontman', 'Offensive Full-back', 'Defensive Full-back', 'Full-back Finisher', 'Offensive Goalkeeper', 'Defensive Goalkeeper'];

const ATTRIBUTES_KEYS: (keyof PlayerAttributes)[] = [
  'offensiveAwareness', 'ballControl', 'dribbling', 'lowPass', 'loftedPass', 'finishing', 'heading',
  'speed', 'acceleration', 'kickingPower', 'jump', 'physicalContact', 'balance', 'stamina',
  'defensiveAwareness', 'ballWinning', 'goalkeeping'
];

export default function EditProfileModal({ player, isOpen, onClose, onRefresh }: EditProfileModalProps) {
  const { locale } = useLocale();
  const { isOwner } = useAuth();
  const { activeCommunityId } = useCommunity();
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
  
  const defaultAttributes: PlayerAttributes = {
    offensiveAwareness: 40, ballControl: 40, dribbling: 40, lowPass: 40, loftedPass: 40, finishing: 40, heading: 40,
    speed: 40, acceleration: 40, kickingPower: 40, jump: 40, physicalContact: 40, balance: 40, stamina: 40,
    defensiveAwareness: 40, ballWinning: 40, goalkeeping: 40
  };

  const [attributes, setAttributes] = useState<PlayerAttributes>(player.attributes || defaultAttributes);
  
  const [stats, setStats] = useState<CommunityStats>(
    (activeCommunityId && player.communityStats && player.communityStats[activeCommunityId]) 
      || { goals: 0, assists: 0, mvp: 0, matchesPlayed: 0 }
  );
  
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAttributeChange = (field: keyof PlayerAttributes, value: number) => {
    setAttributes(prev => ({ ...prev, [field]: value }));
  };

  const handleStatChange = (field: keyof CommunityStats, value: number) => {
    setStats(prev => ({ ...prev, [field]: value }));
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
        const updatePayload: any = {
          ...dataToSave,
          attributes: { ...player.attributes, ...attributes }
        };
        if (activeCommunityId) {
          updatePayload[`communityStats.${activeCommunityId}`] = { ...player.communityStats?.[activeCommunityId], ...stats };
        }
        await updateDoc(doc(db, 'players', player.uid), updatePayload);
        toast.success(isRTL ? 'تم حفظ التعديلات بنجاح' : 'Changes saved successfully');
      } else {
        await updateDoc(doc(db, 'players', player.uid), dataToSave);
        
        if (activeCommunityId) {
          const editRequestRef = doc(collection(db, `communities/${activeCommunityId}/editRequests`));
          await setDoc(editRequestRef, {
            playerId: player.uid,
            playerName: formData.fullName,
            requestedAt: new Date().toISOString(),
            status: 'pending',
            attributes,
            stats
          });
          toast.success(isRTL ? 'تم إرسال طلب تعديل القدرات والإحصائيات للمراجعة' : 'Attributes and stats edit request sent for approval');
        } else {
          toast.success(isRTL ? 'تم حفظ المعلومات الأساسية' : 'Basic info saved successfully');
        }
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

          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-800 dark:text-amber-500 mb-1">
                {isRTL ? "تنبيه هام" : "Important Warning"}
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-600 font-medium leading-relaxed">
                {isRTL 
                  ? "يرجى تحري الدقة والصدق عند إدخال بياناتك (كالطول والوزن وغيرها). سيتم مراجعة هذه البيانات من قبل الإدارة، وأي معلومات مضللة قد تؤدي إلى حظر الحساب." 
                  : "Please be accurate and honest when entering your details (like height, weight, etc.). This data will be reviewed by admins, and any misleading information may result in an account ban."}
              </p>
            </div>
          </div>


          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                {isRTL ? 'المعلومات الأساسية' : 'Basic Information'}
              </h3>
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

            {activeCommunityId && (
              <>
                <div>
                  <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                    {isRTL ? 'إحصائيات المجتمع' : 'Community Stats'}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['goals', 'assists', 'mvp', 'matchesPlayed'].map(statKey => (
                      <div key={statKey}>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{statKey}</label>
                        <input type="number" min="0" value={stats[statKey as keyof CommunityStats] as number || 0} onChange={(e) => handleStatChange(statKey as keyof CommunityStats, parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                    {isRTL ? 'القدرات والمهارات' : 'Player Attributes'}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {ATTRIBUTES_KEYS.map(attr => (
                      <div key={attr}>
                        <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300 capitalize truncate" title={attr}>{attr.replace(/([A-Z])/g, ' $1').trim()}</label>
                        <input type="number" min="40" max="99" value={attributes[attr] || 40} onChange={(e) => handleAttributeChange(attr, parseInt(e.target.value) || 40)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
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
