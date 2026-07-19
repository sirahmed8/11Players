'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { doc, updateDoc, increment, deleteDoc, setDoc, writeBatch, arrayUnion, serverTimestamp, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateProfilePDF } from '@/lib/pdf';
import { generateDummyPlayersForCommunity } from '@/lib/dummyData';
import EditProfileModal from './EditProfileModal';
import AdminTableRow from './AdminTableRow';
import { useLocale } from '@/components/ThemeProvider';
import AttributeSliders from '@/components/AttributeSliders';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerProfile } from '@/types';
import { PESPosition } from '@/types';
import toast from 'react-hot-toast';
import { useCommunity } from '@/contexts/CommunityContext';
import { useAuth } from '@/contexts/AuthContext';
import { calculateRealisticOverall } from '@/lib/overallCalculator';
import { getAllPlayerCommunities } from '@/lib/playerUtils';
import ManageUserCommunitiesModal from '@/components/ManageUserCommunitiesModal';
import CustomSelect from '@/components/CustomSelect';
import PendingEdits from '@/components/PendingEdits';

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
  primaryPosition?: PESPosition;
  secondaryPosition?: PESPosition | '';
  tertiaryPosition?: PESPosition | '';
  playStyle?: string;
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
    case 'hasWarning':
      return player.hasWarning ? 1 : 0;
    case 'isVerifiedByAdmin':
      return player.isVerifiedByAdmin ? 1 : 0;
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
  const { activeCommunityId } = useCommunity();
  const { isOwner } = useAuth();
  const [manageCommModal, setManageCommModal] = useState<{ open: boolean; player: PlayerProfile | null }>({
    open: false,
    player: null,
  });
  const [sortKey, setSortKey] = useState<SortKey>('fullName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
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

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showDeleteMockModal, setShowDeleteMockModal] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<PlayerProfile | null>(null);
  const [playerToReset, setPlayerToReset] = useState<PlayerProfile | null>(null);
  const [showEndSeasonModal, setShowEndSeasonModal] = useState(false);
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

  const handleEndSeason = async () => {
    setLoadingUid('ending-season');
    setShowEndSeasonModal(false);
    try {
      if (players.length === 0) return;

      const batch = writeBatch(db);
      
      // Calculate winners
      const topScorer = [...players].sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0))[0];
      const topAssister = [...players].sort((a, b) => (b.stats?.assists || 0) - (a.stats?.assists || 0))[0];
      const topMVP = [...players].sort((a, b) => (b.stats?.mvp || 0) - (a.stats?.mvp || 0))[0];
      const ballonDor = [...players].sort((a, b) => {
        const aScore = ((a.stats?.goals || 0) * 2) + ((a.stats?.assists || 0) * 1) + ((a.stats?.mvp || 0) * 5);
        const bScore = ((b.stats?.goals || 0) * 2) + ((b.stats?.assists || 0) * 1) + ((b.stats?.mvp || 0) * 5);
        return bScore - aScore;
      })[0];

      const seasonName = `Season ${new Date().getFullYear()}`;
      const dateStr = new Date().toISOString();

      players.forEach(p => {
        if (!activeCommunityId) return;
        const docRef = doc(db, 'communities', activeCommunityId, 'players', p.uid);
        const updates: any = {
          'stats.goals': 0,
          'stats.assists': 0,
          'stats.mvp': 0,
          'stats.matchesPlayed': 0,
        };
        
        const newTrophies = [];
        if (p.uid === topScorer.uid && (p.stats?.goals || 0) > 0) newTrophies.push({ name: 'Golden Boot', season: seasonName, date: dateStr });
        if (p.uid === topAssister.uid && (p.stats?.assists || 0) > 0) newTrophies.push({ name: 'Playmaker', season: seasonName, date: dateStr });
        if (p.uid === topMVP.uid && (p.stats?.mvp || 0) > 0) newTrophies.push({ name: 'Season MVP', season: seasonName, date: dateStr });
        if (p.uid === ballonDor.uid && ((p.stats?.goals || 0) + (p.stats?.assists || 0) + (p.stats?.mvp || 0) > 0)) newTrophies.push({ name: "Ballon d'Or", season: seasonName, date: dateStr });

        if (newTrophies.length > 0) {
          updates.trophies = arrayUnion(...newTrophies);
          
          // Also award trophies to the global player card
          const globalDocRef = doc(db, 'players', p.uid);
          batch.update(globalDocRef, { trophies: arrayUnion(...newTrophies) });
        }

        batch.update(docRef, updates);
      });

      await batch.commit();
      onRefresh();
      toast.success(t(locale, "Season ended successfully! Trophies awarded and stats reset.", "تم إنهاء الموسم بنجاح! تم توزيع الجوائز وتصفير الإحصائيات."));
    } catch (error) {
      console.error(error);
      toast.error(t(locale, 'Error ending season', 'حدث خطأ أثناء إنهاء الموسم'));
    } finally {
      setLoadingUid(null);
    }
  };

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

  const handleDeleteMockPlayers = async () => {
    setLoadingUid('deleting-mock');
    setShowDeleteMockModal(false);
    try {
      const mockPlayers = players.filter(p => p.isMockData || p.uid.startsWith('test-player-') || p.uid.startsWith('dummy_') || (p.email && p.email.includes('dummy')));
      if (mockPlayers.length === 0) {
        toast.success(t(locale, 'No mock players found', 'لا يوجد لاعبين وهميين'));
        setLoadingUid(null);
        return;
      }
      const batch = writeBatch(db);
      mockPlayers.forEach(p => {
        const commIds = getAllPlayerCommunities(p, activeCommunityId);
        commIds.forEach(cId => {
          batch.delete(doc(db, 'communities', cId, 'players', p.uid));
        });
        batch.delete(doc(db, 'players', p.uid));
      });
      await batch.commit();
      onRefresh();
      toast.success(t(locale, `Successfully deleted ${mockPlayers.length} mock players`, `تم حذف ${mockPlayers.length} لاعب وهمي بنجاح`));
    } catch (error) {
      console.error(error);
      toast.error(t(locale, 'Error deleting mock players', 'حدث خطأ أثناء حذف اللاعبين الوهميين'));
    } finally {
      setLoadingUid(null);
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
      const newOverall = calculateRealisticOverall(attrModal.attributes, pos, style, attrModal.player.height, attrModal.player.weight, attrModal.player.calculatedAge);
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

  const handleDeletePlayer = async () => {
    if (!playerToDelete || !activeCommunityId) return;
    setLoadingUid('deleting-' + playerToDelete.uid);
    try {
      const { arrayRemove } = await import('firebase/firestore');
      
      // Remove from community players
      await deleteDoc(doc(db, 'communities', activeCommunityId, 'players', playerToDelete.uid));
      
      // Update global profile
      await updateDoc(doc(db, 'players', playerToDelete.uid), {
        memberCommunities: arrayRemove(activeCommunityId)
      });

      toast.success(t(locale, "Player kicked successfully!", "تم طرد اللاعب بنجاح!"));
      setPlayerToDelete(null);
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error(t(locale, 'Error kicking player', 'حدث خطأ أثناء طرد اللاعب'));
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
          onClick={() => setShowEndSeasonModal(true)}
          disabled={loadingUid === 'ending-season'}
          className="rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-600 dark:text-amber-500 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
        >
          {loadingUid === 'ending-season' ? 'Ending...' : t(locale, 'End Season', 'إنهاء الموسم')}
        </button>
        <button
          onClick={() => setShowDeleteMockModal(true)}
          disabled={loadingUid === 'deleting-mock'}
          className="rounded-lg bg-red-600/20 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-600/30 transition-colors"
        >
          {loadingUid === 'deleting-mock' ? 'Deleting...' : t(locale, 'Delete All Mock Players', 'حذف جميع اللاعبين الوهميين')}
        </button>

      </div>
      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl">
        <table className="w-full min-w-[900px] text-sm" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={col.key ? () => handleSort(col.key!) : undefined}
                  className={`px-4 py-3 text-left font-semibold text-emerald-600 dark:text-emerald-400 ${
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
            <AnimatePresence mode="popLayout">
              {paginatedPlayers.map((player) => (
                <AdminTableRow
                  key={player.uid}
                  player={player}
                  locale={locale}
                  loadingUid={loadingUid}
                  onToggleWarning={handleToggleWarning}
                  onToggleVerify={handleToggleVerify}
                  onOpenEditModal={(p) => setEditModal({ open: true, player: p })}
                  onOpenAttrModal={openAttrModal}
                  onOpenStatsModal={openStatsModal}
                  onGeneratePDF={(p) => generateProfilePDF(p, locale === 'ar' ? 'ar' : 'en')}
                  onOpenResetModal={(p) => setPlayerToReset(p)}
                  onOpenDeleteModal={(p) => setPlayerToDelete(p)}
                  isOwner={isOwner}
                  onOpenManageCommunitiesModal={isOwner ? (p) => setManageCommModal({ open: true, player: p }) : undefined}
                  pendingEditCount={pendingEditsByPlayer[player.uid] || 0}
                  onOpenSuggestionsModal={(p) => setSuggestionsModalPlayer(p)}
                />
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between gap-4 flex-wrap">
            <div className="text-xs font-bold text-slate-500">
              {locale === 'ar' ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold disabled:opacity-50 disabled:pointer-events-none hover:border-emerald-500 transition-colors"
              >
                {locale === 'ar' ? "السابق" : "Previous"}
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold disabled:opacity-50 disabled:pointer-events-none hover:border-emerald-500 transition-colors"
              >
                {locale === 'ar' ? "التالي" : "Next"}
              </button>
            </div>
          </div>
        )}
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
              className="mx-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl"
              dir={locale === 'ar' ? 'rtl' : 'ltr'}
            >
              <h2 className="mb-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {t(locale, 'Edit Attributes & Positions', 'تعديل الطاقات والمراكز')}
              </h2>
              <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{attrModal.player.fullName}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
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
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700"
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

      {/* Delete Mock Players Modal */}
      <AnimatePresence>
        {showDeleteMockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700"
            >
              <div className="p-6 text-center">
                <h2 className="text-xl font-bold mb-4 text-red-600">
                  {t(locale, 'Delete All Mock Players?', 'هل أنت متأكد من حذف جميع اللاعبين الوهميين؟')}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  {t(locale, 'This will permanently remove all generated test data.', 'هذا الإجراء سيحذف بيانات التجربة بشكل دائم.')}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteMockModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-bold transition-colors"
                  >
                    {t(locale, 'Cancel', 'إلغاء')}
                  </button>
                  <button
                    onClick={handleDeleteMockPlayers}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition-colors shadow-md shadow-red-500/20"
                  >
                    {t(locale, 'Delete', 'حذف')}
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
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700"
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

      {/* Delete Player Modal */}
      <AnimatePresence>
        {playerToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700"
            >
              <div className="p-6 text-center">
                <h2 className="text-xl font-bold mb-4 text-red-600">
                  {t(locale, `Delete ${playerToDelete.fullName}?`, `حذف ${playerToDelete.fullName}؟`)}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  {t(locale, 'This action cannot be undone.', 'هذا الإجراء لا يمكن التراجع عنه.')}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPlayerToDelete(null)}
                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-bold transition-colors"
                  >
                    {t(locale, 'Cancel', 'إلغاء')}
                  </button>
                  <button
                    onClick={handleDeletePlayer}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition-colors shadow-md shadow-red-500/20"
                  >
                    {t(locale, 'Delete', 'حذف')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* End Season Modal */}
      <AnimatePresence>
        {showEndSeasonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700"
            >
              <div className="p-6 text-center">
                <h2 className="text-2xl font-black mb-4 text-amber-600">
                  {t(locale, 'End Season?', 'إنهاء الموسم؟')}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  {t(locale, "This will award trophies to the top players (Ballon d'Or, Golden Boot, etc.) and reset all stats (Goals, Assists, MVPs) to 0 for everyone.", "سيؤدي هذا إلى منح الجوائز لأفضل اللاعبين (الكرة الذهبية، الحذاء الذهبي، إلخ) وتصفير جميع الإحصائيات للجميع.")}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEndSeasonModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-bold transition-colors"
                  >
                    {t(locale, 'Cancel', 'إلغاء')}
                  </button>
                  <button
                    onClick={handleEndSeason}
                    className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold transition-colors shadow-md shadow-amber-500/20"
                  >
                    {t(locale, 'Confirm End Season', 'تأكيد إنهاء الموسم')}
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
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700"
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
    </>
  );
}

