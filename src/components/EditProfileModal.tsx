"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateDoc, doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunity } from '@/contexts/CommunityContext';
import { useLocale } from '@/components/ThemeProvider';
import toast from 'react-hot-toast';
import type { PlayerProfile, PESPosition, PlayerAttributes, CommunityStats } from '@/types';
import BackgroundRemover from '@/components/BackgroundRemover';
import AttributeSliders from '@/components/AttributeSliders';
import CommunityStatsEditor from '@/components/CommunityStatsEditor';
import { calculateRealisticOverall } from '@/lib/overallCalculator';
import { getAllPlayerCommunities, calculateAge } from '@/lib/playerUtils';
import { ChevronDown } from 'lucide-react';

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
  'defensiveAwareness', 'ballWinning', 'aggression',
  'gkAwareness', 'gkCatching', 'gkClearing', 'gkReflexes', 'gkReach'
];

const CustomSelect = ({ value, options, placeholder, onChange, dropUp = false }: { 
  value: string | number; 
  options: { value: string | number; label: string }[]; 
  placeholder: string; 
  onChange: (v: string) => void;
  dropUp?: boolean;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => String(o.value) === String(value))?.label || placeholder;

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-300 flex items-center justify-between gap-2 shadow-sm ${
          isOpen
            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30'
            : value
              ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-600'
              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-500' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0.8, y: dropUp ? 4 : -4 }}
            animate={{ opacity: 1, scaleY: 1, y: 0 }}
            exit={{ opacity: 0, scaleY: 0.8, y: dropUp ? 4 : -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ transformOrigin: dropUp ? 'bottom' : 'top' }}
            className={`absolute z-[100] ${dropUp ? 'bottom-full mb-1.5' : 'mt-1.5'} w-full max-h-48 overflow-y-auto rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl shadow-black/10 dark:shadow-black/40 custom-scrollbar p-1.5 space-y-0.5`}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(String(opt.value)); setIsOpen(false); }}
                className={`w-full px-3 py-2 text-sm rounded-lg text-start transition-all duration-150 flex items-center justify-between ${
                  String(opt.value) === String(value)
                    ? 'bg-emerald-500 text-white font-bold shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 font-medium'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {String(opt.value) === String(value) && <span>✓</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function EditProfileModal({ player, isOpen, onClose, onRefresh }: EditProfileModalProps) {
  const { locale } = useLocale();
  const { isOwner, isAdmin } = useAuth();
  const { activeCommunityId, activeCommunity } = useCommunity();
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
    defensiveAwareness: 40, ballWinning: 40, aggression: 40,
    gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40
  };

  // Merge player attributes with defaults so every key has a value (min 40)
  const [attributes, setAttributes] = useState<PlayerAttributes>({ ...defaultAttributes, ...(player.attributes || {}) });
  
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
      // Clean age calculation via shared utility
      const age = calculateAge(formData.dateOfBirth || player.dateOfBirth);

      const dataToSave: Record<string, any> = {};
      // Only include defined fields to avoid overwriting with undefined
      Object.entries({ ...formData, calculatedAge: age }).forEach(([k, v]) => {
        if (v !== undefined && v !== null) dataToSave[k] = v;
      });

      const commIds = getAllPlayerCommunities(player, activeCommunityId);

      if (isOwner || isAdmin) {
        const mergedAttributes = { ...player.attributes, ...attributes };
        const newOverall = calculateRealisticOverall(mergedAttributes, formData.primaryPosition || 'CMF', formData.playStyle || '', formData.height || player.height, formData.weight || player.weight, age, player.peerRatingAvg, player.peerRatingCount);
        const updatePayload: any = {
          ...dataToSave,
          attributes: mergedAttributes,
          approvedAttributes: mergedAttributes,
          overallRating: newOverall,
        };
        for (const commId of commIds) {
          if (commId === activeCommunityId && stats) {
            updatePayload[`communityStats.${commId}`] = { ...player.communityStats?.[commId], ...stats };
          }
          await setDoc(doc(db, 'communities', commId as string, 'players', player.uid), {
            ...dataToSave,
            attributes: mergedAttributes,
            approvedAttributes: mergedAttributes,
            overallRating: newOverall,
            ...(commId === activeCommunityId && stats ? { stats: { ...player.stats, ...stats } } : {})
          }, { merge: true });
        }
        await setDoc(doc(db, 'players', player.uid), updatePayload, { merge: true });
        toast.success(isRTL ? 'تم حفظ التعديلات وتحديث التقييم العام بنجاح' : 'Changes & Overall Rating saved successfully');
      } else {
        try {
          await setDoc(doc(db, 'players', player.uid), dataToSave, { merge: true });
          for (const commId of commIds) {
            await setDoc(doc(db, 'communities', commId as string, 'players', player.uid), dataToSave, { merge: true });
          }
        } catch (e) {
          console.warn("Safe profile write fallback to editRequest:", e);
        }
        
        const targetCommunityId = activeCommunityId || (commIds.length > 0 ? commIds[0] : null);
        const editPayload = {
          playerId: player.uid,
          playerName: formData.fullName || player.fullName,
          cardName: formData.cardName || player.cardName,
          photoUrl: formData.photoUrl || player.photoUrl || '',
          requestedAt: new Date().toISOString(),
          status: 'pending',
          profileData: dataToSave,
          attributes,
          stats
        };

        const ownerUid = "G8vV7jTvd0VUeRlohrGFyARhiiw1";

        if (targetCommunityId) {
          const editRequestRef = doc(collection(db, `communities/${targetCommunityId}/editRequests`));
          await setDoc(editRequestRef, editPayload);

          try {
            if (activeCommunity?.adminUid) {
              const adminNotifRef = doc(collection(db, `users/${activeCommunity.adminUid}/notifications`));
              await setDoc(adminNotifRef, {
                type: 'stats',
                title: isRTL ? 'طلب تعديل ملف شخصي وقدرات' : 'Profile & Stats Edit Request',
                body: isRTL ? `لقد أرسل ${formData.fullName} طلب تعديل على ملفه الشخصي وقدراته للمراجعة.` : `${formData.fullName} submitted profile & stats edits for your review.`,
                read: false,
                createdAt: serverTimestamp(),
                link: '/admin?tab=edits'
              });
            }

            if (activeCommunity?.adminUid !== ownerUid) {
              const ownerNotifRef = doc(collection(db, `users/${ownerUid}/notifications`));
              await setDoc(ownerNotifRef, {
                type: 'stats',
                title: isRTL ? 'طلب تعديل ملف شخصي وقدرات' : 'Profile & Stats Edit Request',
                body: isRTL ? `لقد أرسل ${formData.fullName} طلب تعديل للمراجعة.` : `${formData.fullName} submitted profile & stats edits for review.`,
                read: false,
                createdAt: serverTimestamp(),
                link: '/admin?tab=edits'
              });
            }
          } catch (notifErr) {
            console.warn("Notification send warning:", notifErr);
          }

          toast.success(isRTL ? 'تم إرسال طلب التعديل إلى مسؤول المجتمع للمراجعة والموافقة بنجاح!' : 'Profile & stats edit request sent to your community admin for review!');
        } else {
          const globalEditReqRef = doc(collection(db, 'editRequests'));
          await setDoc(globalEditReqRef, editPayload);

          try {
            const ownerNotifRef = doc(collection(db, `users/${ownerUid}/notifications`));
            await setDoc(ownerNotifRef, {
              type: 'stats',
              title: isRTL ? 'طلب تعديل ملف شخصي وقدرات' : 'Profile & Stats Edit Request',
              body: isRTL ? `لقد أرسل ${formData.fullName} طلب تعديل للمراجعة.` : `${formData.fullName} submitted profile & stats edits for review.`,
              read: false,
              createdAt: serverTimestamp(),
              link: '/admin?tab=edits'
            });
          } catch (notifErr) {
            console.warn("Notification send warning:", notifErr);
          }

          toast.success(isRTL ? 'تم إرسال طلب التعديل إلى الإدارة للمراجعة والموافقة بنجاح!' : 'Profile & stats edit request sent to management for review!');
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
                  <input type="text" value={formData.fullName} onChange={(e) => handleChange('fullName', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Card Name</label>
                  <input type="text" value={formData.cardName} onChange={(e) => handleChange('cardName', e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Date of Birth</label>
                  <div className="flex gap-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5">
                    <CustomSelect
                      value={formData.dateOfBirth ? formData.dateOfBirth.split('-')[2] : ''}
                      placeholder="DD"
                      options={Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1).padStart(2, '0'), label: String(i + 1).padStart(2, '0') }))}
                      onChange={(v) => {
                        const [y, m] = formData.dateOfBirth ? formData.dateOfBirth.split('-') : [new Date().getFullYear().toString(), '01'];
                        handleChange('dateOfBirth', `${y}-${m}-${v}`);
                      }}
                    />
                    <CustomSelect
                      value={formData.dateOfBirth ? formData.dateOfBirth.split('-')[1] : ''}
                      placeholder="MM"
                      options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1).padStart(2, '0'), label: String(i + 1).padStart(2, '0') }))}
                      onChange={(v) => {
                        const [y, , d] = formData.dateOfBirth ? formData.dateOfBirth.split('-') : [new Date().getFullYear().toString(), '', '01'];
                        handleChange('dateOfBirth', `${y}-${v}-${d}`);
                      }}
                    />
                    <CustomSelect
                      value={formData.dateOfBirth ? formData.dateOfBirth.split('-')[0] : ''}
                      placeholder="YYYY"
                      options={Array.from({ length: 50 }, (_, i) => ({ value: new Date().getFullYear() - 10 - i, label: String(new Date().getFullYear() - 10 - i) }))}
                      onChange={(v) => {
                        const [, m, d] = formData.dateOfBirth ? formData.dateOfBirth.split('-') : ['', '01', '01'];
                        handleChange('dateOfBirth', `${v}-${m}-${d}`);
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Height (cm)</label>
                    <input type="number" value={formData.height} onChange={(e) => handleChange('height', parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Weight (kg)</label>
                    <input type="number" value={formData.weight} onChange={(e) => handleChange('weight', parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300" />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Primary Position</label>
                  <CustomSelect
                    value={formData.primaryPosition}
                    placeholder="Select Position"
                    options={POSITIONS.map(p => ({ value: p, label: p }))}
                    onChange={(v) => handleChange('primaryPosition', v)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Secondary Position</label>
                  <CustomSelect
                    value={formData.secondaryPosition}
                    placeholder="None"
                    options={[{ value: '', label: 'None' }, ...POSITIONS.map(p => ({ value: p, label: p }))]}
                    onChange={(v) => handleChange('secondaryPosition', v)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Tertiary Position</label>
                  <CustomSelect
                    value={formData.tertiaryPosition}
                    placeholder="None"
                    options={[{ value: '', label: 'None' }, ...POSITIONS.map(p => ({ value: p, label: p }))]}
                    onChange={(v) => handleChange('tertiaryPosition', v)}
                    dropUp={true}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Play Style</label>
                  <CustomSelect
                    value={formData.playStyle}
                    placeholder="None"
                    options={[{ value: '', label: 'None' }, ...PLAY_STYLES.map(p => ({ value: p, label: p }))]}
                    onChange={(v) => handleChange('playStyle', v)}
                    dropUp={true}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Preferred Foot</label>
                  <CustomSelect
                    value={formData.preferredFoot}
                    placeholder="Select Foot"
                    options={[
                      { value: 'Right', label: 'Right' },
                      { value: 'Left', label: 'Left' },
                      { value: 'Ambidextrous', label: 'Ambidextrous' }
                    ]}
                    onChange={(v) => handleChange('preferredFoot', v)}
                    dropUp={true}
                  />
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
              <CommunityStatsEditor
                stats={stats}
                onStatChange={handleStatChange}
                isRTL={isRTL}
              />
            )}

            <div>
              <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                {isRTL ? 'القدرات والمهارات' : 'Player Attributes'}
              </h3>
              <AttributeSliders
                attributes={attributes}
                onChange={setAttributes}
                locale={(locale as 'en' | 'ar') ?? 'ar'}
                primaryPosition={formData.primaryPosition}
                playStyle={formData.playStyle}
              />
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
          <style jsx>{`
            input[type="date"]::-webkit-calendar-picker-indicator,
            input[type="time"]::-webkit-calendar-picker-indicator {
              cursor: pointer;
              opacity: 0.6;
              transition: 0.2s;
            }
            input[type="date"]::-webkit-calendar-picker-indicator:hover,
            input[type="time"]::-webkit-calendar-picker-indicator:hover {
              opacity: 1;
            }
          `}</style>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
