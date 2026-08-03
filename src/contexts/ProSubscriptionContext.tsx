"use client";

/**
 * ProSubscriptionContext
 * ─────────────────────
 * Provides real-time Firestore subscription status for the currently logged-in
 * user. The context is the SINGLE SOURCE OF TRUTH for subscription state.
 *
 * Security model
 * ──────────────
 * • The subscription document field lives in Firestore at `players/{uid}`.
 * • It is ONLY written to by:
 *   1. The platform Owner (a7medorabe7@gmail.com) via the admin panel.
 *   2. A verified server-side payment webhook (future – when payment API keys
 *      are configured). No client-side code for non-owners ever writes the
 *      subscription field.
 * • This context simply READS the value – it cannot grant access.
 *
 * Until the payment gateway API keys are configured, ALL non-owner users
 * remain on the "free" plan by default.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";

export interface SubscriptionState {
  plan: "free" | "pro_captain" | "club_organizer";
  status: "active" | "inactive" | "trial" | "none";
  expiresAt?: string;
  subscribedAt?: string;
  /** True only if the subscription is genuinely active and not expired */
  hasProAccess: boolean;
  /** True only if the subscription is Club Organizer tier */
  hasClubOrganizerAccess: boolean;
  /** True if user is the platform owner (unlimited access) */
  isOwner: boolean;
  loading: boolean;
}

interface ProSubscriptionContextProps extends SubscriptionState {}

const ProSubscriptionContext = createContext<
  ProSubscriptionContextProps | undefined
>(undefined);

const OWNER_EMAIL = "a7medorabe7@gmail.com";
const OWNER_UID = "G8vV7jTvd0VUeRlohrGFyARhiiw1";

export const ProSubscriptionProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user, isOwner } = useAuth();
  const [subState, setSubState] = useState<Omit<SubscriptionState, "isOwner">>({
    plan: "free",
    status: "none",
    hasProAccess: false,
    hasClubOrganizerAccess: false,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setSubState({
        plan: "free",
        status: "none",
        hasProAccess: false,
        hasClubOrganizerAccess: false,
        loading: false,
      });
      return;
    }

    // Owner always has full access – no need to query Firestore
    const userIsOwner =
      isOwner ||
      user.email?.toLowerCase() === OWNER_EMAIL ||
      user.uid === OWNER_UID;

    if (userIsOwner) {
      setSubState({
        plan: "club_organizer",
        status: "active",
        hasProAccess: true,
        hasClubOrganizerAccess: true,
        loading: false,
      });
      return;
    }

    // Real-time listener on the player doc for instant access updates
    const playerRef = doc(db, "players", user.uid);
    const unsubscribe = onSnapshot(
      playerRef,
      (snap) => {
        if (!snap.exists()) {
          setSubState({
            plan: "free",
            status: "none",
            hasProAccess: false,
            hasClubOrganizerAccess: false,
            loading: false,
          });
          return;
        }

        const data = snap.data();
        const sub = data?.subscription;

        if (!sub || sub.status !== "active") {
          setSubState({
            plan: "free",
            status: sub?.status ?? "none",
            hasProAccess: false,
            hasClubOrganizerAccess: false,
            loading: false,
          });
          return;
        }

        // Validate expiry
        const notExpired =
          !sub.expiresAt ||
          new Date(sub.expiresAt).getTime() > Date.now();

        if (!notExpired) {
          setSubState({
            plan: sub.plan ?? "free",
            status: "inactive",
            hasProAccess: false,
            hasClubOrganizerAccess: false,
            expiresAt: sub.expiresAt,
            loading: false,
          });
          return;
        }

        const isClub = sub.plan === "club_organizer";
        const isPro = sub.plan === "pro_captain" || isClub;

        setSubState({
          plan: sub.plan ?? "free",
          status: "active",
          hasProAccess: isPro,
          hasClubOrganizerAccess: isClub,
          expiresAt: sub.expiresAt,
          subscribedAt: sub.subscribedAt,
          loading: false,
        });
      },
      (err) => {
        console.error("ProSubscriptionContext snapshot error:", err);
        setSubState({
          plan: "free",
          status: "none",
          hasProAccess: false,
          hasClubOrganizerAccess: false,
          loading: false,
        });
      }
    );

    return () => unsubscribe();
  }, [user, isOwner]);

  const value = useMemo<ProSubscriptionContextProps>(
    () => ({
      ...subState,
      isOwner:
        isOwner ||
        user?.email?.toLowerCase() === OWNER_EMAIL ||
        user?.uid === OWNER_UID,
    }),
    [subState, isOwner, user]
  );

  return (
    <ProSubscriptionContext.Provider value={value}>
      {children}
    </ProSubscriptionContext.Provider>
  );
};

export const useProSubscription = () => {
  const ctx = useContext(ProSubscriptionContext);
  if (!ctx)
    throw new Error(
      "useProSubscription must be used inside ProSubscriptionProvider"
    );
  return ctx;
};
