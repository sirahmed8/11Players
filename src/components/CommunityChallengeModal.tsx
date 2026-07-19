"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, doc, onSnapshot, setDoc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/components/ThemeProvider";
import toast from "react-hot-toast";
import { PlayerProfile, Community } from "@/types";
import { Loader2, Send, CheckCircle2, Users, Shield, Calendar, MapPin, Clock } from "lucide-react";

export interface CommunityChallenge {
  id: string;
  challengerCommunityId: string;
  challengerCommunityName: string;
  targetCommunityId: string;
  targetCommunityName: string;
  status: 'negotiating' | 'deal_reached' | 'approved' | 'rejected';
  challengeDetails: {
    date?: string;
    time?: string;
    location?: string;
    format?: string;
    notes?: string;
  };
  messages: {
    senderUid: string;
    senderName: string;
    communityId: string;
    text: string;
    timestamp: string;
  }[];
  challengerAgreed?: boolean;
  targetAgreed?: boolean;
  challengerSquadUids?: string[];
  targetSquadUids?: string[];
  approvedMatchId?: string;
}

interface CommunityChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCommunityId: string;
  activeCommunityName: string;
  targetCommunity?: Community | null;
  existingChallengeId?: string | null;
}

export default function CommunityChallengeModal({
  isOpen,
  onClose,
  activeCommunityId,
  activeCommunityName,
  targetCommunity,
  existingChallengeId
}: CommunityChallengeModalProps) {
  const { user, isAdmin } = useAuth();
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [challenge, setChallenge] = useState<CommunityChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // Challenge details state when creating new
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [formatInput, setFormatInput] = useState("5v5 Turf");
  const [notesInput, setNotesInput] = useState("");

  // Squad selection state
  const [myCommunityPlayers, setMyCommunityPlayers] = useState<PlayerProfile[]>([]);
  const [selectedSquadUids, setSelectedSquadUids] = useState<string[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [submittingSquad, setSubmittingSquad] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (existingChallengeId) {
      const unsub = onSnapshot(doc(db, "community_challenges", existingChallengeId), (docSnap) => {
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as CommunityChallenge;
          setChallenge(data);
          const isChallenger = data.challengerCommunityId === activeCommunityId;
          const mySquad = isChallenger ? (data.challengerSquadUids || []) : (data.targetSquadUids || []);
          setSelectedSquadUids(mySquad);
        }
        setLoading(false);
      });
      return () => unsub();
    } else if (targetCommunity) {
      setChallenge({
        id: `challenge_${Date.now()}`,
        challengerCommunityId: activeCommunityId,
        challengerCommunityName: activeCommunityName,
        targetCommunityId: targetCommunity.id,
        targetCommunityName: targetCommunity.name,
        status: 'negotiating',
        challengeDetails: {},
        messages: []
      });
      setLoading(false);
    }
  }, [isOpen, existingChallengeId, targetCommunity, activeCommunityId, activeCommunityName]);

  // Load players for squad selection when deal is reached
  useEffect(() => {
    if (!isOpen || !activeCommunityId || challenge?.status !== 'deal_reached') return;
    const fetchPlayers = async () => {
      setLoadingPlayers(true);
      try {
        const snap = await onSnapshot(collection(db, "communities", activeCommunityId, "players"), (snapshot) => {
          const list: PlayerProfile[] = [];
          snapshot.forEach(d => list.push({ uid: d.id, ...d.data() } as PlayerProfile));
          setMyCommunityPlayers(list);
          setLoadingPlayers(false);
        });
        return () => snap();
      } catch (err) {
        console.error("Failed loading players:", err);
        setLoadingPlayers(false);
      }
    };
    fetchPlayers();
  }, [isOpen, activeCommunityId, challenge?.status]);

  const handleSendChallenge = async () => {
    if (!targetCommunity || !challenge) return;
    try {
      const newChallenge: CommunityChallenge = {
        ...challenge,
        challengeDetails: {
          date: dateInput,
          time: timeInput,
          location: locationInput,
          format: formatInput,
          notes: notesInput
        },
        messages: [{
          senderUid: user?.uid || "",
          senderName: user?.displayName || (isAr ? "مسؤول المجتمع" : "Community Admin"),
          communityId: activeCommunityId,
          text: isAr ? `مرحباً! نود تحديكم في مباراة يوم ${dateInput || 'تحدد لاحقاً'} الساعة ${timeInput || 'تحدد لاحقاً'}.` : `Hello! We challenge you to a match on ${dateInput || 'TBD'} at ${timeInput || 'TBD'}.`,
          timestamp: new Date().toISOString()
        }]
      };
      await setDoc(doc(db, "community_challenges", challenge.id), newChallenge);
      toast.success(isAr ? "تم إرسال طلب التحدي وبدء التفاوض!" : "Challenge request sent and negotiation started!");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل إرسال التحدي" : "Failed to send challenge");
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !challenge) return;
    setSendingMsg(true);
    try {
      const newMsg = {
        senderUid: user?.uid || "",
        senderName: user?.displayName || (isAr ? "مسؤول" : "Admin"),
        communityId: activeCommunityId,
        text: messageInput.trim(),
        timestamp: new Date().toISOString()
      };
      await updateDoc(doc(db, "community_challenges", challenge.id), {
        messages: arrayUnion(newMsg)
      });
      setMessageInput("");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل إرسال الرسالة" : "Failed to send message");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleAgreeDeal = async () => {
    if (!challenge) return;
    try {
      const isChallenger = challenge.challengerCommunityId === activeCommunityId;
      const updates: any = isChallenger ? { challengerAgreed: true } : { targetAgreed: true };
      
      const otherAgreed = isChallenger ? challenge.targetAgreed : challenge.challengerAgreed;
      if (otherAgreed) {
        updates.status = 'deal_reached';
      }
      
      await updateDoc(doc(db, "community_challenges", challenge.id), updates);
      toast.success(isAr ? "تم تأكيد الاتفاق من طرفك! 🤝" : "Deal confirmed from your side! 🤝");
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "حدث خطأ أثناء التأكيد" : "Error confirming deal");
    }
  };

  const handleSaveSquad = async () => {
    if (!challenge) return;
    setSubmittingSquad(true);
    try {
      const isChallenger = challenge.challengerCommunityId === activeCommunityId;
      const updates: any = isChallenger 
        ? { challengerSquadUids: selectedSquadUids } 
        : { targetSquadUids: selectedSquadUids };

      const otherSquad = isChallenger ? challenge.targetSquadUids : challenge.challengerSquadUids;
      if (otherSquad && otherSquad.length > 0 && selectedSquadUids.length > 0) {
        updates.status = 'approved';
        // Also create the global/community match fixture
        const matchId = `inter_${challenge.id}`;
        updates.approvedMatchId = matchId;

        const matchFixture = {
          id: matchId,
          success: true,
          status: 'active',
          matchMode: 'inter_community',
          challengerCommunityId: challenge.challengerCommunityId,
          challengerCommunityName: challenge.challengerCommunityName,
          targetCommunityId: challenge.targetCommunityId,
          targetCommunityName: challenge.targetCommunityName,
          challengerSquadUids: isChallenger ? selectedSquadUids : (challenge.challengerSquadUids || []),
          targetSquadUids: isChallenger ? (challenge.targetSquadUids || []) : selectedSquadUids,
          challengeDetails: challenge.challengeDetails,
          generatedAt: new Date().toISOString()
        };

        // Save in both communities
        await setDoc(doc(db, "communities", challenge.challengerCommunityId, "matches", "latest"), matchFixture);
        await setDoc(doc(db, "communities", challenge.targetCommunityId, "matches", "latest"), matchFixture);
      }

      await updateDoc(doc(db, "community_challenges", challenge.id), updates);
      toast.success(isAr ? "تم حفظ القائمة واعتمادها للمباراة!" : "Squad saved and locked for the match!");
      if (updates.status === 'approved') {
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "فشل حفظ قائمة الفريق" : "Failed to save squad");
    } finally {
      setSubmittingSquad(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md" dir={isAr ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-amber-500/30 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-white"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-amber-600/30 via-orange-600/20 to-slate-900 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shrink-0">
                🤝
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  {isAr ? "تحدي مجتمعات (Communities vs Communities)" : "Inter-Community Challenge"}
                </span>
                <h3 className="text-xl font-black mt-1">
                  {challenge ? `${challenge.challengerCommunityName} ⚔️ ${challenge.targetCommunityName}` : isAr ? "إرسال طلب تحدي" : "Send Challenge Request"}
                </h3>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300">
              ✕
            </button>
          </div>

          {loading ? (
            <div className="p-16 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : !existingChallengeId && !challenge?.id.startsWith("challenge_") ? (
            /* New Challenge Form */
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">{isAr ? "التاريخ المقترح" : "Proposed Date"}</label>
                  <input
                    type="date"
                    value={dateInput}
                    onChange={e => setDateInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">{isAr ? "الوقت المقترح" : "Proposed Time"}</label>
                  <input
                    type="time"
                    value={timeInput}
                    onChange={e => setTimeInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">{isAr ? "المكان / الملعب المقترح" : "Proposed Location / Turf"}</label>
                <input
                  type="text"
                  placeholder={isAr ? "مثال: ملاعب المملكة، الملعب 1" : "e.g. Al-Mamlaka Turf, Pitch 1"}
                  value={locationInput}
                  onChange={e => setLocationInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">{isAr ? "نظام المباراة" : "Match Format"}</label>
                <select
                  value={formatInput}
                  onChange={e => setFormatInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
                >
                  <option value="5v5 Turf">{isAr ? "خماسي عشب صناعي (5v5)" : "5v5 Turf"}</option>
                  <option value="6v6 Turf">{isAr ? "سداسي عشب صناعي (6v6)" : "6v6 Turf"}</option>
                  <option value="7v7 Turf">{isAr ? "سباعي عشب صناعي (7v7)" : "7v7 Turf"}</option>
                  <option value="11v11 Standard">{isAr ? "مباراة 11v11 قياسية" : "11v11 Standard Match"}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">{isAr ? "ملاحظات إضافية للتفاوض" : "Additional Negotiation Notes"}</label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={e => setNotesInput(e.target.value)}
                  placeholder={isAr ? "اكتب شروط التحدي، تكلفة الملعب، وما إلى ذلك..." : "Write challenge terms, pitch split costs, etc..."}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
                />
              </div>
            </div>
          ) : challenge && (
            /* Active Challenge View */
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Status & Deal Reached Banner */}
              <div className="p-4 bg-slate-800/80 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-300">
                    {isAr ? "الحالة:" : "Status:"}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${
                    challenge.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                    challenge.status === 'deal_reached' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' :
                    'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {challenge.status === 'approved' ? (isAr ? '🎉 التحدي معتمد ومُشكل' : '🎉 Approved & Squads Locked') :
                     challenge.status === 'deal_reached' ? (isAr ? '🤝 تم الاتفاق! (Got your deal)' : '🤝 Got your deal? (Select Squads)') :
                     (isAr ? '💬 جاري التفاوض والمحادثة' : '💬 Negotiating Chat')}
                  </span>
                </div>

                {/* Agreement buttons */}
                {challenge.status === 'negotiating' && isAdmin && (
                  <button
                    onClick={handleAgreeDeal}
                    disabled={(challenge.challengerCommunityId === activeCommunityId ? challenge.challengerAgreed : challenge.targetAgreed)}
                    className="px-5 py-2 rounded-2xl font-black text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-md transition-transform active:scale-95 disabled:opacity-50"
                  >
                    {(challenge.challengerCommunityId === activeCommunityId ? challenge.challengerAgreed : challenge.targetAgreed)
                      ? (isAr ? '✅ بانتظار موافقة الخصم...' : '✅ Waiting on opponent...')
                      : (isAr ? '🤝 تم الاتفاق؟ (Got your deal? Yes)' : '🤝 Got your deal? (Agree)')}
                  </button>
                )}
              </div>

              {/* Chat Messages Section */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/50 min-h-[220px]">
                {challenge.messages.map((msg, idx) => {
                  const isMine = msg.communityId === activeCommunityId;
                  return (
                    <div key={idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold text-slate-400">{msg.senderName}</span>
                        <span className="text-[10px] text-slate-500">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm max-w-[80%] ${
                        isMine ? 'bg-amber-600/80 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Squad Selection Section (When Deal Reached) */}
              {challenge.status === 'deal_reached' && isAdmin && (
                <div className="p-4 bg-slate-800 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-amber-400">
                      🛡️ {isAr ? "اختيار تشكيلة مجتمعك المغلقة للمباراة" : "Select Your Locked Squad for the Match"}
                    </span>
                    <span className="text-xs font-mono text-slate-300">
                      {selectedSquadUids.length} {isAr ? "لاعب مختار" : "players picked"}
                    </span>
                  </div>
                  <div className="max-h-36 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {myCommunityPlayers.map(p => {
                      const selected = selectedSquadUids.includes(p.uid);
                      return (
                        <button
                          key={p.uid}
                          type="button"
                          onClick={() => {
                            if (selected) setSelectedSquadUids(selectedSquadUids.filter(u => u !== p.uid));
                            else setSelectedSquadUids([...selectedSquadUids, p.uid]);
                          }}
                          className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition-all ${
                            selected ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <span className="truncate">{p.cardName || p.fullName}</span>
                          {selected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={handleSaveSquad}
                    disabled={submittingSquad || selectedSquadUids.length === 0}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                  >
                    {submittingSquad && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{isAr ? "اعتماد قائمة لاعبي فريقي وحفظها" : "Confirm & Lock My Squad"}</span>
                  </button>
                </div>
              )}

              {/* Chat Input */}
              {challenge.status !== 'approved' && (
                <div className="p-4 bg-slate-900 border-t border-white/10 flex items-center gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder={isAr ? "اكتب رسالة للتفاوض أو تنسيق الموعد..." : "Type a negotiation message..."}
                    className="flex-1 px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMsg || !messageInput.trim()}
                    className="p-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl transition-transform active:scale-95 disabled:opacity-50"
                  >
                    {sendingMsg ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer for new challenge */}
          {!existingChallengeId && !challenge?.id.startsWith("challenge_") && (
            <div className="p-4 bg-slate-900 border-t border-white/10 flex justify-end gap-3">
              <button onClick={onClose} className="px-5 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-2xl text-sm">
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleSendChallenge}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black rounded-2xl text-sm shadow-lg transition-transform active:scale-95"
              >
                {isAr ? "إرسال التحدي وبدء المحادثة" : "Send Challenge Request"}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
