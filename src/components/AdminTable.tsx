'use client';

import { useState } from 'react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateProfilePDF } from '@/lib/pdf';
import { useLocale } from '@/components/ThemeProvider';
import AttributeSliders from '@/components/AttributeSliders';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerProfile } from '@/types';

interface AdminTableProps {
  players: PlayerProfile[];
  onRefresh: () => void;
}

type SortKey =
  | 'fullName'
  | 'primaryPosition'
  | 'calculatedAge'
  | 'preferredFoot'
  | 'hasWarning'
  | 'isVerifiedByAdmin'
  | 'stats.goals'
  | 'stats.assists';

type SortDir = 'asc' | 'desc';

interface StatsModal {
  open: boolean;
  player: PlayerProfile | null;
  goals: number;
  assists: number;
  mvp: number;
}

interface AttrModal {
  open: boolean;
  player: PlayerProfile | null;
  attributes: PlayerProfile['attributes'];
}

const t = (locale: string, en: string, ar: string) => (locale === 'ar' ? ar : en);

function getSortValue(player: PlayerProfile, key: SortKey): string | number | boolean {
  switch (key) {
    case 'fullName':
      return player.fullName.toLowerCase();
    case 'primaryPosition':
      return player.primaryPosition;
    case 'calculatedAge':
      return player.calculatedAge;
    case 'preferredFoot':
      return player.preferredFoot;
    case 'hasWarning':
      return player.hasWarning ? 1 : 0;
    case 'isVerifiedByAdmin':
      return player.isVerifiedByAdmin ? 1 : 0;
    case 'stats.goals':
      return player.stats.goals;
    case 'stats.assists':
      return player.stats.assists;
    default:
      return '';
  }
}

export default function AdminTable({ players, onRefresh }: AdminTableProps) {
  const { locale } = useLocale();
  const [sortKey, setSortKey] = useState<SortKey>('fullName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [statsModal, setStatsModal] = useState<StatsModal>({
    open: false,
    player: null,
    goals: 0,
    assists: 0,
    mvp: 0,
  });
  const [attrModal, setAttrModal] = useState<AttrModal>({
    open: false,
    player: null,
    attributes: { 
      attackingProwess: 50, defensiveProwess: 50, speed: 50, acceleration: 50, 
      stamina: 50, dribbling: 50, passing: 50, physicalContact: 50, 
      shotPower: 50, goalkeeping: 50 
    },
  });
  const [loadingUid, setLoadingUid] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedPlayers = [...players].sort((a, b) => {
    const aVal = getSortValue(a, sortKey);
    const bVal = getSortValue(b, sortKey);
    const modifier = sortDir === 'asc' ? 1 : -1;

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal) * modifier;
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return (aVal - bVal) * modifier;
    }
    return 0;
  });

  const toggleWarning = async (uid: string, current: boolean) => {
    setLoadingUid(uid);
    try {
      await updateDoc(doc(db, 'players', uid), { hasWarning: !current });
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle warning:', err);
    } finally {
      setLoadingUid(null);
    }
  };

  const toggleVerify = async (uid: string, current: boolean) => {
    setLoadingUid(uid);
    try {
      await updateDoc(doc(db, 'players', uid), { isVerifiedByAdmin: !current });
      onRefresh();
    } catch (error) {
      console.error(error);
      alert('Error updating warning status');
    } finally {
      setLoadingUid(null);
    }
  };

  const openAttrModal = (player: PlayerProfile) => {
    setAttrModal({
      open: true,
      player,
      attributes: { ...player.attributes },
    });
  };

  const closeAttrModal = () => {
    setAttrModal({
      open: false,
      player: null,
      attributes: { 
        attackingProwess: 50, defensiveProwess: 50, speed: 50, acceleration: 50, 
        stamina: 50, dribbling: 50, passing: 50, physicalContact: 50, 
        shotPower: 50, goalkeeping: 50 
      },
    });
  };

  const saveAttributes = async () => {
    if (!attrModal.player) return;
    setLoadingUid(attrModal.player.uid);
    try {
      await updateDoc(doc(db, 'players', attrModal.player.uid), {
        attributes: attrModal.attributes,
      });
      onRefresh();
      closeAttrModal();
    } catch (error) {
      console.error(error);
      alert('Error updating attributes');
    } finally {
      setLoadingUid(null);
    }
  };

  const openStatsModal = (player: PlayerProfile) => {
    setStatsModal({ open: true, player, goals: 0, assists: 0, mvp: 0 });
  };

  const closeStatsModal = () => {
    setStatsModal({ open: false, player: null, goals: 0, assists: 0, mvp: 0 });
  };

  const saveStats = async () => {
    if (!statsModal.player) return;
    setLoadingUid(statsModal.player.uid);
    try {
      await updateDoc(doc(db, 'players', statsModal.player.uid), {
        'stats.goals': increment(statsModal.goals),
        'stats.assists': increment(statsModal.assists),
        'stats.mvp': increment(statsModal.mvp),
        'stats.matchesPlayed': increment(1),
      });
      closeStatsModal();
      onRefresh();
    } catch (err) {
      console.error('Failed to update stats:', err);
    } finally {
      setLoadingUid(null);
    }
  };

  const sortArrow = (key: SortKey) => {
    if (sortKey !== key) return ' ↕';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  const columns: { key: SortKey | null; en: string; ar: string }[] = [
    { key: 'fullName', en: 'Name', ar: 'الاسم' },
    { key: 'primaryPosition', en: 'Position', ar: 'المركز' },
    { key: 'calculatedAge', en: 'Age', ar: 'العمر' },
    { key: 'preferredFoot', en: 'Foot', ar: 'القدم' },
    { key: 'hasWarning', en: 'Warning', ar: 'تحذير' },
    { key: 'isVerifiedByAdmin', en: 'Verified', ar: 'موثق' },
    { key: 'stats.goals', en: 'Goals', ar: 'أهداف' },
    { key: 'stats.assists', en: 'Assists', ar: 'تمريرات' },
    { key: null, en: 'Actions', ar: 'إجراءات' },
  ];

  if (players.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 p-16 text-center"
      >
        <svg
          className="mb-4 h-16 w-16 text-slate-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-slate-400">
          {t(locale, 'No players found', 'لا يوجد لاعبين')}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {t(locale, 'Players will appear here once registered.', 'سيظهر اللاعبون هنا بعد التسجيل.')}
        </p>
      </motion.div>
    );
  }

  return (
    <>
      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
        <table className="w-full min-w-[900px] text-sm" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/80">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={col.key ? () => handleSort(col.key!) : undefined}
                  className={`px-4 py-3 text-left font-semibold text-emerald-400 ${
                    col.key ? 'cursor-pointer select-none transition-colors hover:text-emerald-300' : ''
                  } ${locale === 'ar' ? 'text-right' : 'text-left'}`}
                >
                  {t(locale, col.en, col.ar)}
                  {col.key && (
                    <span className="ml-1 text-xs text-slate-500">{sortArrow(col.key)}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {sortedPlayers.map((player) => (
                <motion.tr
                  key={player.uid}
                  layout
                  initial={{ opacity: 0, x: locale === 'ar' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: locale === 'ar' ? -20 : 20 }}
                  transition={{ duration: 0.2 }}
                  className="border-b border-slate-800 transition-colors hover:bg-slate-800/60"
                >
                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {player.photoUrl ? (
                        <img
                          src={player.photoUrl}
                          alt={player.fullName}
                          className="h-8 w-8 rounded-full object-cover ring-2 ring-slate-700"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-emerald-400">
                          {player.fullName.charAt(0)}
                        </div>
                      )}
                      <span className="font-medium text-slate-200">{player.fullName}</span>
                    </div>
                  </td>

                  {/* Position */}
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                      {player.primaryPosition}
                    </span>
                  </td>

                  {/* Age */}
                  <td className="px-4 py-3 text-slate-300">{player.calculatedAge}</td>

                  {/* Foot */}
                  <td className="px-4 py-3 text-slate-300">
                    {locale === 'ar'
                      ? player.preferredFoot === 'Right'
                        ? 'يمنى'
                        : player.preferredFoot === 'Left'
                          ? 'يسرى'
                          : 'كلتاهما'
                      : player.preferredFoot}
                  </td>

                  {/* Warning */}
                  <td className="px-4 py-3">
                    <button
                      disabled={loadingUid === player.uid}
                      onClick={() => toggleWarning(player.uid, player.hasWarning)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                        player.hasWarning
                          ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                          : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                      } disabled:opacity-50`}
                      title={t(locale, 'Toggle warning', 'تبديل التحذير')}
                    >
                      {player.hasWarning ? '⚠️' : '—'}
                      <span>{player.hasWarning ? t(locale, 'Yes', 'نعم') : t(locale, 'No', 'لا')}</span>
                    </button>
                  </td>

                  {/* Verified */}
                  <td className="px-4 py-3">
                    <button
                      disabled={loadingUid === player.uid}
                      onClick={() => toggleVerify(player.uid, player.isVerifiedByAdmin)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                        player.isVerifiedByAdmin
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                      } disabled:opacity-50`}
                      title={t(locale, 'Toggle verification', 'تبديل التوثيق')}
                    >
                      {player.isVerifiedByAdmin ? '✅' : '❌'}
                      <span>
                        {player.isVerifiedByAdmin ? t(locale, 'Verified', 'موثق') : t(locale, 'Unverified', 'غير موثق')}
                      </span>
                    </button>
                  </td>

                  {/* Goals */}
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold text-slate-200">{player.stats.goals}</span>
                  </td>

                  {/* Assists */}
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold text-slate-200">{player.stats.assists}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {/* Edit Attributes */}
                      <button
                        onClick={() => openAttrModal(player)}
                        className="rounded-lg bg-purple-600/20 p-2 text-purple-400 transition-colors hover:bg-purple-600/40 hover:text-purple-300"
                        title={t(locale, 'Edit Attributes', 'تعديل الطاقات')}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                        </svg>
                      </button>

                      {/* Edit Stats */}
                      <button
                        onClick={() => openStatsModal(player)}
                        className="rounded-lg bg-emerald-600/20 p-2 text-emerald-400 transition-colors hover:bg-emerald-600/40 hover:text-emerald-300"
                        title={t(locale, 'Edit Stats', 'تعديل الإحصائيات')}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                          />
                        </svg>
                      </button>

                      {/* PDF Export */}
                      <button
                        onClick={() => generateProfilePDF(player)}
                        className="rounded-lg bg-blue-600/20 p-2 text-blue-400 transition-colors hover:bg-blue-600/40 hover:text-blue-300"
                        title={t(locale, 'Export PDF', 'تصدير PDF')}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Stats Edit Modal */}
      <AnimatePresence>
        {statsModal.open && statsModal.player && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={closeStatsModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="mx-4 w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
              dir={locale === 'ar' ? 'rtl' : 'ltr'}
            >
              <h2 className="mb-1 text-xl font-bold text-emerald-400">
                {t(locale, 'Update Stats', 'تحديث الإحصائيات')}
              </h2>
              <p className="mb-6 text-sm text-slate-400">{statsModal.player.fullName}</p>

              <div className="space-y-4">
                {/* Goals */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    {t(locale, 'Goals', 'أهداف')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={statsModal.goals}
                    onChange={(e) =>
                      setStatsModal((prev) => ({ ...prev, goals: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-200 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Assists */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    {t(locale, 'Assists', 'تمريرات حاسمة')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={statsModal.assists}
                    onChange={(e) =>
                      setStatsModal((prev) => ({ ...prev, assists: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-200 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* MVP */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    {t(locale, 'MVP', 'أفضل لاعب')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={statsModal.mvp}
                    onChange={(e) =>
                      setStatsModal((prev) => ({ ...prev, mvp: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-200 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                {t(
                  locale,
                  'Matches played will be incremented by 1 automatically.',
                  'سيتم زيادة عدد المباريات بمقدار 1 تلقائيًا.'
                )}
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={saveStats}
                  disabled={loadingUid === statsModal.player.uid}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                >
                  {loadingUid === statsModal.player.uid
                    ? t(locale, 'Saving...', 'جاري الحفظ...')
                    : t(locale, 'Save', 'حفظ')}
                </button>
                <button
                  onClick={closeStatsModal}
                  className="flex-1 rounded-lg border border-slate-700 px-4 py-2.5 font-semibold text-slate-300 transition-colors hover:bg-slate-800"
                >
                  {t(locale, 'Cancel', 'إلغاء')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attributes Edit Modal */}
      <AnimatePresence>
        {attrModal.open && attrModal.player && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={closeAttrModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="mx-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
              dir={locale === 'ar' ? 'rtl' : 'ltr'}
            >
              <h2 className="mb-1 text-xl font-bold text-emerald-400">
                {t(locale, 'Edit Attributes', 'تعديل الطاقات')}
              </h2>
              <p className="mb-6 text-sm text-slate-400">{attrModal.player.fullName}</p>

              <div className="scale-90 origin-top-left md:origin-top w-[111%]">
                <AttributeSliders
                  attributes={attrModal.attributes}
                  onChange={(attr) => setAttrModal(prev => ({ ...prev, attributes: attr }))}
                />
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={saveAttributes}
                  disabled={loadingUid === attrModal.player.uid}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                >
                  {loadingUid === attrModal.player.uid
                    ? t(locale, 'Saving...', 'جاري الحفظ...')
                    : t(locale, 'Save', 'حفظ')}
                </button>
                <button
                  onClick={closeAttrModal}
                  className="flex-1 rounded-lg border border-slate-700 px-4 py-2.5 font-semibold text-slate-300 transition-colors hover:bg-slate-800"
                >
                  {t(locale, 'Cancel', 'إلغاء')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
