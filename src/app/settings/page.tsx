"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { useLocale, useTheme } from "@/components/ui/ThemeProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { doc, getDoc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  User,
  Shield,
  Trash2,
  Download,
  Bell,
  Cookie,
  Moon,
  Sun,
  Globe,
  Settings2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Save,
  SlidersHorizontal,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, isAdmin, isOwner, logout } = useAuth();
  const { activeCommunityId, communitySettings } = useCommunity();
  const { locale, toggleLocale } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const isAr = locale === "ar";
  const router = useRouter();

  // Settings State
  const [activeTab, setActiveTab] = useState<"account" | "privacy" | "community">("account");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [matchReminders, setMatchReminders] = useState(true);
  const [ratingAlerts, setRatingAlerts] = useState(true);
  
  // Community Slow Mode (for Admins)
  const [slowMode, setSlowMode] = useState<number>(0);
  const [savingCommunity, setSavingCommunity] = useState(false);

  // GDPR Deletion Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (communitySettings?.slowModeDelay !== undefined) {
      setSlowMode(communitySettings.slowModeDelay);
    }
  }, [communitySettings]);

  // Load User Notification Preferences
  useEffect(() => {
    if (!user?.uid) return;
    const fetchUserPrefs = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.notificationPrefs) {
            setEmailNotifications(data.notificationPrefs.email ?? true);
            setMatchReminders(data.notificationPrefs.matchReminders ?? true);
            setRatingAlerts(data.notificationPrefs.ratingAlerts ?? true);
          }
        }
      } catch (err) {
        console.error("Error loading user preferences:", err);
      }
    };
    fetchUserPrefs();
  }, [user?.uid]);

  // Save Communication Preferences
  const handleSaveNotificationPrefs = async (
    newEmail: boolean,
    newReminders: boolean,
    newAlerts: boolean
  ) => {
    if (!user?.uid) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(
        userDocRef,
        {
          notificationPrefs: {
            email: newEmail,
            matchReminders: newReminders,
            ratingAlerts: newAlerts,
            updatedAt: new Date().toISOString(),
          },
        },
        { merge: true }
      );
      toast.success(isAr ? "تم تحديث تفضيلات الإشعارات" : "Notification preferences saved");
    } catch (err) {
      console.error("Failed to update notification preferences:", err);
      toast.error(isAr ? "تعذر حفظ التفضيلات" : "Failed to save preferences");
    }
  };

  // GDPR Art. 15: Export Personal Data
  const handleExportData = async () => {
    if (!user?.uid) return;
    setIsExporting(true);
    try {
      const playerDocRef = doc(db, "players", user.uid);
      const userDocRef = doc(db, "users", user.uid);

      const [playerSnap, userSnap] = await Promise.all([
        getDoc(playerDocRef),
        getDoc(userDocRef),
      ]);

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        gdprSubjectId: user.uid,
        userAuth: {
          email: user.email,
          displayName: user.displayName,
          phoneNumber: user.phoneNumber,
        },
        playerProfile: playerSnap.exists() ? playerSnap.data() : null,
        userData: userSnap.exists() ? userSnap.data() : null,
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `11players_data_${user.uid.slice(0, 8)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast.success(isAr ? "تم تصدير ملف بياناتك الشخصية بنجاح" : "Personal data exported successfully");
    } catch (err) {
      console.error("Error exporting data:", err);
      toast.error(isAr ? "فشل تصدير البيانات" : "Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  // GDPR Art. 17: Account & Data Deletion
  const handleDeleteAccount = async () => {
    const requiredConfirmation = isAr ? "حذف" : "DELETE";
    if (deleteConfirmationText.trim() !== requiredConfirmation && deleteConfirmationText.trim().toUpperCase() !== "DELETE") {
      toast.error(
        isAr
          ? `يرجى كتابة كلمة "${requiredConfirmation}" لتأكيد الحذف`
          : `Please type "${requiredConfirmation}" to confirm deletion`
      );
      return;
    }

    if (!user?.uid) return;
    setIsDeleting(true);

    try {
      // 1. Delete player profile
      const playerDocRef = doc(db, "players", user.uid);
      await deleteDoc(playerDocRef);

      // 2. Anonymize/Delete user record
      const userDocRef = doc(db, "users", user.uid);
      await deleteDoc(userDocRef);

      // 3. Clear local storage tokens
      try {
        localStorage.removeItem("cookieConsent");
      } catch {}

      toast.success(
        isAr
          ? "تم مسح بياناتك الشخصية بالكامل بنجاح"
          : "Your account and personal data have been permanently deleted"
      );

      setShowDeleteModal(false);
      await logout();
      router.push("/");
    } catch (err) {
      console.error("Error deleting account:", err);
      toast.error(
        isAr
          ? "حدث خطأ أثناء معالجة طلب الحذف، يرجى التواصل مع الدعم"
          : "Failed to delete account. Please contact support@11players.com"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Save Community Slow Mode (Admin)
  const handleSaveCommunity = async () => {
    if (!activeCommunityId || !isAdmin) return;
    setSavingCommunity(true);
    try {
      await setDoc(
        doc(db, "communities", activeCommunityId, "settings", "config"),
        { slowModeDelay: slowMode },
        { merge: true }
      );
      toast.success(isAr ? "تم حفظ إعدادات المجتمع" : "Community settings saved");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل حفظ الإعدادات" : "Failed to save settings");
    } finally {
      setSavingCommunity(false);
    }
  };

  const handleOpenCookiePreferences = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-cookie-banner"));
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950 text-white pt-24 pb-16" dir={isAr ? "rtl" : "ltr"}>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
                <Settings2 className="w-7 h-7 text-emerald-400" />
                <span>{isAr ? "إعدادات الحساب والخصوصية" : "Account & Privacy Settings"}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {isAr
                  ? "إدارة هويتك، تفضيلات الإشعارات، والامتثال لحماية البيانات (GDPR)."
                  : "Manage your account, communication preferences, and data privacy rights."}
              </p>
            </div>
            
            {/* Quick Lang/Theme Toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLocale}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? "English" : "العربية"}</span>
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                aria-label="Toggle Theme"
              >
                {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <button
              onClick={() => setActiveTab("account")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === "account"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <User className="w-4 h-4" />
              <span>{isAr ? "الحساب والإشعارات" : "Account & Alerts"}</span>
            </button>
            <button
              onClick={() => setActiveTab("privacy")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === "privacy"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>{isAr ? "الخصوصية والبيانات (GDPR)" : "Privacy & Data (GDPR)"}</span>
            </button>
            {(isAdmin || isOwner) && activeCommunityId && (
              <button
                onClick={() => setActiveTab("community")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === "community"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Settings2 className="w-4 h-4" />
                <span>{isAr ? "إدارة المجتمع" : "Community Management"}</span>
              </button>
            )}
          </div>

          {/* TAB 1: ACCOUNT & NOTIFICATIONS */}
          {activeTab === "account" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Account Identity Card */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-400" />
                  <span>{isAr ? "معلومات الحساب" : "Account Identity"}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                    <span className="text-xs text-slate-400 font-medium">{isAr ? "الاسم" : "Full Name"}</span>
                    <div className="text-sm font-bold text-white mt-1">{user?.displayName || "Player"}</div>
                  </div>
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                    <span className="text-xs text-slate-400 font-medium">{isAr ? "البريد الإلكتروني" : "Email Address"}</span>
                    <div className="text-sm font-bold text-white mt-1 truncate">{user?.email || "—"}</div>
                  </div>
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                    <span className="text-xs text-slate-400 font-medium">{isAr ? "معرف المستخدم (UID)" : "User ID (UID)"}</span>
                    <div className="text-xs font-mono text-slate-300 mt-1 truncate">{user?.uid}</div>
                  </div>
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                    <span className="text-xs text-slate-400 font-medium">{isAr ? "مستوى الصلاحية" : "Role"}</span>
                    <div className="text-sm font-bold text-emerald-400 mt-1">
                      {isOwner ? "Platform Owner" : isAdmin ? "Community Admin" : "Verified Player"}
                    </div>
                  </div>
                </div>
              </div>

              {/* CAN-SPAM Communication Preferences */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Bell className="w-5 h-5 text-teal-400" />
                      <span>{isAr ? "تفضيلات الإشعارات والتواصل" : "Communication & Alert Preferences"}</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {isAr
                        ? "تحكم في الإشعارات ورسائل البريد وفقاً لمعايير مكافحة البريد المزعج (CAN-SPAM)."
                        : "Control match reminders and announcements in compliance with CAN-SPAM regulations."}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <label className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
                    <div>
                      <div className="text-sm font-bold text-white">
                        {isAr ? "تنبيهات وتذكير المباريات" : "Match Reminders & Squad Calls"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {isAr
                          ? "إشعار عند تأكيد موعد مباراة أو تغيير تشكيلة الفريق."
                          : "Notifications when a match is booked or squad roster changes."}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={matchReminders}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setMatchReminders(val);
                        handleSaveNotificationPrefs(emailNotifications, val, ratingAlerts);
                      }}
                      className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
                    <div>
                      <div className="text-sm font-bold text-white">
                        {isAr ? "إشعارات تقييمات الأداء والجوائز" : "Peer Ratings & Awards"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {isAr
                          ? "إشعار فوري عند حصولك على تقييم نجوم أو شارة أفضل لاعب (MVP)."
                          : "Alerts when teammates rate your performance or you win MVP."}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={ratingAlerts}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setRatingAlerts(val);
                        handleSaveNotificationPrefs(emailNotifications, matchReminders, val);
                      }}
                      className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
                    <div>
                      <div className="text-sm font-bold text-white">
                        {isAr ? "رسائل البريد الإلكتروني الهامة" : "Email Communications"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {isAr
                          ? "إرسال إيصالات الاسترداد وتحديثات الحساب القانونية (يمكن إلغاء الاشتراك بنقرة واحدة)."
                          : "Transactional receipts and policy updates (one-click unsubscribe anytime)."}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setEmailNotifications(val);
                        handleSaveNotificationPrefs(val, matchReminders, ratingAlerts);
                      }}
                      className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: PRIVACY & GDPR COMPLIANCE */}
          {activeTab === "privacy" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* GDPR Portability & Export (Art. 15 / Art. 20) */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Download className="w-5 h-5 text-emerald-400" />
                      <span>{isAr ? "تصدير البيانات الشخصية (GDPR Art. 15 & 20)" : "Personal Data Portability (GDPR Art. 15 & 20)"}</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl">
                      {isAr
                        ? "لك الحق القانوني في الحصول على نسخة مهيكلة ومقروءة آلياً من جميع بياناتك الرياضية المسجلة على المنصة."
                        : "Download a machine-readable JSON archive of your player profile, attributes, and preferences."}
                    </p>
                  </div>
                  <button
                    onClick={handleExportData}
                    disabled={isExporting}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all shrink-0 active:scale-98 disabled:opacity-50"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-emerald-400" />}
                    <span>{isAr ? "تحميل نسخة JSON" : "Download JSON"}</span>
                  </button>
                </div>
              </div>

              {/* Cookie Preferences Management */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Cookie className="w-5 h-5 text-amber-400" />
                      <span>{isAr ? "إدارة ملفات الارتباط (Cookie Consent)" : "Cookie Consent & Tracking"}</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl">
                      {isAr
                        ? "تعديل تفضيلات الموافقة على ملفات تعريف الارتباط في أي وقت. نحن نعتمد فقط على الملفات الضرورية ولا نستخدم كوكيز إعلانية خارجية."
                        : "Modify cookie consent choices at any time. We strictly use essential tokens for security."}
                    </p>
                  </div>
                  <button
                    onClick={handleOpenCookiePreferences}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all shrink-0 active:scale-98"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                    <span>{isAr ? "تعديل التفضيلات" : "Manage Cookies"}</span>
                  </button>
                </div>
              </div>

              {/* GDPR Right to Erasure / Account Deletion (Art. 17) */}
              <div className="bg-red-950/20 border border-red-900/40 rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
                      <Trash2 className="w-5 h-5 text-red-400" />
                      <span>{isAr ? "طلب حذف الحساب والبيانات (GDPR Art. 17)" : "Account & Data Erasure (GDPR Art. 17)"}</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                      {isAr
                        ? "الحق في النسيان: سيتم حذف بطاقتك الرياضية، إحصائياتك، تقييماتك، وجميع بيانات هويتك نهائياً من خوادمنا دون إمكانية الاسترجاع."
                        : "Permanently purge your player profile, attributes, ratings, and account records with immediate effect."}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setDeleteConfirmationText("");
                      setShowDeleteModal(true);
                    }}
                    className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 active:scale-98"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{isAr ? "طلب الحذف النهائي" : "Delete My Data"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: COMMUNITY ADMIN MANAGEMENT */}
          {activeTab === "community" && (isAdmin || isOwner) && activeCommunityId && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-emerald-400" />
                  <span>{isAr ? "الوضع البطيء لمحادثة المجتمع" : "Chat Slow Mode Delay"}</span>
                </h2>
                <p className="text-xs text-slate-400">
                  {isAr
                    ? "تحديد الوقت (بالثواني) الذي يجب أن ينتظره الأعضاء بين كل رسالة وأخرى لتفادي السبام."
                    : "Set seconds members must wait before sending another message in chat."}
                </p>

                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="0"
                    max="3600"
                    value={slowMode}
                    onChange={(e) => setSlowMode(Number(e.target.value))}
                    className="w-32 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-emerald-500 outline-none"
                  />
                  <span className="text-xs font-bold text-slate-400">{isAr ? "ثانية" : "seconds"}</span>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={handleSaveCommunity}
                    disabled={savingCommunity}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                  >
                    {savingCommunity ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{isAr ? "حفظ الإعدادات" : "Save Changes"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* GDPR Deletion Confirmation Modal */}
          <AnimatePresence>
            {showDeleteModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900 border border-red-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                    <AlertTriangle className="w-7 h-7" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white">
                      {isAr ? "تأكيد حذف الحساب والبيانات" : "Confirm Account Erasure"}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {isAr
                        ? `هذا الإجراء نهائي ولا يمكن التراجع عنه. لتأكيد رغبتك في حذف بياناتك بالكامل وفقاً لقانون حماية البيانات، اكتب "حذف" أدناه:`
                        : `This action is permanent and cannot be undone. To permanently erase your data per GDPR Art. 17, type "DELETE" below:`}
                    </p>
                  </div>

                  <input
                    type="text"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    placeholder={isAr ? "اكتب حذف للتأكيد" : 'Type "DELETE" to confirm'}
                    className="w-full px-4 py-3 bg-slate-950 border border-red-500/30 rounded-xl text-center text-sm font-bold text-white focus:border-red-500 outline-none"
                    autoFocus
                  />

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      disabled={isDeleting}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
                    >
                      {isAr ? "إلغاء" : "Cancel"}
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950/50 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      <span>{isAr ? "تأكيد الحذف النهائي" : "Erase Forever"}</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </ProtectedRoute>
  );
}
