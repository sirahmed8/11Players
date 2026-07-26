"use client";

import React from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import GlobalUsersTable from "@/components/admin/GlobalUsersTable";
import { useLocale } from "@/components/ui/ThemeProvider";
import { Users, ShieldCheck, Sparkles } from "lucide-react";

export default function UsersPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <ProtectedRoute ownerOnly>
      <div className="min-h-screen bg-slate-950 text-white py-8 px-4 sm:px-6 transition-colors" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Banner — Solid Dark Slate */}
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-slate-950 text-emerald-400 border border-slate-800 mb-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>{isAr ? "دليل المستخدمين الشامل" : "Global Users Management Hub"}</span>
                </span>
                <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                  {isAr ? "إدارة جميع مستخدمي المنصة" : "Platform Users Management"}
                </h1>
                <p className="text-xs text-slate-400 mt-1 font-semibold">
                  {isAr 
                    ? "استعرض وسجل جميع لاعبي المنصة، ودرجات النشاط، والمجتمعات، مع إمكانية التطبيق المجمع للذكاء الاصطناعي."
                    : "Manage overall players roster, community memberships, activity scores, and bulk AI choices."}
                </p>
              </div>
            </div>
          </div>

          <GlobalUsersTable />
        </div>
      </div>
    </ProtectedRoute>
  );
}
