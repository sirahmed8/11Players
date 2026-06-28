"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunity } from "@/contexts/CommunityContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useLocale } from "@/components/ThemeProvider";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, Save, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function CommunitySettingsPage() {
  const { isAdmin } = useAuth();
  const { activeCommunityId, communitySettings } = useCommunity();
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  
  const [slowMode, setSlowMode] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!activeCommunityId || !isAdmin) {
      router.push("/communities");
      return;
    }
    setSlowMode(communitySettings.slowModeDelay || 0);
  }, [activeCommunityId, isAdmin, communitySettings, router]);

  const handleSave = async () => {
    if (!activeCommunityId) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "communities", activeCommunityId, "settings", "config"), {
        slowModeDelay: slowMode
      }, { merge: true });
      toast.success(isAr ? "تم حفظ الإعدادات" : "Settings saved");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل حفظ الإعدادات" : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin || !activeCommunityId) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white pt-24 pb-12" dir={isAr ? "rtl" : "ltr"}>
        <main className="max-w-2xl mx-auto px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                <Settings2 className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black">{isAr ? "إعدادات المجتمع" : "Community Settings"}</h1>
            </div>

            <div className="space-y-8">
              {/* Slow Mode Setting */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg">{isAr ? "الوضع البطيء للمحادثة" : "Chat Slow Mode"}</h3>
                  <p className="text-sm text-slate-500">
                    {isAr 
                      ? "تحديد الوقت (بالثواني) الذي يجب أن ينتظره الأعضاء بين إرسال رسالة وأخرى." 
                      : "Set the time (in seconds) members must wait before sending another message."}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <input 
                    type="number" 
                    min="0"
                    max="3600"
                    value={slowMode}
                    onChange={(e) => setSlowMode(Number(e.target.value))}
                    className="w-32 px-4 py-3 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <span className="text-slate-500 font-semibold">{isAr ? "ثانية" : "seconds"}</span>
                </div>
              </div>

              {/* Add more settings here in the future like moderation toggles */}
              
              <div className="pt-8 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-70"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {isAr ? "حفظ التغييرات" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
