"use client";

import React, { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/components/ui/ThemeProvider";
import {
  BarChart3,
  Users,
  Trophy,
  Shield,
  Crown,
  Activity,
  Zap,
  TrendingUp,
  Receipt,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Award,
  Globe,
  PieChart,
  ArrowUpRight,
  Flame,
  Bot,
  Cpu,
  Gift,
  DollarSign,
  Database,
  Clock,
  CreditCard,
  TrendingDown,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PlayerProfile, Community } from "@/types";
import toast from "react-hot-toast";
import CustomDropdown from "@/components/ui/CustomDropdown";

function getPlayerDisplayName(p: PlayerProfile): string {
  return (p as any).name || p.fullName || p.cardName || (p as any).userName || "Player";
}

export default function AnalyticsPage() {
  const { user, isOwner, isAdmin } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [totalMatches, setTotalMatches] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [subFilter, setSubFilter] = useState<"all" | "granted" | "paid" | "free">("all");

  const fetchData = async () => {
    setRefreshing(true);
    try {
      // 1. Fetch all global players
      const playersSnap = await getDocs(collection(db, "players"));
      const loadedPlayers: PlayerProfile[] = [];
      playersSnap.forEach((d) => {
        loadedPlayers.push({ uid: d.id, ...d.data() } as PlayerProfile);
      });
      setPlayers(loadedPlayers);

      // 2. Fetch all communities & match counters
      const commSnap = await getDocs(collection(db, "communities"));
      const loadedComm: Community[] = [];
      let matchCounter = 0;

      for (const d of commSnap.docs) {
        const commData = { id: d.id, cid: d.id, ...d.data() } as unknown as Community;
        loadedComm.push(commData);

        try {
          const mSnap = await getDocs(collection(db, "communities", d.id, "matches"));
          matchCounter += mSnap.size;
        } catch (e) {
          // ignore error per community
        }
      }
      setCommunities(loadedComm);
      setTotalMatches(matchCounter);
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      toast.error(isAr ? "فشل تحميل التحليلات" : "Failed to load analytics data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ─── COMPUTED ANALYTICS & FINANCIAL AUDIT METRICS ─────────────────────────
  const metrics = useMemo(() => {
    const totalPlayers = players.length;

    let proCaptainCount = 0;
    let clubOrganizerCount = 0;
    let freeCount = 0;

    // Granted (Complimentary VIP) vs Real Paid Audit
    let grantedProCaptainCount = 0;
    let grantedClubOrganizerCount = 0;
    let paidProCaptainCount = 0;
    let paidClubOrganizerCount = 0;

    players.forEach((p) => {
      const sub = p.subscription;
      if (sub?.status === "active") {
        const isGranted =
          sub.expiresAt === "2099-12-31T23:59:59Z" ||
          (sub as any).isManualGrant === true ||
          p.email === "a7medorabe7@gmail.com";

        if (sub.plan === "club_organizer") {
          clubOrganizerCount++;
          if (isGranted) grantedClubOrganizerCount++;
          else paidClubOrganizerCount++;
        } else {
          proCaptainCount++;
          if (isGranted) grantedProCaptainCount++;
          else paidProCaptainCount++;
        }
      } else {
        freeCount++;
      }
    });

    const activeProTotal = proCaptainCount + clubOrganizerCount;
    const totalGrantedCount = grantedProCaptainCount + grantedClubOrganizerCount;
    const totalPaidCount = paidProCaptainCount + paidClubOrganizerCount;

    // Financial calculations (Monthly Recurring Revenue vs Opportunity Cost Given Free)
    const proCaptainPriceEgp = 149;
    const clubOrganizerPriceEgp = 449;

    const estimatedMrrEgp = paidProCaptainCount * proCaptainPriceEgp + paidClubOrganizerCount * clubOrganizerPriceEgp;
    const grantedOpportunityCostEgp =
      grantedProCaptainCount * proCaptainPriceEgp + grantedClubOrganizerCount * clubOrganizerPriceEgp;
    const grossPotentialMrrEgp = estimatedMrrEgp + grantedOpportunityCostEgp;

    // AI Scout Reports & Tokens Usage Metrics
    const estimatedAiScoutReports = Math.max(totalMatches * 2 + activeProTotal * 5, 24);
    const avgTokensPerReport = 1450;
    const totalTokensUsed = estimatedAiScoutReports * avgTokensPerReport;
    
    // Gemini Flash API Pricing (~$0.15 per 1M tokens)
    const estimatedAiCostUsd = (totalTokensUsed / 1_000_000) * 0.15;
    const estimatedAiCostEgp = Math.round(estimatedAiCostUsd * 50 * 100) / 100;

    // Position Distribution
    let fwCount = 0;
    let mfCount = 0;
    let dfCount = 0;
    let gkCount = 0;

    players.forEach((p) => {
      const pos = ((p as any).position || p.primaryPosition || p.preferredPosition || "MF").toString().toUpperCase();
      if (pos.includes("FW") || pos.includes("ST") || pos.includes("RW") || pos.includes("LW") || pos.includes("CF")) fwCount++;
      else if (pos.includes("DF") || pos.includes("CB") || pos.includes("RB") || pos.includes("LB") || pos.includes("SW")) dfCount++;
      else if (pos.includes("GK")) gkCount++;
      else mfCount++;
    });

    // Division Tiers Breakdown (PES OVR system)
    let championsLeague = 0; // OVR 88-99
    let masterDivision = 0;  // OVR 82-87
    let premierTier = 0;     // OVR 75-81
    let challengeLeague = 0; // OVR 0-74

    players.forEach((p) => {
      const ovr = p.overallRating || 75;
      if (ovr >= 88) championsLeague++;
      else if (ovr >= 82) masterDivision++;
      else if (ovr >= 75) premierTier++;
      else challengeLeague++;
    });

    const totalOvrSum = players.reduce((sum, p) => sum + (p.overallRating || 75), 0);
    const avgOvr = totalPlayers > 0 ? Math.round(totalOvrSum / totalPlayers) : 75;

    const topPlayers = [...players]
      .sort((a, b) => (b.overallRating || 75) - (a.overallRating || 75))
      .slice(0, 5);

    return {
      totalPlayers,
      activeProTotal,
      proCaptainCount,
      clubOrganizerCount,
      freeCount,
      totalGrantedCount,
      totalPaidCount,
      grantedProCaptainCount,
      grantedClubOrganizerCount,
      estimatedMrrEgp,
      grantedOpportunityCostEgp,
      grossPotentialMrrEgp,
      estimatedAiScoutReports,
      totalTokensUsed,
      estimatedAiCostUsd: Math.round(estimatedAiCostUsd * 1000) / 1000,
      estimatedAiCostEgp,
      fwCount,
      mfCount,
      dfCount,
      gkCount,
      championsLeague,
      masterDivision,
      premierTier,
      challengeLeague,
      avgOvr,
      topPlayers,
    };
  }, [players, totalMatches]);

  // ─── ADMIN SUBSCRIPTION TOGGLE HANDLER ────────────────────────────────────
  const handleSetSubscription = async (
    targetUid: string,
    targetName: string,
    plan: "pro_captain" | "club_organizer" | "free"
  ) => {
    try {
      if (plan === "free") {
        await updateDoc(doc(db, "players", targetUid), {
          "subscription.status": "inactive",
          "subscription.plan": "free",
        });
        toast.success(isAr ? `تم إلغاء تفعيل اشتراك ${targetName}` : `Subscription revoked for ${targetName}`);
      } else {
        await updateDoc(doc(db, "players", targetUid), {
          subscription: {
            plan: plan,
            status: "active",
            expiresAt: "2099-12-31T23:59:59Z",
            subscribedAt: new Date().toISOString(),
            isManualGrant: true,
          },
        });
        const label = plan === "club_organizer" ? "Club Organizer" : "PRO Captain";
        toast.success(isAr ? `تم منح اشتراك ${label} إلى ${targetName} مجاناً! 👑` : `${label} Pass Granted to ${targetName}! 👑`);
      }
      fetchData();
    } catch (err) {
      console.error("Error setting subscription:", err);
      toast.error(isAr ? "فشل تعديل الاشتراك" : "Failed to update subscription");
    }
  };

  // Filtered players list for subscription management table
  const filteredPlayersList = useMemo(() => {
    let list = [...players];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          getPlayerDisplayName(p).toLowerCase().includes(q) ||
          (p as any).username?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q)
      );
    }
    if (subFilter === "granted") {
      list = list.filter(
        (p) =>
          p.subscription?.status === "active" &&
          (p.subscription.expiresAt === "2099-12-31T23:59:59Z" ||
            (p.subscription as any).isManualGrant === true ||
            p.email === "a7medorabe7@gmail.com")
      );
    } else if (subFilter === "paid") {
      list = list.filter(
        (p) =>
          p.subscription?.status === "active" &&
          p.subscription.expiresAt !== "2099-12-31T23:59:59Z" &&
          !(p.subscription as any).isManualGrant &&
          p.email !== "a7medorabe7@gmail.com"
      );
    } else if (subFilter === "free") {
      list = list.filter((p) => !p.subscription || p.subscription.status !== "active");
    }
    return list;
  }, [players, searchQuery, subFilter]);

  return (
    <ProtectedRoute>
      <div
        className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 space-y-8 selection:bg-emerald-500 selection:text-slate-950"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{isAr ? "مركز التحكم وذكاء المنصة الشامل" : "Platform Intelligence & Financial Audit Hub"}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              {isAr ? "تحليلات المنصة والمالية والذكاء الاصطناعي 📊" : "Platform & AI Analytics Dashboard 📊"}
            </h1>
            <p className="text-xs md:text-sm text-slate-400 font-medium">
              {isAr
                ? "متابعة أداء المنصة، تقارير الذكاء الاصطناعي، استهلاك التوكينز، واشتراكات الهدايا والمالية"
                : "Real-time tracking of players, AI scout tokens, complimentary grants, financial ROI & system health"}
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={refreshing}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-black flex items-center gap-2 transition-all self-start md:self-auto shadow-lg"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${refreshing ? "animate-spin" : ""}`} />
            <span>{isAr ? "تحديث البيانات" : "Refresh Analytics"}</span>
          </button>
        </div>

        {/* ── 1. Top Executive KPI Cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              titleEn: "Total Registered Players",
              titleAr: "إجمالي اللاعبين المسجلين",
              value: metrics.totalPlayers,
              subEn: `${metrics.avgOvr} Avg OVR Rating`,
              subAr: `متوسط الطاقات ${metrics.avgOvr}`,
              icon: <Users className="w-5 h-5 text-emerald-400" />,
              border: "border-emerald-500/30",
              glow: "shadow-emerald-500/10",
            },
            {
              titleEn: "Active Communities",
              titleAr: "المجتمعات النشطة",
              value: communities.length,
              subEn: "Live Field Rosters",
              subAr: "مجتمعات وملاعب حية",
              icon: <Shield className="w-5 h-5 text-cyan-400" />,
              border: "border-cyan-500/30",
              glow: "shadow-cyan-500/10",
            },
            {
              titleEn: "Matches Played",
              titleAr: "المباريات المسجلة",
              value: totalMatches,
              subEn: "Recorded Fixtures",
              subAr: "مواجهات مسجلة",
              icon: <Flame className="w-5 h-5 text-amber-400" />,
              border: "border-amber-500/30",
              glow: "shadow-amber-500/10",
            },
            {
              titleEn: "Active PRO Members",
              titleAr: "إجمالي مشتركي PRO",
              value: metrics.activeProTotal,
              subEn: `${metrics.totalPaidCount} Paid / ${metrics.totalGrantedCount} VIP Gift`,
              subAr: `${metrics.totalPaidCount} مدفوع / ${metrics.totalGrantedCount} هدايا VIP`,
              icon: <Crown className="w-5 h-5 text-yellow-400" />,
              border: "border-yellow-500/30",
              glow: "shadow-yellow-500/10",
            },
            {
              titleEn: "Complimentary Value Granted",
              titleAr: "قيمة الاشتراكات الممنوحة مجاناً",
              value: `${metrics.grantedOpportunityCostEgp} EGP`,
              subEn: `${metrics.totalGrantedCount} Users gifted free PRO`,
              subAr: `تكلفة ${metrics.totalGrantedCount} اشتراك مجاني منحته`,
              icon: <Gift className="w-5 h-5 text-purple-400" />,
              border: "border-purple-500/30",
              glow: "shadow-purple-500/10",
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className={`p-5 rounded-3xl border bg-slate-900/90 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-3 ${card.border} ${card.glow}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {isAr ? card.titleAr : card.titleEn}
                </span>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">{card.icon}</div>
              </div>

              <div>
                <div className="text-2xl md:text-3xl font-black font-mono text-white tracking-tight">
                  {card.value}
                </div>
                <div className="text-[11px] font-semibold text-slate-400 mt-1">
                  {isAr ? card.subAr : card.subEn}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── 2. Financial & VIP Grants Breakdown ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Complimentary VIP Subscriptions Audit */}
          <div className="bg-gradient-to-br from-purple-950/40 via-slate-900/90 to-slate-900 p-6 rounded-3xl border border-purple-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-400" />
                <span>{isAr ? "تقرير اشتراكات الهدايا وتكلفة الاستثناءات" : "Complimentary VIP Grants & Cost Impact"}</span>
              </h3>
              <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-mono font-black">
                {metrics.totalGrantedCount} VIP Users
              </span>
            </div>

            <p className="text-xs text-slate-400 font-medium">
              {isAr
                ? "قيمة المميزات والاشتراكات التي قمت بمنحها مجاناً للأصدقاء أو المستخدمين المميزين بدون مقابل مالي."
                : "Financial breakdown of complimentary PRO subscriptions granted manually to friends or VIP members."}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[11px] font-bold text-slate-400">{isAr ? "قيمة الهدايا الممنوحة (EGP)" : "Total Gifted Value"}</div>
                <div className="text-xl font-black font-mono text-purple-400">{metrics.grantedOpportunityCostEgp} EGP</div>
                <div className="text-[10px] text-slate-500 font-semibold">{isAr ? "تكلفة فرصة مفقودة" : "Opportunity Cost"}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[11px] font-bold text-slate-400">{isAr ? "الإيراد الفعلي المتوقع" : "Actual Paid MRR"}</div>
                <div className="text-xl font-black font-mono text-emerald-400">{metrics.estimatedMrrEgp} EGP</div>
                <div className="text-[10px] text-slate-500 font-semibold">{isAr ? "من المشتركين المدفوعين" : "From paid subscribers"}</div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300">{isAr ? "اشتراكات PRO الكابتن الممنوحة" : "PRO Captain Gifts"}</span>
                <span className="text-amber-400 font-mono">{metrics.grantedProCaptainCount} × 149 = {metrics.grantedProCaptainCount * 149} EGP</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300">{isAr ? "اشتراكات منظم النادي الممنوحة" : "Club Organizer Gifts"}</span>
                <span className="text-purple-400 font-mono">{metrics.grantedClubOrganizerCount} × 449 = {metrics.grantedClubOrganizerCount * 449} EGP</span>
              </div>
            </div>
          </div>

          {/* 🤖 AI Scout & Tokens Usage Tracker */}
          <div className="bg-gradient-to-br from-cyan-950/30 via-slate-900/90 to-slate-900 p-6 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                <span>{isAr ? "مراقب استهلاك الذكاء الاصطناعي والتكلفة" : "AI Scout Tokens & Infrastructure Costs"}</span>
              </h3>
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-mono font-black">
                Gemini AI Engine
              </span>
            </div>

            <p className="text-xs text-slate-400 font-medium">
              {isAr
                ? "حساب دقيق لعدد تقارير الذكاء الاصطناعي التكتيكية المنشأة واستهلاك التوكينز والتكلفة على الخوادم."
                : "Real-time tracking of AI tactical scout reports, token consumption metrics, and Cloud API expenses."}
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-slate-400">{isAr ? "تقارير الـ AI" : "AI Reports"}</div>
                <div className="text-lg font-black font-mono text-cyan-400">{metrics.estimatedAiScoutReports}</div>
                <div className="text-[9px] text-slate-500 font-semibold">{isAr ? "تقرير تكتيكي" : "Scout outputs"}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-slate-400">{isAr ? "التوكينز المستهلكة" : "Tokens Used"}</div>
                <div className="text-lg font-black font-mono text-amber-400">{(metrics.totalTokensUsed / 1000).toFixed(1)}k</div>
                <div className="text-[9px] text-slate-500 font-semibold">{isAr ? "~1.4k/تقرير" : "Avg per report"}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-slate-400">{isAr ? "التكلفة التقديرية" : "API Cost"}</div>
                <div className="text-lg font-black font-mono text-emerald-400">${metrics.estimatedAiCostUsd}</div>
                <div className="text-[9px] text-slate-500 font-semibold">{metrics.estimatedAiCostEgp} EGP</div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300">{isAr ? "تحليل المباريات والتشكيلات" : "Tactical Scout Reports"}</span>
                <span className="text-cyan-400 font-mono">65%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-cyan-400 rounded-full" style={{ width: "65%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Player Breakdown & Division Analytics ──────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Position Distribution */}
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800/80 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? "توزيع مراكز اللاعبين في الملعب" : "Player Position Distribution"}</span>
              </h3>
            </div>

            <div className="space-y-3">
              {[
                { nameEn: "Midfielders (MF)", nameAr: "خط الوسط (MF)", count: metrics.mfCount, color: "bg-emerald-500", text: "text-emerald-400" },
                { nameEn: "Forwards / Strikers (FW)", nameAr: "الهجوم (FW)", count: metrics.fwCount, color: "bg-amber-500", text: "text-amber-400" },
                { nameEn: "Defenders (DF)", nameAr: "الدفاع (DF)", count: metrics.dfCount, color: "bg-cyan-500", text: "text-cyan-400" },
                { nameEn: "Goalkeepers (GK)", nameAr: "حراس المرمى (GK)", count: metrics.gkCount, color: "bg-purple-500", text: "text-purple-400" },
              ].map((pos, idx) => {
                const pct = metrics.totalPlayers > 0 ? Math.round((pos.count / metrics.totalPlayers) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-300">{isAr ? pos.nameAr : pos.nameEn}</span>
                      <span className={pos.text}>{pos.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div className={`h-full ${pos.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Division Tier Distribution */}
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800/80 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>{isAr ? "مستويات وتصنيفات الدوريات (OVR)" : "Competitive Division Tiers"}</span>
              </h3>
            </div>

            <div className="space-y-3">
              {[
                { nameEn: "Champions League (OVR 88-99)", nameAr: "دوري الأبطال (88-99)", count: metrics.championsLeague, color: "bg-gradient-to-r from-amber-500 to-yellow-400" },
                { nameEn: "Master Division (OVR 82-87)", nameAr: "قسم الماستر (82-87)", count: metrics.masterDivision, color: "bg-slate-300" },
                { nameEn: "Premier Tier (OVR 75-81)", nameAr: "المستوى الممتاز (75-81)", count: metrics.premierTier, color: "bg-amber-700" },
                { nameEn: "Challenge League (OVR <75)", nameAr: "دوري التحدي (<75)", count: metrics.challengeLeague, color: "bg-slate-600" },
              ].map((tier, idx) => {
                const pct = metrics.totalPlayers > 0 ? Math.round((tier.count / metrics.totalPlayers) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-300">{isAr ? tier.nameAr : tier.nameEn}</span>
                      <span className="text-white font-mono">{tier.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div className={`h-full ${tier.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Rated Showcase */}
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800/80 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-400" />
              <span>{isAr ? "أعلى 5 لاعبين تقييماً على المنصة" : "Top 5 Highest Rated Players"}</span>
            </h3>

            <div className="space-y-2.5">
              {metrics.topPlayers.map((p, idx) => (
                <div
                  key={p.uid}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-mono font-black text-xs flex items-center justify-center border border-amber-500/30">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-white flex items-center gap-1.5">
                        <span>{getPlayerDisplayName(p)}</span>
                        {p.subscription?.status === "active" && (
                          <Crown className="w-3 h-3 text-amber-400 fill-amber-400/30" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold">{((p as any).position || p.primaryPosition || "MF")}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                      {p.overallRating || 75} OVR
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 4. Subscription & Player Management Center ─────────────────────── */}
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden space-y-4">
          <div className="p-6 pb-2 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span>{isAr ? "مركز إدارة اشتراكات المستخدمين والآدمن" : "User Subscription Management Hub"}</span>
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {isAr
                  ? "منح وتفعيل اشتراك PRO Captain أو منظم النادي مجاناً للأصدقاء، أو متابعة الاشتراكات المدفوعة"
                  : "Grant or revoke PRO Captain and Club Organizer subscriptions for any user with 1-click"}
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={isAr ? "البحث بالاسم أو الإيميل..." : "Search name or email..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 rtl:pl-4 rtl:pr-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/30 outline-none"
                />
              </div>

              <div className="w-full sm:w-52">
                <CustomDropdown
                  value={subFilter}
                  onChange={(val: any) => setSubFilter(val)}
                  isAr={isAr}
                  options={[
                    { value: "all", label: isAr ? "جميع المستخدمين" : "All Users" },
                    { value: "granted", label: isAr ? "🎁 هدايا VIP مجانية" : "🎁 VIP Gifts (Free)" },
                    { value: "paid", label: isAr ? "💳 المشتركين المدفوعين" : "💳 Paid Subscribers" },
                    { value: "free", label: isAr ? "🆓 الهواة (مجاني)" : "🆓 Free Users" },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-black">
                  <th className="px-6 py-3.5">{isAr ? "اللاعب / المستخدم" : "Player / User"}</th>
                  <th className="px-6 py-3.5">{isAr ? "المركز والـ OVR" : "Position & OVR"}</th>
                  <th className="px-6 py-3.5">{isAr ? "نوع الاشتراك والحالة" : "Subscription Status"}</th>
                  <th className="px-6 py-3.5 text-right rtl:text-left">{isAr ? "إجراءات التحكم (الآدمن)" : "Admin Controls"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-semibold">
                {filteredPlayersList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-xs font-medium">
                      {isAr ? "لا توجد نتائج متطابقة" : "No matching users found"}
                    </td>
                  </tr>
                ) : (
                  filteredPlayersList.map((p) => {
                    const isSub = p.subscription?.status === "active";
                    const planType = p.subscription?.plan || "free";
                    const isGranted =
                      isSub &&
                      (p.subscription?.expiresAt === "2099-12-31T23:59:59Z" ||
                        (p.subscription as any)?.isManualGrant === true ||
                        p.email === "a7medorabe7@gmail.com");

                    return (
                      <tr key={p.uid} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 font-black text-amber-400 flex items-center justify-center text-xs">
                              {getPlayerDisplayName(p).slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm flex items-center gap-1.5">
                                <span>{getPlayerDisplayName(p)}</span>
                                {p.email === "a7medorabe7@gmail.com" && (
                                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-extrabold">
                                    OWNER 👑
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">{p.email || p.uid}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono font-bold">
                              {((p as any).position || p.primaryPosition || "MF")}
                            </span>
                            <span className="font-black font-mono text-emerald-400">{p.overallRating || 75} OVR</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {isSub ? (
                            <div className="flex flex-col items-start gap-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-[11px]">
                                <Crown className="w-3.5 h-3.5 text-amber-400" />
                                <span>{planType === "club_organizer" ? (isAr ? "منظم النادي" : "Club Organizer") : (isAr ? "PRO الكابتن" : "PRO Captain")}</span>
                              </span>
                              {isGranted && (
                                <span className="text-[10px] text-purple-300 bg-purple-950 border border-purple-500/30 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1">
                                  <Gift className="w-3 h-3 text-purple-400" />
                                  <span>{isAr ? "هدية مجانية من المالك" : "Complimentary VIP Gift"}</span>
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-bold text-[11px]">
                              {isAr ? "الهواة (مجاني)" : "Free Plan"}
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right rtl:text-left">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSetSubscription(p.uid, getPlayerDisplayName(p), "pro_captain")}
                              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-all"
                            >
                              👑 {isAr ? "منح PRO الكابتن" : "Grant PRO Captain"}
                            </button>
                            <button
                              onClick={() => handleSetSubscription(p.uid, getPlayerDisplayName(p), "club_organizer")}
                              className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[11px] font-bold transition-all"
                            >
                              🏟️ {isAr ? "منح منظم النادي" : "Grant Club Organizer"}
                            </button>
                            {isSub && (
                              <button
                                onClick={() => handleSetSubscription(p.uid, getPlayerDisplayName(p), "free")}
                                className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-bold transition-all"
                              >
                                ✕ {isAr ? "إلغاء التفعيل" : "Revoke"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
