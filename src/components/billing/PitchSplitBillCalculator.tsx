"use client";

import React, { useState } from "react";
import { DollarSign, CheckCircle2, Clock, AlertTriangle, Share2, Plus, Trash2, Users, RefreshCw, Copy, Check } from "lucide-react";
import { useLocale } from "@/components/ui/ThemeProvider";
import toast from "react-hot-toast";

export type PaymentStatus = "Paid" | "Pending" | "Overdue";
export type CurrencyCode = "SAR" | "USD" | "EUR" | "EGP";
export type SplitMode = "equal" | "custom";

export interface SplitBillPlayer {
  id: string;
  name: string;
  amount: number;
  status: PaymentStatus;
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

  text += `\nPay via STC Pay / Cash to Captain. Powered by 11Players.`;
  return text;
}

export default function PitchSplitBillCalculator() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [matchName, setMatchName] = useState("Al-Malaz Pitch Match (7v7)");
  const [totalCost, setTotalCost] = useState(350);
  const [currency, setCurrency] = useState<CurrencyCode>("SAR");
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const [players, setPlayers] = useState<SplitBillPlayer[]>([
    { id: "1", name: "Capt. Ahmed", amount: 50, status: "Paid" },
    { id: "2", name: "Sami Al-Jabir", amount: 50, status: "Paid" },
    { id: "3", name: "Omar Homsi", amount: 50, status: "Pending" },
    { id: "4", name: "Tariq Aziz", amount: 50, status: "Pending" },
    { id: "5", name: "Youssef Zaid", amount: 50, status: "Overdue" },
    { id: "6", name: "Fahad Al-Harbi", amount: 50, status: "Paid" },
    { id: "7", name: "Ziyad Qassim", amount: 50, status: "Pending" },
  ]);

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

  const addPlayerRow = () => {
    const newId = (players.length + 1).toString();
    const newPlayer: SplitBillPlayer = {
      id: newId,
      name: `Player ${players.length + 1}`,
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
    if (players.length <= 1) return;
    const updated = players.filter((p) => p.id !== id);
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

  const summary = calculateSplitBillSummary(players);
  const sym = CURRENCY_RATES[currency].symbol;

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-emerald-400" />
            {isAr ? "حاسبة تقسيم حجز الملعب" : "Pitch Split Bill Calculator"}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isAr
              ? "وزّع تكلفة الملعب بالتساوي أو حسب التخصيص، وتابع حالة الدفع الفورية مع دعم العملات والمشاركة."
              : "Automatically calculate equal/custom pitch rent splits and track player payments in real-time."}
          </p>
        </div>

        <button
          onClick={copyShareLink}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
        >
          {copiedShareLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          {copiedShareLink ? (isAr ? "تم النسخ!" : "Copied!") : isAr ? "مشاركة الفاتورة" : "Share Split Summary"}
        </button>
      </div>

      {/* Overview Summary Cards & Progress Meter */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">{isAr ? "إجمالي التكلفة" : "Total Cost"}</span>
          <div className="text-2xl font-black text-white mt-1 font-mono">
            {totalCost} <span className="text-xs text-amber-400 font-sans">{sym}</span>
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
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400"
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
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isAr ? "اختر العملة" : "Select Currency"}
            </label>
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value as CurrencyCode)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400"
            >
              {Object.entries(CURRENCY_RATES).map(([code, config]) => (
                <option key={code} value={code}>
                  {config.label}
                </option>
              ))}
            </select>
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
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            {isAr ? "قائمة اللاعبين وتتبع الدفع" : "Players Payment Roster"} ({players.length})
          </h2>

          <button
            onClick={addPlayerRow}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            {isAr ? "إضافة لاعب" : "Add Player"}
          </button>
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
              {players.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-semibold text-white">
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setPlayers((prev) => prev.map((pl) => (pl.id === p.id ? { ...pl, name: newName } : pl)));
                      }}
                      className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-emerald-400 focus:outline-none text-white font-medium"
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
                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm text-amber-400 w-24 focus:outline-none"
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
                      disabled={players.length <= 1}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg transition-colors disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
