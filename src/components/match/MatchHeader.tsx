"use client";

import React from "react";
import { Calendar, Clock, MapPin, DollarSign, Edit, Trash2, Flag, Share2 } from "lucide-react";
import toast from "react-hot-toast";

interface MatchHeaderProps {
  config: {
    date?: string;
    time?: string;
    location?: string;
    cost?: string;
    notes?: string;
  };
  isAr: boolean;
  isAdmin: boolean;
  isViewingHistory: boolean;
  onOpenRecordModal: () => void;
  onOpenEditModal: () => void;
  onDeleteMatch: () => void;
}

export default function MatchHeader({
  config,
  isAr,
  isAdmin,
  isViewingHistory,
  onOpenRecordModal,
  onOpenEditModal,
  onDeleteMatch,
}: MatchHeaderProps) {
  if (!config) return null;

  const handleShareMatch = () => {
    const text = `⚽ 11Players Match Info:\n📅 ${config.date || 'TBD'} - ⏰ ${config.time || 'TBD'}\n📍 ${config.location || 'TBD'}\n💰 ${config.cost || 'Free'}\n\nJoin us on 11Players!`;
    navigator.clipboard.writeText(text);
    toast.success(isAr ? "تم نسخ تفاصيل المباراة بنجاح!" : "Match details copied!");
  };

  return (
    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-4xl mx-auto shadow-2xl flex flex-wrap justify-between items-center gap-6">
      <div className="flex flex-wrap items-center justify-center gap-6 flex-1">
        {config.date && (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400 text-sm">
              <Calendar className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-start">
              <p className="text-[10px] text-slate-400 font-bold uppercase">{isAr ? "التاريخ" : "Date"}</p>
              <p className="text-white font-black text-xs">{config.date}</p>
            </div>
          </div>
        )}

        {config.time && (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400 text-sm">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-start">
              <p className="text-[10px] text-slate-400 font-bold uppercase">{isAr ? "الوقت" : "Time"}</p>
              <p className="text-white font-black text-xs">{config.time}</p>
            </div>
          </div>
        )}

        {config.location && (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 text-sm">
              <MapPin className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-start">
              <p className="text-[10px] text-slate-400 font-bold uppercase">{isAr ? "الملعب" : "Location"}</p>
              <p className="text-white font-black text-xs">{config.location}</p>
            </div>
          </div>
        )}

        {config.cost && (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 text-sm">
              <DollarSign className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-start">
              <p className="text-[10px] text-slate-400 font-bold uppercase">{isAr ? "التكلفة" : "Cost"}</p>
              <p className="text-white font-black text-xs">{config.cost}</p>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleShareMatch}
        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
        title={isAr ? "مشاركة تفاصيل المباراة" : "Share Match Info"}
      >
        <Share2 className="w-4 h-4" />
        <span>{isAr ? "مشاركة" : "Share"}</span>
      </button>

      {config.notes && (
        <div className="w-full pt-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-300 font-medium whitespace-pre-wrap">
            <span className="font-black text-amber-400">📝 {isAr ? "ملاحظة:" : "Note:"} </span>
            {config.notes}
          </p>
        </div>
      )}

      {isAdmin && !isViewingHistory && (
        <div className="w-full pt-4 border-t border-slate-800 flex flex-wrap justify-center gap-3">
          <button 
            type="button"
            onClick={onOpenRecordModal}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl shadow-md transition-all text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{isAr ? "إنهاء المباراة وتسجيل الإحصائيات" : "End Match & Record Stats"}</span>
          </button>
          <button 
            type="button"
            onClick={onOpenEditModal}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-2xl shadow-md transition-all text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>{isAr ? "تعديل التفاصيل" : "Edit Details"}</span>
          </button>
          <button 
            type="button"
            onClick={onDeleteMatch}
            className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isAr ? "حذف الحجز" : "Delete"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

