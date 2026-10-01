"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { DollarSign, CheckCircle2, Clock, AlertTriangle, Share2, Plus, Trash2, Users, RefreshCw, Copy, Check, Save, FolderOpen, Loader2 } from "lucide-react";
import { useLocale } from "@/components/ui/ThemeProvider";
import toast from "react-hot-toast";
import CustomDropdown from "@/components/ui/CustomDropdown";
import { usePlayers } from "@/contexts/PlayersContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { motion, AnimatePresence } from "framer-motion";
import { microSpringProps } from "@/lib/animations";
import { collection, doc, setDoc, getDocs, deleteDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type PaymentStatus = "Paid" | "Pending" | "Overdue";
export type CurrencyCode = "SAR" | "USD" | "EUR" | "EGP";
export type SplitMode = "equal" | "custom";

export interface SplitBillPlayer {
  id: string;
  name: string;
  amount: number;
  status: PaymentStatus;
}

export interface SavedSplitBill {
  id: string;
  uid: string;
  communityId?: string;
  matchName: string;
  totalCost: number;
  currency: CurrencyCode;
  splitMode: SplitMode;
  players: SplitBillPlayer[];
  idempotencyKey: string;
  updatedAt: string;
}

export const CURRENCY_RATES: Record<CurrencyCode, { rate: number; symbol: string; label: string }> = {
  SAR: { rate: 1.0, symbol: "ر.س", label: "SAR (Saudi Riyal)" },
  USD: { rate: 0.2667, symbol: "$", label: "USD (US Dollar)" },
  EUR: { rate: 0.2450, symbol: "€", label: "EUR (Euro)" },
  EGP: { rate: 12.85, symbol: "ج.م", label: "EGP (Egyptian Pound)" },
};

/**
 * Converts monetary amount between currencies.
 */
export function convertCurrency(amount: number, fromCurrency: CurrencyCode, toCurrency: CurrencyCode): number {
  if (fromCurrency === toCurrency) return Number(amount.toFixed(2));
  const amountInSar = amount / CURRENCY_RATES[fromCurrency].rate;
  const converted = amountInSar * CURRENCY_RATES[toCurrency].rate;
  return Number(converted.toFixed(2));
}

/**
 * Calculates per-player bill allocation for equal or custom modes.
 */
export function calculateSplitBillAllocation(
  totalCost: number,
  playersCount: number,
  mode: SplitMode = "equal",
  customAmounts: Record<string, number> = {}
): { playerAmounts: Record<string, number>; remainingUnallocated: number; totalAllocated: number } {
  if (playersCount <= 0) {
    return { playerAmounts: {}, remainingUnallocated: totalCost, totalAllocated: 0 };
  }

  if (mode === "equal") {
    const equalShare = Number((totalCost / playersCount).toFixed(2));
    const playerAmounts: Record<string, number> = {};
    let totalAllocated = 0;
    for (let i = 0; i < playersCount; i++) {
      const pid = `player_${i + 1}`;
      playerAmounts[pid] = equalShare;
      totalAllocated += equalShare;
    }
    const remainingUnallocated = Number((totalCost - totalAllocated).toFixed(2));
    return { playerAmounts, remainingUnallocated, totalAllocated: Number(totalAllocated.toFixed(2)) };
  } else {
    let totalAllocated = 0;
    Object.values(customAmounts).forEach((amt) => {
      totalAllocated += amt || 0;
    });
    const remainingUnallocated = Number((totalCost - totalAllocated).toFixed(2));
    return {
      playerAmounts: customAmounts,
      remainingUnallocated,
      totalAllocated: Number(totalAllocated.toFixed(2)),
    };
  }
}

/**
 * Calculates summary metrics (total paid, pending, overdue, percentage).
 */
export function calculateSplitBillSummary(items: { amount: number; status: PaymentStatus }[]): {
  totalCost: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  percentPaid: number;
} {
  let totalCost = 0;
  let totalPaid = 0;
  let totalPending = 0;
  let totalOverdue = 0;

  items.forEach((item) => {
    totalCost += item.amount;
    if (item.status === "Paid") totalPaid += item.amount;
    else if (item.status === "Pending") totalPending += item.amount;
    else if (item.status === "Overdue") totalOverdue += item.amount;
  });

  const percentPaid = totalCost > 0 ? Number(((totalPaid / totalCost) * 100).toFixed(1)) : 0;

  return {
    totalCost: Number(totalCost.toFixed(2)),
    totalPaid: Number(totalPaid.toFixed(2)),
    totalPending: Number(totalPending.toFixed(2)),
    totalOverdue: Number(totalOverdue.toFixed(2)),
    percentPaid,
  };
}

/**
 * Formats a shareable bill text summary.
 */
export function generateShareableBillSummary(
  matchName: string,
  totalCost: number,
  currency: CurrencyCode,
  players: SplitBillPlayer[]
): string {
  const sym = CURRENCY_RATES[currency].symbol;
  const summary = calculateSplitBillSummary(players);
  let text = `⚽ *PITCH SPLIT BILL: ${matchName}*\n`;
  text += `💵 Total Pitch Rent: ${summary.totalCost} ${sym}\n`;
  text += `✅ Collected: ${summary.totalPaid} ${sym} (${summary.percentPaid}%)\n\n`;
  text += `*PLAYER BREAKDOWN:*\n`;

  players.forEach((p) => {
    const icon = p.status === "Paid" ? "✅" : p.status === "Pending" ? "⏳" : "🚨";
    text += `${icon} ${p.name}: ${p.amount} ${sym} (${p.status})\n`;
  });

  text += `\nPay via InstaPay / Vodafone Cash / Cash to Captain. Powered by 11Players.`;
  return text;
}

export default function PitchSplitBillCalculator() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [matchName, setMatchName] = useState(isAr ? "مباراة حجز النادي (7v7)" : "Hagoozat Pitch Match (7v7)");
  const [totalCost, setTotalCost] = useState(0);
  const [currency, setCurrency] = useState<CurrencyCode>("EGP");
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const { players: communityPlayers } = usePlayers();
  const { user } = useAuth();
  const { activeCommunityId } = useCommunity();
  const [players, setPlayers] = useState<SplitBillPlayer[]>([]);
  const [selectedCommunityPlayerUid, setSelectedCommunityPlayerUid] = useState<string>('');

  const [savedBills, setSavedBills] = useState<SavedSplitBill[]>([]);
  const [loadingSavedBills, setLoadingSavedBills] = useState(false);
  const [isSavingBill, setIsSavingBill] = useState(false);
  const [showSavedBillsDrawer, setShowSavedBillsDrawer] = useState(false);

  // Fetch saved split bills from Firestore
  const fetchSavedBills = useCallback(async () => {
    if (!user?.uid) return;
    setLoadingSavedBills(true);
    try {
      const q = query(collection(db, "split_bills"), where("uid", "==", user.uid));
      const snap = await getDocs(q);
      const bills: SavedSplitBill[] = [];
      snap.forEach((docSnap) => {
        bills.push(docSnap.data() as SavedSplitBill);
      });
      bills.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
      setSavedBills(bills);
    } catch (err) {
      console.error("Failed to load saved split bills:", err);
    } finally {
      setLoadingSavedBills(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchSavedBills();
  }, [fetchSavedBills]);

  const handleSaveBill = async () => {
    if (!user?.uid) {
      toast.error(isAr ? "يرجى تسجيل الدخول لحفظ الفاتورة" : "Please log in to save this bill");
      return;
    }
    if (players.length === 0) {
      toast.error(isAr ? "يرجى إضافة لاعبين إلى الفاتورة أولاً" : "Please add players before saving");
      return;
    }

    setIsSavingBill(true);
    const billId = `sb_${user.uid.slice(0, 6)}_${Date.now()}`;
    const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const billData: SavedSplitBill = {
      id: billId,
      uid: user.uid,
      communityId: activeCommunityId || "personal",
      matchName,
      totalCost,
      currency,
      splitMode,
      players,
      idempotencyKey,
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, "split_bills", billId), billData);
      toast.success(isAr ? "تم حفظ الفاتورة بنجاح في السحابة" : "Split bill saved to cloud successfully");
      await fetchSavedBills();
    } catch (err) {
      console.error("Error saving split bill:", err);
      toast.error(isAr ? "تعذر حفظ الفاتورة" : "Failed to save bill");
    } finally {
      setIsSavingBill(false);
    }
  };

  const handleDeleteBill = async (billId: string) => {
    try {
      await deleteDoc(doc(db, "split_bills", billId));
      setSavedBills((prev) => prev.filter((b) => b.id !== billId));
      toast.success(isAr ? "تم حذف الفاتورة المحفوظة" : "Saved bill deleted");
    } catch (err) {
      console.error("Failed to delete bill:", err);
      toast.error(isAr ? "تعذر حذف الفاتورة" : "Failed to delete bill");
    }
  };

  const handleLoadBill = (b: SavedSplitBill) => {
    setMatchName(b.matchName);
    setTotalCost(b.totalCost);
    setCurrency(b.currency);
    setSplitMode(b.splitMode);
    setPlayers(b.players);
    toast.success(isAr ? `تم استرجاع "${b.matchName}"` : `Loaded "${b.matchName}"`);
    setShowSavedBillsDrawer(false);
  };

  // Recalculate amounts if equal mode is active
  const handleTotalCostChange = (newCost: number) => {
    setTotalCost(newCost);
    if (splitMode === "equal") {
      const allocation = calculateSplitBillAllocation(newCost, players.length, "equal");
      setPlayers((prev) =>
        prev.map((p, idx) => ({
          ...p,
          amount: allocation.playerAmounts[`player_${idx + 1}`] || 0,
        }))
      );
    }
  };

  const handleSplitModeToggle = (mode: SplitMode) => {
    setSplitMode(mode);
    if (mode === "equal") {
      const allocation = calculateSplitBillAllocation(totalCost, players.length, "equal");
      setPlayers((prev) =>
        prev.map((p, idx) => ({
          ...p,
          amount: allocation.playerAmounts[`player_${idx + 1}`] || 0,
        }))
      );
    }
  };

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    const oldCurrency = currency;
    setCurrency(newCurrency);
    // Convert totalCost and player amounts
    const newTotal = convertCurrency(totalCost, oldCurrency, newCurrency);
    setTotalCost(newTotal);
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        amount: convertCurrency(p.amount, oldCurrency, newCurrency),
      }))
    );
  };

  const togglePlayerStatus = (id: string) => {
    const nextStatusMap: Record<PaymentStatus, PaymentStatus> = {
      Pending: "Paid",
      Paid: "Overdue",
      Overdue: "Pending",
    };
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: nextStatusMap[p.status] } : p))
    );
  };

  const addPlayerRow = (customName?: string) => {
    const newId = `p_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newPlayer: SplitBillPlayer = {
      id: newId,
      name: customName || `Player ${players.length + 1}`,
      amount: splitMode === "equal" ? Number((totalCost / (players.length + 1)).toFixed(2)) : 0,
      status: "Pending",
    };
    const updated = [...players, newPlayer];
    setPlayers(updated);

    if (splitMode === "equal") {
      const allocation = calculateSplitBillAllocation(totalCost, updated.length, "equal");
      setPlayers(
        updated.map((p, idx) => ({
          ...p,
          amount: allocation.playerAmounts[`player_${idx + 1}`] || 0,
        }))
      );
    }
  };

  const removePlayerRow = (id: string) => {
    const updated = players.filter((p) => p.id !== id);
    setPlayers(updated);
    if (splitMode === "equal" && updated.length > 0) {
      const allocation = calculateSplitBillAllocation(totalCost, updated.length, "equal");
      setPlayers(
        updated.map((p, idx) => ({
          ...p,
          amount: allocation.playerAmounts[`player_${idx + 1}`] || 0,
        }))
      );
    }
  };

  const summary = calculateSplitBillSummary(players);
  const sym = CURRENCY_RATES[currency].symbol;
  const displayTotalCost = players.length === 0 ? 0 : (splitMode === "equal" ? totalCost : summary.totalCost);

  const communityPlayerOptions = useMemo(() => {
    if (!communityPlayers) return [];
    return communityPlayers.map((p) => ({
      value: p.uid,
      label: `${p.fullName || p.cardName} (${p.primaryPosition})`,
    }));
  }, [communityPlayers]);

  const copyShareLink = () => {
    const text = generateShareableBillSummary(matchName, totalCost, currency, players);
    navigator.clipboard.writeText(text);
    setCopiedShareLink(true);
    toast.success(isAr ? "تم نسخ ملخص الفاتورة ورابط المشاركة!" : "Split bill text copied to clipboard!");
    setTimeout(() => setCopiedShareLink(false), 2500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col gap-4 bg-slate-900/80 p-5 sm:p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div className="w-full">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <DollarSign className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400 shrink-0" />
            <span>{isAr ? "حاسبة تقسيم حجز الملعب" : "Pitch Split Bill Calculator"}</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            {isAr
              ? "وزّع تكلفة الملعب بالتساوي أو حسب التخصيص، وتابع حالة الدفع الفورية مع دعم العملات والمشاركة."
              : "Automatically calculate equal/custom pitch rent splits and track player payments in real-time."}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-800/60 w-full flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleSaveBill}
              disabled={isSavingBill}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {isSavingBill ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isAr ? "حفظ الفاتورة سحابياً" : "Save to Cloud"}</span>
            </button>

            <button
              onClick={() => {
                fetchSavedBills();
                setShowSavedBillsDrawer(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-amber-400" />
              <span>{isAr ? "الفواتير المحفوظة" : "Saved Bills"}</span>
              {savedBills.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                  {savedBills.length}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={copyShareLink}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            {copiedShareLink ? <Check className="w-4 h-4 shrink-0" /> : <Share2 className="w-4 h-4 shrink-0" />}
            <span>{copiedShareLink ? (isAr ? "تم النسخ!" : "Copied!") : isAr ? "مشاركة الفاتورة" : "Share Split Summary"}</span>
          </button>
        </div>
      </div>

      {/* Saved Bills Modal / Drawer */}
      <AnimatePresence>
        {showSavedBillsDrawer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
              dir={isAr ? "rtl" : "ltr"}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-base text-white">
                    {isAr ? "سجل فواتير الملعب المحفوظة" : "Saved Pitch Split Bills"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowSavedBillsDrawer(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-y-auto space-y-3 flex-1 pe-1">
                {loadingSavedBills ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                    <span className="text-xs">{isAr ? "جاري تحميل الفواتير..." : "Loading saved bills..."}</span>
                  </div>
                ) : savedBills.length === 0 ? (
                  <div className="py-12 text-center space-y-2 text-slate-400">
                    <AlertTriangle className="w-8 h-8 mx-auto text-slate-500 opacity-60" />
                    <p className="text-sm font-bold text-slate-300">
                      {isAr ? "لا توجد فواتير محفوظة بعد" : "No saved split bills found"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {isAr ? "احسب تكلفة الملعب واضغط 'حفظ الفاتورة سحابياً'." : "Calculate a split and click 'Save to Cloud'."}
                    </p>
                  </div>
                ) : (
                  savedBills.map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">{b.matchName}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-emerald-400 font-bold">{b.totalCost} {CURRENCY_RATES[b.currency]?.symbol || b.currency}</span>
                          <span>•</span>
                          <span>{b.players?.length || 0} {isAr ? "لاعب" : "players"}</span>
                          <span>•</span>
                          <span className="text-[10px] text-slate-500">{new Date(b.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleLoadBill(b)}
                          className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl transition-all"
                        >
                          {isAr ? "تحميل" : "Load"}
                        </button>
                        <button
                          onClick={() => handleDeleteBill(b.id)}
                          className="p-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl transition-all"
                          title={isAr ? "حذف الفاتورة" : "Delete bill"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* Overview Summary Cards & Progress Meter */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">{isAr ? "إجمالي التكلفة" : "Total Cost"}</span>
          <div className="text-2xl font-black text-white mt-1 font-mono">
            {displayTotalCost} <span className="text-xs text-amber-400 font-sans">{sym}</span>
          </div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-2xl border border-emerald-500/30">
          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isAr ? "المبلغ المحصل" : "Total Paid"}
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
            {summary.totalPaid} <span className="text-xs text-slate-400 font-sans">{sym}</span>
          </div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-2xl border border-amber-500/30">
          <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {isAr ? "قيد الانتظار" : "Pending"}
          </span>
          <div className="text-2xl font-black text-amber-400 mt-1 font-mono">
            {summary.totalPending} <span className="text-xs text-slate-400 font-sans">{sym}</span>
          </div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-2xl border border-rose-500/30">
          <span className="text-xs text-rose-400 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            {isAr ? "المتأخرات" : "Overdue"}
          </span>
          <div className="text-2xl font-black text-rose-400 mt-1 font-mono">
            {summary.totalOverdue} <span className="text-xs text-slate-400 font-sans">{sym}</span>
          </div>
        </div>
      </div>

      {/* Collected Progress Meter */}
      <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 space-y-3">
        <div className="flex justify-between items-center text-sm font-semibold">
          <span className="text-slate-300">{isAr ? "مقياس نسبة التحصيل الإجمالية" : "Total Collection Meter"}</span>
          <span className="text-emerald-400 font-mono font-bold">{summary.percentPaid}% {isAr ? "مكتمل" : "Collected"}</span>
        </div>

        <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
            style={{ width: `${summary.percentPaid}%` }}
          />
        </div>
      </div>

      {/* Controls & Configuration Bar */}
      <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isAr ? "عنوان المباراة / الملعب" : "Match / Pitch Name"}
            </label>
            <input
              type="text"
              value={matchName}
              onChange={(e) => setMatchName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isAr ? "تكلفة إيجار الملعب" : "Total Rent Cost"}
            </label>
            <input
              type="number"
              value={totalCost}
              onChange={(e) => handleTotalCostChange(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isAr ? "اختر العملة" : "Select Currency"}
            </label>
            <CustomDropdown
              value={currency}
              onChange={(val) => handleCurrencyChange(val as CurrencyCode)}
              isAr={isAr}
              options={Object.entries(CURRENCY_RATES).map(([code, config]) => ({
                value: code,
                label: config.label,
              }))}
            />
          </div>
        </div>

        {/* Split Mode Toggle */}
        <div className="flex items-center gap-4 pt-2">
          <span className="text-xs font-semibold text-slate-300">{isAr ? "نموذج التقسيم:" : "Split Mode:"}</span>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => handleSplitModeToggle("equal")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                splitMode === "equal" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              {isAr ? "تقسيم متساوي (Equal)" : "Equal Split"}
            </button>
            <button
              onClick={() => handleSplitModeToggle("custom")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                splitMode === "custom" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              {isAr ? "مخصص لكل لاعب (Custom)" : "Custom Split"}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Players Roster Table */}
      <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            {isAr ? "قائمة اللاعبين وتتبع الدفع" : "Players Payment Roster"} ({players.length})
          </h2>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {communityPlayers && communityPlayers.length > 0 && (
              <div className="w-56">
                <CustomDropdown
                  value=""
                  onChange={(uid) => {
                    if (!uid) return;
                    const found = communityPlayers.find((p) => p.uid === uid);
                    if (found) {
                      addPlayerRow(found.fullName || found.cardName || 'Player');
                    }
                  }}
                  options={communityPlayerOptions}
                  placeholder={isAr ? "+ إضافة لاعب من المجتمع..." : "+ Select Community Player..."}
                  isAr={isAr}
                />
              </div>
            )}

            <button
              onClick={() => addPlayerRow()}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 border border-emerald-500 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              {isAr ? "إضافة لاعب جديد" : "Add Custom Player"}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">{isAr ? "اسم اللاعب" : "Player Name"}</th>
                <th className="px-4 py-3">{isAr ? "المبلغ المستحق" : "Amount Due"}</th>
                <th className="px-4 py-3">{isAr ? "حالة الدفع (اضغط للتغيير)" : "Payment Status (Click to Toggle)"}</th>
                <th className="px-4 py-3 text-right">{isAr ? "إجراءات" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <AnimatePresence mode="popLayout">
              {players.length === 0 ? (
                <motion.tr 
                  key="empty-state"
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                >
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    {isAr ? "لا يوجد لاعبون في القائمة — اضغط + إضافة لاعب لإضافة الأول" : "No players in payment roster — click + Add Player to start"}
                  </td>
                </motion.tr>
              ) : (
                players.map((p, idx) => (
                <motion.tr 
                  layout
                  key={p.id} 
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={microSpringProps}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-semibold text-white">
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setPlayers((prev) => prev.map((pl) => (pl.id === p.id ? { ...pl, name: newName } : pl)));
                      }}
                      className="bg-transparent border-b border-transparent hover:border-slate-700 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300 text-white font-medium outline-none rounded px-1"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono font-bold">
                    {splitMode === "custom" ? (
                      <input
                        type="number"
                        value={p.amount}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setPlayers((prev) => prev.map((pl) => (pl.id === p.id ? { ...pl, amount: val } : pl)));
                        }}
                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm text-amber-400 w-24 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300 outline-none"
                      />
                    ) : (
                      <span className="text-amber-400">
                        {p.amount} {sym}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePlayerStatus(p.id)}
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                        p.status === "Paid"
                          ? "bg-emerald-950 border border-emerald-500/50 text-emerald-300"
                          : p.status === "Pending"
                          ? "bg-amber-950 border border-amber-500/50 text-amber-300"
                          : "bg-rose-950 border border-rose-500/50 text-rose-300"
                      }`}
                    >
                      {p.status === "Paid" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {p.status === "Pending" && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                      {p.status === "Overdue" && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                      {p.status}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => removePlayerRow(p.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
            </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
