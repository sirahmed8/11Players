# MOBILE_APP_OVERVIEW.md — Mobile Application Architecture & Specification

> **System Name**: 11Players Mobile (Hagoozat Elite iOS & Android)  
> **Framework**: React Native + Expo (SDK 52+) with Expo Router & Reanimated  
> **Status**: Mobile Application Architecture & Setup Complete  

---

## 1. Executive Summary & Mobile Strategy

The **11Players Mobile Application** is a high-performance cross-platform mobile client designed for iOS and Android. It shares 100% of the underlying business logic, deterministic match engine (`src/lib/engine.ts`), Firestore path conventions (`src/lib/firestorePaths.ts`), attribute calculators (`src/lib/overallCalculator.ts`), and Firebase Authentication contexts with the existing web application.

---

## 2. Directory Structure & App Architecture

The mobile application is integrated directly into the workspace repository:

```
11Players/
├── src/                          # Shared Web & Core Logic
│   ├── lib/
│   │   ├── engine.ts             # Deterministic Matchmaking Algorithm
│   │   ├── firestorePaths.ts     # Centralized Firestore Path Rules
│   │   ├── overallCalculator.ts  # Positional OVR Calculator
│   │   └── playerUtils.ts        # Attribute Utilities
│   └── types/                    # Shared TypeScript Interfaces
│
├── mobile/                       # React Native & Expo Mobile Client
│   ├── app/                      # Expo Router File-Based Navigation
│   │   ├── _layout.tsx           # Root Layout & Provider Hierarchy
│   │   ├── (auth)/               # Auth Stack (Login, Onboarding)
│   │   │   ├── login.tsx
│   │   │   └── onboarding.tsx
│   │   ├── (tabs)/               # Bottom Tab Navigation Shell
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx         # Home Dashboard
│   │   │   ├── match.tsx         # Live Pitch & Matchmaking Hub
│   │   │   ├── community.tsx     # Community Hub & Chat
│   │   │   ├── stats.tsx         # Leaderboards & Podiums
│   │   │   └── profile.tsx       # FUT Card Profile
│   │   └── modal/                # Native Bottom Sheet Modals
│   │       ├── rating.tsx
│   │       ├── edit-profile.tsx
│   │       └── match-config.tsx
│   │
│   ├── src/
│   │   ├── components/           # Mobile Native UI Components
│   │   │   ├── MobilePitch.tsx   # Native SVG Tactical Field
│   │   │   ├── FUTCardNative.tsx # Animated FUT Card
│   │   │   ├── BottomSheet.tsx   # Spring Bottom Sheet Container
│   │   │   └── TouchFeedback.tsx # Mobile Haptic Touch Wrapper
│   │   ├── config/
│   │   │   └── firebaseMobile.ts # React Native Firebase Initialization
│   │   └── hooks/                # Mobile Custom Hooks
│   │
│   ├── app.json                  # Expo Config (Android/iOS Manifest)
│   ├── eas.json                  # EAS Cloud Build Profiles
│   ├── package.json              # Mobile Dependencies
│   └── tsconfig.json             # TypeScript Config
│
├── MOBILE_APP_OVERVIEW.md       # Mobile Architecture Specification
└── EXECUTION_PLAN.md             # Master Execution Checklist
```

---

## 3. Shared Logic & Backend Parity

1. **Firestore Collections**: Connects directly to the identical Firestore collections (`/players`, `/communities`, `/communities/{cid}/matches`, `/communities/{cid}/chats`).
2. **Positional Suitability Index (PSI)**: Imports `src/lib/engine.ts` directly for 100% deterministic team generation.
3. **Real-time Synchronization**: Web and Mobile clients listen to the exact same Firestore document streams simultaneously.

---

## 4. Mobile Ergonomics & Native Design Tokens

- **Bottom Tab Navigation**: Primary navigation placed within thumb-reach at the bottom of the screen.
- **Spring Animations**: Smooth 60fps gesture physics powered by `react-native-reanimated` and `react-native-gesture-handler`.
- **Haptic Feedback**: Haptic pulses (`expo-haptics`) triggered on pitch player drop, team generation, and rating submissions.
- **Card-Based Lists**: Replaces wide desktop tables with touchable expand/collapse card items.
- **Thumb Target Boundaries**: All touchable items enforce a minimum `48x48dp` tap area.

---

## 5. Mobile Preview & EAS Cloud Build Scripts

### 5.1 Local & Web Preview Engines
```bash
# Start Expo Dev Server
npx expo start

# Run Web Preview in Browser
npx expo start --web

# Run on Connected Android Emulator
npx expo start --android

# Run on Connected iOS Simulator
npx expo start --ios
```

### 5.2 Android Studio Testing Instructions
1. Open **Android Studio**.
2. Click **Open** and select the folder `D:\11Players\mobile\android` (or `D:\11Players\android`).
3. Package Name: `com.sir.elevenplayers`
4. Firebase Config: Automatically loaded from `google-services.json` (`project_id: an-11-players`).
5. Launch your Android Virtual Device (AVD Emulator) and click **Run 'app'** (`Shift + F10`).

### 5.3 EAS Cloud Build Commands (No Local Mac Required)
```bash
# Build Android APK for direct device installation & testing
eas build --platform android --profile preview

# Build Android App Bundle (.aab) for Google Play Console
eas build --platform android --profile production

# Build iOS IPA for TestFlight / Ad-Hoc
eas build --platform ios --profile preview
```
