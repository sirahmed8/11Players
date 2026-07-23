'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import { doc, updateDoc, increment, deleteDoc, setDoc, writeBatch, arrayUnion, serverTimestamp, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateProfilePDF } from '@/lib/pdf';
import { generateDummyPlayersForCommunity } from '@/lib/dummyData';
import { exportPlayersToCSV, importPlayersFromCSV } from '@/lib/csvUtils';
import EditProfileModal from '@/components/player/EditProfileModal';
import AdminTableRow from '@/components/admin/AdminTableRow';
import { useLocale } from '@/components/ui/ThemeProvider';
import AttributeSliders from '@/components/player/AttributeSliders';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerProfile } from '@/types';
import { PESPosition } from '@/types';
import toast from 'react-hot-toast';
import { useCommunity } from '@/contexts/CommunityContext';
import { useAuth } from '@/contexts/AuthContext';
import { calculateRealisticOverall } from '@/lib/overallCalculator';
import { getAllPlayerCommunities } from '@/lib/playerUtils';
import ManageUserCommunitiesModal from '@/components/community/ManageUserCommunitiesModal';
import CustomSelect from '@/components/ui/CustomSelect';
import PendingEdits from '@/components/admin/PendingEdits';
import SkillsChecklist from '@/components/player/SkillsChecklist';
import { Crown, Sparkles } from 'lucide-react';
import { getPlayerOverall } from '@/lib/playerUtils';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface AdminTableProps {
  players: PlayerProfile[];
  onRefresh: () => void;
}

type SortKey =
  | 'fullName'
  | 'primaryPosition'
  | 'calculatedAge'
  | 'preferredFoot'
  | 'overallRating'
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
  primaryPosition?: PESPosition;
  secondaryPosition?: PESPosition | '';
  tertiaryPosition?: PESPosition | '';
  playStyle?: string;
  preferredFoot?: string;
  specialSkills?: string[];
}

const POSITIONS: PESPosition[] = ['CF', 'SS', 'LWF', 'RWF', 'AMF', 'CMF', 'DMF', 'RMF', 'LMF', 'CB', 'RB', 'LB', 'GK'];
const PLAY_STYLES = ['Goal Poacher', 'Fox in the Box', 'Target Man', 'Deep-Lying Forward', 'Dummy Runner', 'Creative Playmaker', 'Hole Player', 'Classic No. 10', 'Prolific Winger', 'Roaming Flank', 'Cross Specialist', 'Orchestrator', 'Box-to-Box', 'The Destroyer', 'Anchor Man', 'Build Up', 'Extra Frontman', 'Offensive Full-back', 'Defensive Full-back', 'Full-back Finisher', 'Offensive Goalkeeper', 'Defensive Goalkeeper'];

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
    case 'overallRating':
      return getPlayerOverall(player);
    case 'stats.goals':
      return player.stats?.goals || 0;
    case 'stats.assists':
      return player.stats?.assists || 0;
    default:
      return '';
  }
}

export default function AdminTable({ players, onRefresh }: AdminTableProps) {
  const { locale } = useLocale();
  const { activeCommunityId, activeCommunity } = useCommunity();
  const { isOwner } = useAuth();
  const [manageCommModal, setManageCommModal] = useState<{ open: boolean; player: PlayerProfile | null }>({
    open: false,
    player: null,
  });
  const [sortKey, setSortKey] = useState<SortKey>('fullName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importingCsv, setImportingCsv] = useState(false);
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
      offensiveAwareness: 40, ballControl: 40, dribbling: 40,
      lowPass: 40, loftedPass: 40, finishing: 40, heading: 40,
      speed: 40, acceleration: 40, kickingPower: 40, jump: 40,
      physicalContact: 40, balance: 40, stamina: 40,
      defensiveAwareness: 40, ballWinning: 40, aggression: 40,
      gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40
    },
  });
  const [editModal, setEditModal] = useState<{ open: boolean; player: PlayerProfile | null }>({
    open: false,
    player: null,
  });
  const [loadingUid, setLoadingUid] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void> | void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const handleApplyAIToAllPlayers = () => {
    setConfirmModal({
      isOpen: true,
      title: locale === 'ar' ? 'تطبيق اختيار الذكاء الاصطناعي الأفضل للجميع' : 'Apply AI Best Choice to All Players',
      message: locale === 'ar'
        ? `هل أنت متأكد من تحليل طاقات جميع اللاعبين (${players.length}) وتحديد وحفظ المركز الأساسي وأسلوب اللعب الأنسب لكل لاعب تلقائياً في قاعدة البيانات؟`
        : `Are you sure you want to analyze all (${players.length}) players and save their AI-recommended primary position & play style directly to the database?`,
      onConfirm: async () => {
        try {
          const { getTacticalSuggestions } = await import('@/lib/suggestionEngine');
          let count = 0;

          const batchSize = 350;
          for (let i = 0; i < players.length; i += batchSize) {
            const batch = writeBatch(db);
            const chunk = players.slice(i, i + batchSize);

            chunk.forEach((p) => {
              const suggestions = getTacticalSuggestions(
                p.attributes,
                p.height || 175,
                p.weight || 70,
                p.preferredFoot || 'Right',
                p.calculatedAge,
                p.peerRatingAvg,
                p.peerRatingCount
              );

              const topChoice    = suggestions.positions[0];
              const secondChoice = suggestions.positions[1];
              const thirdChoice  = suggestions.positions[2];
              if (topChoice) {
                const bestPos    = topChoice.position;
                const secondPos  = secondChoice?.position || '';
                const thirdPos   = thirdChoice?.position || '';
                const bestStyle  = topChoice.bestPlayStyle || p.playStyle || 'Box-to-Box';

                const updates: any = {
                  primaryPosition:   bestPos,
                  secondaryPosition: secondPos,
                  tertiaryPosition:  thirdPos,
                  playStyle:         bestStyle,
                };

                batch.update(doc(db, 'players', p.uid), updates);

                if (activeCommunityId) {
                  batch.update(doc(db, 'communities', activeCommunityId, 'players', p.uid), updates);
                }
                count++;
              }
            });

            await batch.commit();
          }

          toast.success(
            locale === 'ar'
              ? `تم تطبيق أفضل مراكز وأساليب الذكاء الاصطناعي لـ ${count} لاعب بنجاح! ⚡`
              : `Successfully applied AI best choices to ${count} players! ⚡`
          );
          onRefresh();
        } catch (err) {
          console.error('Failed to apply AI choices to all:', err);
          toast.error(locale === 'ar' ? 'فشل تطبيق خيارات الذكاء الاصطناعي' : 'Failed to apply AI choices');
        }
      },
    });
  };

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<PlayerProfile | null>(null);
  const [moderationAction, setModerationAction] = useState<'kick' | 'ban' | 'mute' | 'unmute'>('kick');
  const [moderationMessage, setModerationMessage] = useState('');
  const [playerToReset, setPlayerToReset] = useState<PlayerProfile | null>(null);
  const [pendingEditsByPlayer, setPendingEditsByPlayer] = useState<Record<string, number>>({});
  const [suggestionsModalPlayer, setSuggestionsModalPlayer] = useState<PlayerProfile | null>(null);

  // Subscribe to pending edits to show per-player badge (both community and global suggestions)
  useEffect(() => {
    if (!activeCommunityId) return;
    const qComm = query(
      collection(db, `communities/${activeCommunityId}/editRequests`),
      where('status', '==', 'pending')
    );
    const qGlobal = query(
      collection(db, 'editRequests'),
      where('status', '==', 'pending')
    );
    
    let commCounts: Record<string, number> = {};
    let globalCounts: Record<string, number> = {};

    const updateCombined = () => {
      const counts: Record<string, number> = {};
      Object.entries(commCounts).forEach(([k, v]) => counts[k] = (counts[k] || 0) + v);
      Object.entries(globalCounts).forEach(([k, v]) => counts[k] = (counts[k] || 0) + v);
      setPendingEditsByPlayer(counts);
    };

    const unsubComm = onSnapshot(qComm, (snap) => {
      commCounts = {};
      snap.docs.forEach(d => {
        const pid = d.data().playerId;
        if (pid) commCounts[pid] = (commCounts[pid] || 0) + 1;
      });
      updateCombined();
    });

    const unsubGlobal = onSnapshot(qGlobal, (snap) => {
      globalCounts = {};
      snap.docs.forEach(d => {
        const pid = d.data().playerId;
        if (pid) globalCounts[pid] = (globalCounts[pid] || 0) + 1;
      });
      updateCombined();
    });

    return () => {
      unsubComm();
      unsubGlobal();
    };
  }, [activeCommunityId]);

  const handleGeneratePlayers = async () => {
    setLoadingUid('generating-players');
    setShowGenerateModal(false);
    try {
      if (!activeCommunityId) return;
      await generateDummyPlayersForCommunity(activeCommunityId);
      onRefresh();
      toast.success(t(locale, "Successfully generated 32 players!", "تم إنشاء 32 لاعب بنجاح!"));
    } catch (error) {
      console.error(error);
      toast.error(t(locale, 'Error generating players', 'حدث خطأ أثناء إنشاء اللاعبين'));
    } finally {
      setLoadingUid(null);
    }
  };

  const handleExportCSV = () => {
    if (!activeCommunityId) return;
    exportPlayersToCSV(players, activeCommunityId);
    toast.success(t(locale, 'Exported to CSV successfully', 'تم التصدير إلى CSV بنجاح'));
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !activeCommunityId) return;
    const file = e.target.files[0];
    
    setImportingCsv(true);
    try {
      const count = await importPlayersFromCSV(file, activeCommunityId);
      onRefresh();
      toast.success(t(locale, `Successfully imported ${count} players!`, `تم استيراد ${count} لاعبين بنجاح!`));
    } catch (err) {
      console.error('Failed to import CSV:', err);
      toast.error(t(locale, 'Error importing from CSV', 'حدث خطأ أثناء الاستيراد من CSV'));
    } finally {
      setImportingCsv(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
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
  }, [players, sortKey, sortDir]);

  const totalPages = Math.ceil(sortedPlayers.length / itemsPerPage) || 1;
  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedPlayers.slice(start, start + itemsPerPage);
  }, [sortedPlayers, currentPage, itemsPerPage]);

  const handleToggleWarning = async (player: PlayerProfile) => {
    if (!activeCommunityId) return;
    setLoadingUid(player.uid);
    try {
      const docRef = doc(db, 'communities', activeCommunityId, 'players', player.uid);
      await updateDoc(docRef, { hasWarning: !player.hasWarning });
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle warning:', err);
    } finally {
      setLoadingUid(null);
    }
  };

  const handleToggleVerify = async (player: PlayerProfile) => {
    if (!activeCommunityId) return;
    setLoadingUid(player.uid);
    try {
      const docRef = doc(db, 'communities', activeCommunityId, 'players', player.uid);
      await updateDoc(docRef, { isVerifiedByAdmin: !player.isVerifiedByAdmin });
      onRefresh();
      toast.success(t(locale, 'Verification status updated', 'تم تحديث حالة التوثيق'));
    } catch (error) {
      console.error(error);
      toast.error(t(locale, 'Error updating verification status', 'حدث خطأ أثناء التحديث'));
    } finally {
      setLoadingUid(null);
    }
  };

  const openAttrModal = (player: PlayerProfile) => {
    setAttrModal({
      open: true,
      player,
      attributes: { ...player.attributes },
      primaryPosition: player.primaryPosition || 'CMF',
      secondaryPosition: player.secondaryPosition || '',
      tertiaryPosition: player.tertiaryPosition || '',
      playStyle: player.playStyle || '',
      preferredFoot: player.preferredFoot || 'Right',
      specialSkills: player.specialSkills || [],
    });
  };

  const closeAttrModal = () => {
    setAttrModal({
      open: false,
      player: null,
      attributes: { 
        offensiveAwareness: 40, ballControl: 40, dribbling: 40,
        lowPass: 40, loftedPass: 40, finishing: 40, heading: 40,
        speed: 40, acceleration: 40, kickingPower: 40, jump: 40,
        physicalContact: 40, balance: 40, stamina: 40,
        defensiveAwareness: 40, ballWinning: 40, aggression: 40,
        gkAwareness: 40, gkCatching: 40, gkClearing: 40, gkReflexes: 40, gkReach: 40
      },
      preferredFoot: 'Right',
      specialSkills: [],
    });
  };

  const handleUpdateAttributes = async () => {
    if (!attrModal.player || !activeCommunityId) return;
    setLoadingUid('attr-' + attrModal.player.uid);
    try {
      const pos = attrModal.primaryPosition || attrModal.player.primaryPosition || 'CMF';
      const secPos = attrModal.secondaryPosition !== undefined ? attrModal.secondaryPosition : (attrModal.player.secondaryPosition || '');
      const tertPos = attrModal.tertiaryPosition !== undefined ? attrModal.tertiaryPosition : (attrModal.player.tertiaryPosition || '');
      const style = attrModal.playStyle !== undefined ? attrModal.playStyle : (attrModal.player.playStyle || '');
      const foot = attrModal.preferredFoot !== undefined ? attrModal.preferredFoot : (attrModal.player.preferredFoot || 'Right');
      const skills = attrModal.specialSkills !== undefined ? attrModal.specialSkills : (attrModal.player.specialSkills || []);
      const newOverall = calculateRealisticOverall(attrModal.attributes, pos, style, attrModal.player.height, attrModal.player.weight, attrModal.player.calculatedAge, attrModal.player.peerRatingAvg, attrModal.player.peerRatingCount, foot);
      const batch = writeBatch(db);
      const commIds = getAllPlayerCommunities(attrModal.player, activeCommunityId);
      const updatePayload = {
        attributes: attrModal.attributes,
        approvedAttributes: attrModal.attributes,
        overallRating: newOverall,
        primaryPosition: pos,
        secondaryPosition: secPos,
        tertiaryPosition: tertPos,
        playStyle: style,
        preferredFoot: foot,
        specialSkills: skills,
      };
      for (const commId of commIds) {
        const commRef = doc(db, 'communities', commId as string, 'players', attrModal.player.uid);
        batch.set(commRef, updatePayload, { merge: true });
      }

      const globalRef = doc(db, 'players', attrModal.player.uid);
      batch.set(globalRef, updatePayload, { merge: true });

      try {
        const notifRef = doc(db, 'users', attrModal.player.uid, 'notifications', `rating_update_${Date.now()}`);
        batch.set(notifRef, {
          title: t(locale, "🌟 OVR Rating & Attributes Updated!", "🌟 تم تحديث طاقاتك وتقييمك العام!"),
          body: t(
            locale,
            `Your OVR Rating is now ${newOverall} (${pos}). Check your updated skills and profile card!`,
            `تقييمك العام أصبح الآن ${newOverall} (${pos}). تفقد بطاقتك وطاقاتك المحدثة في ملفك الشخصي!`
          ),
          type: "updates",
          read: false,
          link: `/profile?uid=${attrModal.player.uid}`,
          createdAt: serverTimestamp()
        });
      } catch (nErr) {
        console.error("Failed to queue rating notification:", nErr);
      }

      await batch.commit();
      onRefresh();
      closeAttrModal();
      toast.success(t(locale, 'Attributes & Overall Rating updated successfully', 'تم تحديث الطاقات والتقييم العام بنجاح'));
    } catch (error) {
      console.error(error);
      toast.error(t(locale, 'Error updating attributes', 'حدث خطأ أثناء تحديث الطاقات'));
    } finally {
      setLoadingUid(null);
    }
  };

  const handleResetSinglePlayer = async () => {
    if (!playerToReset || !activeCommunityId) return;
    setLoadingUid('resetting-' + playerToReset.uid);
    try {
      const resetStats = { goals: 0, assists: 0, mvp: 0, matchesPlayed: 0 };
      const commRef = doc(db, 'communities', activeCommunityId, 'players', playerToReset.uid);
      await setDoc(commRef, { stats: resetStats }, { merge: true });

      const globalRef = doc(db, 'players', playerToReset.uid);
      await setDoc(globalRef, { stats: resetStats, [`communityStats.${activeCommunityId}`]: resetStats }, { merge: true });

      onRefresh();
      toast.success(t(locale, 'Stats reset successfully', 'تم تصفير الإحصائيات بنجاح'));
      setPlayerToReset(null);
    } catch (error) {
      console.error(error);
      toast.error(t(locale, 'Error resetting stats', 'حدث خطأ أثناء تصفير الإحصائيات'));
    } finally {
      setLoadingUid(null);
    }
  };

  const handleModeratePlayer = async () => {
    if (!playerToDelete || !activeCommunityId) return;
    setLoadingUid('mod-' + playerToDelete.uid);
    try {
      const { arrayRemove } = await import('firebase/firestore');

      if (moderationAction === 'kick') {
        await deleteDoc(doc(db, 'communities', activeCommunityId, 'players', playerToDelete.uid));
        await updateDoc(doc(db, 'players', playerToDelete.uid), {
          memberCommunities: arrayRemove(activeCommunityId)
        });
      } else if (moderationAction === 'ban') {
        await deleteDoc(doc(db, 'communities', activeCommunityId, 'players', playerToDelete.uid));
        await setDoc(doc(db, 'communities', activeCommunityId, 'bannedPlayers', playerToDelete.uid), {
          bannedAt: serverTimestamp(),
          reason: moderationMessage || 'No reason specified',
          fullName: playerToDelete.fullName
        });
        await updateDoc(doc(db, 'players', playerToDelete.uid), {
          memberCommunities: arrayRemove(activeCommunityId)
        });
      } else if (moderationAction === 'mute' || moderationAction === 'unmute') {
        const isMuted = moderationAction === 'mute';
        await updateDoc(doc(db, 'communities', activeCommunityId, 'players', playerToDelete.uid), {
          isMuted,
          muteMessage: isMuted ? moderationMessage : ''
        });
        await updateDoc(doc(db, 'players', playerToDelete.uid), {
          isMuted,
          muteMessage: isMuted ? moderationMessage : ''
        });
      }

      try {
        const notifRef = doc(collection(db, `users/${playerToDelete.uid}/notifications`), `mod_${Date.now()}`);
        const titles: Record<string, string> = {
          kick: locale === 'ar' ? 'تم طردك من المجتمع' : 'You have been kicked from the community',
          ban: locale === 'ar' ? 'تم حظرك من المجتمع' : 'You have been banned from the community',
          mute: locale === 'ar' ? 'تم كتم حسابك في المجتمع' : 'You have been muted in the community',
          unmute: locale === 'ar' ? 'تم إلغاء كتم حسابك' : 'Your account has been unmuted',
        };
        await setDoc(notifRef, {
          type: 'moderation',
          title: titles[moderationAction],
          body: moderationMessage ? `${titles[moderationAction]}: "${moderationMessage}"` : titles[moderationAction],
          read: false,
          createdAt: serverTimestamp(),
          link: '/community'
        });
      } catch (notifErr) {
        console.warn("Could not send moderation notification:", notifErr);
      }

      toast.success(
        t(
          locale,
          `Player ${moderationAction}ed successfully!`,
          `تم تنفيذ إجراء (${moderationAction === 'kick' ? 'طرد' : moderationAction === 'ban' ? 'حظر' : moderationAction === 'mute' ? 'كتم' : 'إلغاء كتم'}) بنجاح!`
        )
      );
      setPlayerToDelete(null);
      setModerationMessage('');
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error(t(locale, 'Error executing moderation action', 'حدث خطأ أثناء تنفيذ الإجراء'));
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

  const handleUpdateStats = async () => {
    if (!statsModal.player || !activeCommunityId) return;
    setLoadingUid('stats-' + statsModal.player.uid);
    try {
      // 1. Update Community Stats safely using setDoc with merge: true
      const communityDocRef = doc(db, 'communities', activeCommunityId, 'players', statsModal.player.uid);
      await setDoc(communityDocRef, {
        stats: {
          goals: increment(statsModal.goals),
          assists: increment(statsModal.assists),
          mvp: increment(statsModal.mvp),
          matchesPlayed: increment(1),
        }
      }, { merge: true });

      // 2. Update Global Stats safely
      const globalDocRef = doc(db, 'players', statsModal.player.uid);
      await setDoc(globalDocRef, {
        stats: {
          goals: increment(statsModal.goals),
          assists: increment(statsModal.assists),
          mvp: increment(statsModal.mvp),
          matchesPlayed: increment(1),
        },
        [`communityStats.${activeCommunityId}`]: {
          goals: increment(statsModal.goals),
          assists: increment(statsModal.assists),
          mvp: increment(statsModal.mvp),
          matchesPlayed: increment(1),
        }
      }, { merge: true }).catch(err => console.error("Global stat update failed:", err));

      try {
        const notifRef = doc(db, 'users', statsModal.player.uid, 'notifications', `stat_update_${Date.now()}`);
        await setDoc(notifRef, {
          title: t(locale, "⚽ Stats Updated!", "⚽ تحديث الإحصائيات!"),
          body: t(
            locale,
            `Your stats were updated by admin (+${statsModal.goals} goals, +${statsModal.assists} assists)`,
            `تم تحديث إحصائياتك من قبل المسؤول (+${statsModal.goals} أهداف، +${statsModal.assists} تمريرات حاسمة)`
          ),
          type: "stats",
          read: false,
          link: `/profile?uid=${statsModal.player.uid}`,
          createdAt: serverTimestamp()
        });
      } catch (nErr) {
        console.error("Failed to notify player:", nErr);
      }

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
    { key: 'overallRating', en: 'Overall', ar: 'التقييم' },
    { key: 'stats.goals', en: 'Goals', ar: 'أهداف' },
    { key: 'stats.assists', en: 'Assists', ar: 'تمريرات' },
    { key: null, en: 'Actions', ar: 'إجراءات' },
  ];

  if (players.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-16 text-center"
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
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-400">
          {t(locale, 'No players found', 'لا يوجد لاعبين')}
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t(locale, 'Players will appear here once registered.', 'سيظهر اللاعبون هنا بعد التسجيل.')}
        </p>
      </motion.div>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap justify-end gap-3">
        <button
          onClick={handleApplyAIToAllPlayers}
          className="flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 text-sm font-black text-white shadow-md shadow-purple-600/20 transition-all active:scale-95"
          title={t(locale, 'Apply AI best position & play style to all players', 'تطبيق أفضل مركز وأسلوب لعب من الذكاء الاصطناعي على جميع اللاعبين')}
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>{t(locale, 'Apply AI Best to All Players', 'تطبيق اختيار الذكاء الاصطناعي للجميع')}</span>
        </button>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {t(locale, 'Export CSV', 'تصدير CSV')}
        </button>
        <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
          {importingCsv ? t(locale, 'Importing...', 'جاري الاستيراد...') : t(locale, 'Import CSV', 'استيراد CSV')}
          <input
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImportCSV}
            disabled={importingCsv}
          />
        </label>
      </div>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl">
        <table className="w-full min-w-[900px] text-sm" style={{ tableLayout: 'fixed' }} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
          <colgroup>
            <col style={{ width: '22%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '24%' }} />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={col.key ? () => handleSort(col.key!) : undefined}
                  className={`px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400 ${
                    col.key ? 'cursor-pointer select-none transition-colors hover:text-emerald-500 dark:hover:text-emerald-300' : ''
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
              {paginatedPlayers.map((player) => (
                <AdminTableRow
                  key={player.uid}
                  player={player}
                  locale={locale}
                  loadingUid={loadingUid}
                  onOpenEditModal={(p) => setEditModal({ open: true, player: p })}
                  onOpenAttrModal={openAttrModal}
                  onOpenStatsModal={openStatsModal}
                  onGeneratePDF={(p) => generateProfilePDF(p, locale === 'ar' ? 'ar' : 'en')}
                  onOpenResetModal={(p) => setPlayerToReset(p)}
                  onOpenDeleteModal={(p) => setPlayerToDelete(p)}
                  isOwner={isOwner}
                  pendingEditCount={pendingEditsByPlayer[player.uid] || 0}
                  onOpenSuggestionsModal={(p) => setSuggestionsModalPlayer(p)}
                />
              ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3.5">
        {paginatedPlayers.map((player) => {
          const photo = player.photoUrl || player.googlePic || (player as any).photoURL || (player as any).userPic || "";
          const pendingCount = pendingEditsByPlayer[player.uid] || 0;
          return (
            <div key={player.uid} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {photo ? (
                    <Image
                      src={photo}
                      alt={player.fullName}
                      width={44}
                      height={44}
                      referrerPolicy="no-referrer"
                      className="h-11 w-11 rounded-full object-cover ring-2 ring-emerald-500/30 shrink-0"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-sm font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                      {player.fullName?.charAt(0) || "?"}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-slate-900 dark:text-white truncate text-sm">
                      {player.fullName}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">
                      {player.cardName} • {player.primaryPosition || 'CMF'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-xs text-slate-400 uppercase font-bold">{locale === 'ar' ? 'التقييم' : 'OVR'}</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {player.overallRating ?? '—'}
                  </span>
                </div>
              </div>

              {/* Badges & Stats summary */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">{locale === 'ar' ? 'العمر' : 'Age'}</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{player.calculatedAge || 20}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">{locale === 'ar' ? 'أهداف' : 'Goals'}</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{player.stats?.goals || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">{locale === 'ar' ? 'تمرات' : 'Assists'}</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{player.stats?.assists || 0}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                {/* Suggestions / Pending Edits */}
                <button
                  onClick={() => setSuggestionsModalPlayer(player)}
                  className="relative rounded-xl bg-amber-50 dark:bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400 transition-colors hover:bg-amber-100"
                  title={t(locale, "Review Suggestions", "مراجعة الاقتراحات")}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setEditModal({ open: true, player })}
                  className="rounded-xl bg-indigo-50 dark:bg-indigo-600/20 p-2.5 text-indigo-600 dark:text-indigo-400 transition-colors hover:bg-indigo-100"
                  title={t(locale, "Edit Profile", "تعديل الملف الشخصي")}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </button>

                <button
                  onClick={() => openAttrModal(player)}
                  className="rounded-xl bg-purple-50 dark:bg-purple-600/20 p-2.5 text-purple-600 dark:text-purple-400 transition-colors hover:bg-purple-100"
                  title={t(locale, "Edit Attributes", "تعديل الطاقات")}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                  </svg>
                </button>

                <button
                  onClick={() => openStatsModal(player)}
                  className="rounded-xl bg-emerald-50 dark:bg-emerald-600/20 p-2.5 text-emerald-600 dark:text-emerald-400 transition-colors hover:bg-emerald-100"
                  title={t(locale, "Edit Stats", "تعديل الإحصائيات")}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>

                <button
                  onClick={() => generateProfilePDF(player, locale === 'ar' ? 'ar' : 'en')}
                  className="rounded-xl bg-blue-50 dark:bg-blue-600/20 p-2.5 text-blue-600 dark:text-blue-400 transition-colors hover:bg-blue-100"
                  title={t(locale, "Export PDF", "تصدير PDF")}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </button>

                <button
                  onClick={() => setPlayerToReset(player)}
                  disabled={loadingUid === player.uid}
                  className="rounded-xl bg-orange-50 dark:bg-orange-600/20 p-2.5 text-orange-600 dark:text-orange-400 transition-colors hover:bg-orange-100 disabled:opacity-50"
                  title={t(locale, "Reset Stats", "تصفير الإحصائيات")}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </button>

                <button
                  onClick={() => setPlayerToDelete(player)}
                  disabled={loadingUid === player.uid}
                  className="rounded-xl bg-red-50 dark:bg-red-600/20 p-2.5 text-red-600 dark:text-red-400 transition-colors hover:bg-red-100 disabled:opacity-50"
                  title={t(locale, "Moderation (Kick / Ban / Mute)", "إجراءات إدارية (طرد / حظر / كتم)")}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Clean Standalone Pagination Bar */}
      {totalPages > 1 && (
        <div className="mt-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg flex items-center justify-between gap-4 flex-wrap">
          <div className="text-xs font-bold text-slate-500">
            {locale === 'ar' ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold disabled:opacity-40 disabled:pointer-events-none hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
            >
              {locale === 'ar' ? "السابق" : "Previous"}
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold disabled:opacity-40 disabled:pointer-events-none hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
            >
              {locale === 'ar' ? "التالي" : "Next"}
            </button>
          </div>
        </div>
      )}

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
              className="mx-4 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl"
              dir={locale === 'ar' ? 'rtl' : 'ltr'}
            >
              <h2 className="mb-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {t(locale, 'Update Stats', 'تحديث الإحصائيات')}
              </h2>
              <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{statsModal.player.fullName}</p>

              <div className="space-y-4">
                {/* Goals */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t(locale, 'Goals', 'أهداف')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={statsModal.goals}
                    onChange={(e) =>
                      setStatsModal((prev) => ({ ...prev, goals: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none transition-all duration-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:shadow-[0_0_12px_rgba(16,185,129,0.25)] focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>

                {/* Assists */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t(locale, 'Assists', 'تمريرات حاسمة')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={statsModal.assists}
                    onChange={(e) =>
                      setStatsModal((prev) => ({ ...prev, assists: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none transition-all duration-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:shadow-[0_0_12px_rgba(16,185,129,0.25)] focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>

                {/* MVP */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t(locale, 'MVP', 'أفضل لاعب')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={statsModal.mvp}
                    onChange={(e) =>
                      setStatsModal((prev) => ({ ...prev, mvp: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none transition-all duration-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:shadow-[0_0_12px_rgba(16,185,129,0.25)] focus:bg-white dark:focus:bg-slate-900"
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
                  onClick={handleUpdateStats}
                  disabled={loadingUid === statsModal.player.uid}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                >
                  {loadingUid === statsModal.player.uid
                    ? t(locale, 'Saving...', 'جاري الحفظ...')
                    : t(locale, 'Save', 'حفظ')}
                </button>
                <button
                  onClick={closeStatsModal}
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
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
              className="mx-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl"
              dir={locale === 'ar' ? 'rtl' : 'ltr'}
            >
              <h2 className="mb-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {t(locale, 'Edit Attributes, Positions & Skills', 'تعديل الطاقات والمراكز والمهارات')}
              </h2>
              <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{attrModal.player.fullName}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    {t(locale, 'Primary Position', 'المركز الأساسي')}
                  </label>
                  <CustomSelect
                    value={attrModal.primaryPosition || attrModal.player.primaryPosition || 'CMF'}
                    onChange={(val) => setAttrModal(prev => ({ ...prev, primaryPosition: val as PESPosition }))}
                    options={POSITIONS.map(p => ({ value: p, label: p }))}
                    className="w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    {t(locale, 'Secondary Position', 'المركز الثانوي')}
                  </label>
                  <CustomSelect
                    value={attrModal.secondaryPosition !== undefined ? attrModal.secondaryPosition : (attrModal.player.secondaryPosition || '')}
                    onChange={(val) => setAttrModal(prev => ({ ...prev, secondaryPosition: val as any }))}
                    options={[
                      { value: '', label: t(locale, 'None', 'بدون') },
                      ...POSITIONS.map(p => ({ value: p, label: p }))
                    ]}
                    className="w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    {t(locale, 'Tertiary Position', 'المركز الثالث')}
                  </label>
                  <CustomSelect
                    value={attrModal.tertiaryPosition !== undefined ? attrModal.tertiaryPosition : (attrModal.player.tertiaryPosition || '')}
                    onChange={(val) => setAttrModal(prev => ({ ...prev, tertiaryPosition: val as any }))}
                    options={[
                      { value: '', label: t(locale, 'None', 'بدون') },
                      ...POSITIONS.map(p => ({ value: p, label: p }))
                    ]}
                    className="w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    {t(locale, 'Play Style', 'أسلوب اللعب')}
                  </label>
                  <CustomSelect
                    value={attrModal.playStyle !== undefined ? attrModal.playStyle : (attrModal.player.playStyle || '')}
                    onChange={(val) => setAttrModal(prev => ({ ...prev, playStyle: val }))}
                    options={[
                      { value: '', label: t(locale, 'None', 'بدون') },
                      ...PLAY_STYLES.map(s => ({ value: s, label: s }))
                    ]}
                    className="w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    {t(locale, 'Preferred Foot', 'القدم المفضلة')}
                  </label>
                  <CustomSelect
                    value={attrModal.preferredFoot !== undefined ? attrModal.preferredFoot : (attrModal.player.preferredFoot || 'Right')}
                    onChange={(val) => setAttrModal(prev => ({ ...prev, preferredFoot: val }))}
                    options={[
                      { value: 'Right', label: t(locale, 'Right', 'اليمنى') },
                      { value: 'Left', label: t(locale, 'Left', 'اليسرى') },
                      { value: 'Ambidextrous', label: t(locale, 'Ambidextrous', 'كلتا القدمين') }
                    ]}
                    className="w-full text-xs"
                  />
                </div>
              </div>

              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {t(locale, 'Special Skills', 'المهارات الخاصة')}
                </label>
                <SkillsChecklist
                  selectedSkills={attrModal.specialSkills !== undefined ? attrModal.specialSkills : (attrModal.player.specialSkills || [])}
                  onSkillsChange={(s) => setAttrModal(prev => ({ ...prev, specialSkills: s }))}
                  locale={(locale as 'en' | 'ar') ?? 'ar'}
                />
              </div>

              <div className="w-full flex justify-center py-2 overflow-x-hidden">
                <div className="w-full max-w-full">
                  <AttributeSliders
                    attributes={attrModal.attributes}
                    onChange={(attr) => setAttrModal(prev => ({ ...prev, attributes: attr }))}
                    locale={(locale as 'en' | 'ar') ?? 'ar'}
                    primaryPosition={attrModal.primaryPosition || attrModal.player?.primaryPosition}
                    playStyle={attrModal.playStyle !== undefined ? attrModal.playStyle : attrModal.player?.playStyle}
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleUpdateAttributes}
                  disabled={loadingUid === attrModal.player.uid}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                >
                  {loadingUid === attrModal.player.uid
                    ? t(locale, 'Saving...', 'جاري الحفظ...')
                    : t(locale, 'Save', 'حفظ')}
                </button>
                <button
                  onClick={closeAttrModal}
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {t(locale, 'Cancel', 'إلغاء')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {editModal.player && (
        <EditProfileModal
          player={editModal.player}
          isOpen={editModal.open}
          onClose={() => setEditModal({ open: false, player: null })}
          onRefresh={onRefresh}
        />
      )}
      {/* Generate Players Modal */}
      <AnimatePresence>
        {showGenerateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700"
            >
              <div className="p-6 text-center">
                <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                  {t(locale, 'Generate 32 Random Players?', 'هل أنت متأكد من إنشاء 32 لاعب عشوائي؟')}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  {t(locale, 'This will add them to your live database.', 'سيتم إضافتهم إلى قاعدة البيانات الخاصة بك.')}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowGenerateModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-bold transition-colors"
                  >
                    {t(locale, 'Cancel', 'إلغاء')}
                  </button>
                  <button
                    onClick={handleGeneratePlayers}
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors shadow-md shadow-emerald-500/20"
                  >
                    {t(locale, 'Confirm', 'تأكيد')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Stats Modal */}
      <AnimatePresence>
        {playerToReset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700"
            >
              <div className="p-6 text-center">
                <h2 className="text-xl font-bold mb-4 text-amber-600">
                  {t(locale, `Reset Stats for ${playerToReset.fullName}?`, `تصفير إحصائيات ${playerToReset.fullName}؟`)}
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPlayerToReset(null)}
                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-bold transition-colors"
                  >
                    {t(locale, 'Cancel', 'إلغاء')}
                  </button>
                  <button
                    onClick={handleResetSinglePlayer}
                    className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold transition-colors shadow-md shadow-amber-500/20"
                  >
                    {t(locale, 'Reset Stats', 'تصفير الإحصائيات')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Moderation Actions Modal (Kick / Ban / Mute) */}
      <AnimatePresence>
        {playerToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {t(locale, `Moderation: ${playerToDelete.fullName}`, `إدارة اللاعب: ${playerToDelete.fullName}`)}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t(locale, 'Select action and optional notification message', 'اختر الإجراء واكتب رسالة اختيارية')}
                    </p>
                  </div>
                </div>

                {/* Action Choice Grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { id: 'kick', en: 'Kick from Community', ar: 'طرد من المجتمع', descEn: 'Remove player from roster', descAr: 'إزالة اللاعب من قائمة المجتمع', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' },
                    { id: 'ban', en: 'Ban Player', ar: 'حظر دائم', descEn: 'Remove & prevent re-joining', descAr: 'إزالة ومنع الانضمام مجدداً', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30' },
                    { id: 'mute', en: 'Mute Account', ar: 'كتم الحساب', descEn: 'Prevent messages/suggestions', descAr: 'منع إرسال الرسائل أو الاقتراحات', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30' },
                    { id: 'unmute', en: 'Unmute Account', ar: 'إلغاء الكتم', descEn: 'Restore messaging rights', descAr: 'إعادة صلاحيات إرسال الرسائل', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' }
                  ].map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setModerationAction(act.id as any)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        moderationAction === act.id
                          ? `${act.color} ring-2 ring-current font-bold shadow-md scale-[1.02]`
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-sm font-bold">{locale === 'ar' ? act.ar : act.en}</div>
                      <div className="text-[11px] opacity-75 mt-0.5">{locale === 'ar' ? act.descAr : act.descEn}</div>
                    </button>
                  ))}
                </div>

                {/* Optional Message */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                    {t(locale, 'Optional Message / Reason (Sent to Player Notification)', 'رسالة / سبب اختيارية (تُرسل كإشعار للاعب)')}
                  </label>
                  <textarea
                    value={moderationMessage}
                    onChange={(e) => setModerationMessage(e.target.value)}
                    placeholder={t(locale, 'e.g. Violation of community fair play guidelines...', 'مثال: مخالفة تعليمات وقوانين المجتمع...')}
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPlayerToDelete(null);
                      setModerationMessage('');
                    }}
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-2xl font-bold text-sm transition-colors"
                  >
                    {t(locale, 'Cancel', 'إلغاء')}
                  </button>
                  <button
                    type="button"
                    onClick={handleModeratePlayer}
                    disabled={loadingUid === 'mod-' + playerToDelete.uid}
                    className={`flex-1 px-4 py-3 text-white rounded-2xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                      moderationAction === 'ban' || moderationAction === 'kick'
                        ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20'
                        : moderationAction === 'mute'
                        ? 'bg-orange-600 hover:bg-orange-500 shadow-orange-500/20'
                        : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                    } disabled:opacity-50`}
                  >
                    {loadingUid === 'mod-' + playerToDelete.uid ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      t(locale, `Confirm ${moderationAction.toUpperCase()}`, `تأكيد ${moderationAction === 'kick' ? 'الطرد' : moderationAction === 'ban' ? 'الحظر' : moderationAction === 'mute' ? 'الكتم' : 'إلغاء الكتم'}`)
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ManageUserCommunitiesModal
        user={manageCommModal.player}
        isOpen={manageCommModal.open}
        onClose={() => setManageCommModal({ open: false, player: null })}
        onRefresh={onRefresh}
      />

      {/* Per-Player Suggestions Modal */}
      <AnimatePresence>
        {suggestionsModalPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-slate-900/70 backdrop-blur-sm overflow-y-auto"
            onClick={() => setSuggestionsModalPlayer(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {t(locale, 'Pending Suggestions', 'الاقتراحات المعلقة')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {suggestionsModalPlayer.fullName}
                  </p>
                </div>
                <button
                  onClick={() => setSuggestionsModalPlayer(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-4">
                <PendingEdits filterPlayerId={suggestionsModalPlayer.uid} inlineMode={true} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}

