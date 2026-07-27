# PROJECT_OVERVIEW.md — Architectural & Technical Specification

> **System Name**: 11Players (Hagoozat Elite Web Platform)  
> **Last Updated**: July 27, 2026  
> **Status**: Production Full-Stack Next.js 16 Web Application (100% REALTIME FIRESTORE SYNC, FUT CARDS, AI TACTICAL ASSISTANT & BALANCED MATCHMAKING)  

---

## 1. Tech Stack Overview
- **Framework**: Next.js 16 (App Router, React 19, Server Actions, API Routes)
- **UI & Styling**: Tailwind CSS v4, Vanilla CSS Design Tokens (`globals.css`), Glassmorphism, Framer Motion Micro-Interactions
- **Icons & Visuals**: Lucide React, Custom Pitch Canvas/SVG renderers, `html2canvas` for PNG exports
- **State Management & Contexts**: React Context (`AuthContext`, `CommunityContext`, `PlayersContext`)
- **Backend & Database**: Firebase Auth (`an-11-players`), Firestore (Realtime Streams for `/players`, `/communities`, `/matches`, `/chats`)
- **AI Infrastructure**: 11AI Gemini AI Assistant Widget (`/api/ai/chat`, `AIChatbotModal.tsx`), 11AI Pre-Match Scouting Report Engine, Web Speech API Tactical Assistant
- **Testing & Quality Assurance**: Vitest unit test suite (66/66 tests passing across 7 test suites)

---

## 2. System Architecture & Data Flow

```
[ Web Browser Client ]
    │
    ├── Web Context Providers (AuthContext, CommunityContext, PlayersContext)
    │     │
    │     ├── Firestore Path Helper & Realtime Listeners (src/lib/firestorePaths.ts)
    │     │     └── Realtime Streams (players, communities, matches, chats)
    │     │
    │     ├── Deterministic Matchmaking Engine (src/lib/engine.ts):
    │     │     └── 13 PES Position Weight Matrices, Physical Modifiers & Variance Minimization
    │     │
    │     ├── Milestone 2 Group 1 Innovations:
    │     │     ├── Dynamic Pitch Heatmap (src/components/pitch/DynamicPitchHeatmap.tsx)
    │     │     ├── Live Captain Draft Room (src/components/draft/CaptainDraftRoom.tsx & /match/draft)
    │     │     └── Live Spectator Broadcaster (src/components/broadcaster/LiveMatchBroadcaster.tsx & /match/live)
    │     │
    │     ├── Milestone 3 Group 2 AI & Media Generators:
    │     │     ├── 11AI Opposition Scouting Report (src/components/scouting/OppositionScoutingReport.tsx)
    │     │     ├── Retro Sports Newspaper Generator (src/components/newspaper/SportsNewspaperCover.tsx & /match/newspaper)
    │     │     └── Floating Voice Tactics Assistant Widget (src/components/tactics/VoiceTacticsAssistant.tsx)
    │     │
    │     ├── Milestone 4 Group 3 Competitive Ecosystem, FUT & Turf Tools:
    │     │     ├── Holographic 3D FUT Card (src/components/fut/Holographic3DFutCard.tsx)
    │     │     ├── Kit & Crest Builder Studio (src/components/builder/KitBadgeBuilder.tsx & /community/kit-builder)
    │     │     ├── Pitch Rent Split Bill Calculator (src/components/billing/PitchSplitBillCalculator.tsx & /match/split-bill)
    │     │     ├── XP Playstyle Skill Tree (src/components/gamification/XpSkillTree.tsx & /profile/skill-tree)
    │     │     └── Derby Rivalry H2H Engine (src/components/derby/DerbyRivalryEngine.tsx & /stats/derby)
    │     │
    │     └── 11AI Gemini Chatbot Assistant Widget (src/components/AIChatbotWidget.tsx)
    │
    └── Next.js 16 App Router API Routes (/api/matchmaking, /api/ai/chat, /api/ai/tts, /api/avatar/upload)
```

---

## 3. Database & Firestore Collections

All Firestore interactions are centralized in `src/lib/firestorePaths.ts` and React Context providers.

| Collection Path | Purpose / Description | Key Document Fields |
|---|---|---|
| `/players/{uid}` | Main player profiles | `uid`, `name`, `username`, `ovr`, `position`, `attributes`, `avatarUrl`, `stats` |
| `/users/{uid}` | User metadata & settings | `email`, `role`, `createdAt`, `notificationsEnabled` |
| `/communities/{cid}` | Community metadata | `cid`, `name`, `description`, `ownerUid`, `adminUids`, `memberCount`, `isPrivate` |
| `/communities/{cid}/players/{uid}` | Community member roster | `joinedAt`, `role`, `communityOvr`, `matchesPlayed` |
| `/communities/{cid}/chats/{id}` | Community chat messages | `senderUid`, `senderName`, `text`, `timestamp`, `reactions` |
| `/communities/{cid}/matches/{mid}` | Community match records | `date`, `teamA`, `teamB`, `status`, `scoreA`, `scoreB`, `mvpUid` |

---

## 4. Web Application Architecture (`src/app/`)

All web routes are 100% connected to live Firestore real-time streams via `src/lib/firestorePaths.ts` and React Context providers:
- `/` (Home / Welcome): Landing hero with interactive Google Login CTA, live platform stats counter, feature cards, and FUT card showcase.
- `/onboarding` (Player Onboarding): Multi-step setup wizard with pitch position selector, Zod-validated bio input, attributes sliders, and AI advisor.
- `/communities` & `/community-settings` (Communities Roster): Firestore real-time community directory with active member counters, join approvals, and community settings.
- `/community` & `/community-chat` (Community Hub & Realtime Chat): Real-time community wall, chat room, message reactions, and challenge triggers.
- `/community/kit-builder` (Kit & Crest Builder): Canvas-based kit & crest designer interface with jersey patterns (Stripes, Hoops, Gradient, Diagonal, Camouflage), custom colors, shield shapes, emblem icons, and PNG asset export.
- `/match` & `/matchmaking` (Matches & Squad Balancer): Pitch control center with PES 13-position squad balancer, live match history, MOTM calculation, and turf generator.
- `/match/draft` (Captain Draft Room): Live interactive captain draft for 22 players with snake/classic picks, OVR & PSI balance meters, positional coverage, and auto-draft fallback.
- `/match/live` (Live Match Broadcaster): Interactive spectator broadcast view with animated 2D pitch event display, Speech Synthesis commentary, dynamic momentum pressure gauge (0-100%), stoppage time tracker (+1 to +6 mins), and live events ticker.
- `/match/newspaper` (Retro Sports Newspaper Generator): Shareable post-match retro sports newspaper cover generator ("HAGOOZAT DAILY") with dynamic headline generator, MOTM spotlight card, match article writeup, starting XI box, and instant `html2canvas` PNG download.
- `/match/split-bill` (Pitch Rent Split Bill Calculator): Pitch rent split-bill calculator with automatic equal/custom cost distribution, real-time payment status tracker (Paid, Pending, Overdue), multi-currency switcher (SAR, USD, EUR, EGP), share link generator, and collection summary meter.
- `/stats` & `/global` (Global Roster & Leaderboards): Sortable global player roster with Top 3 Podium, Ballon d'Or showcase, and player comparison modal.
- `/stats/derby` (Derby Rivalry H2H Engine): Head-to-head stats tracker for captain rivalries & community derbies, aggregating wins/losses/draws, goal difference, win rate percentage, streak tracking, rivalry intensity score (0-100), and match history timeline.
- `/profile` (Player FUT Profile): Dynamic FUT player card, OVR history chart, skill checklist, and downloadable PDF player card.
- `/profile/skill-tree` (XP Playstyle Skill Tree): Gamification & XP skill tree component with unlockable playstyle badges ("Sniper", "The Engine", "Brick Wall", "Playmaker", "Speed Demon", "Safe Hands"), XP progress bars, unlock requirement evaluators, multi-tier badge ranks (Bronze, Silver, Gold, Diamond), and Framer Motion node unlock effects.
- `/achievements` (Trophy Cabinet): Unlockable trophies, Ballon d'Or podium awards, Golden Boot, and confetti celebrations.
- `/notifications` (Notifications Center): Real-time system notifications, match alerts, and community announcements.
- `/admin` (Admin Control Hub): Roster management, peer rating aggregator, captain vote reset, and join request approval queue.
- `/season-ceremony` (Seasonal Awards): End-of-season awards presentation, Ballon d'Or ceremony, and Team of the Season XI.
- `/announcements` (Broadcast Center): Real-time announcements feed with 11AI Gemini text enhancer integration.
- `/support` & `/inbox` (Support Hub): Help desk tickets, FAQ accordions, and automated AI assistance.
- `/users` (User Roster): Platform user management directory with role filtering (Owner, Admin, Member).
- `/owner` (Global Owner Panel): System maintenance toggles, global security controls, edge config sync, and audit logs.
- `/guide`, `/tos`, `/privacy`, `/cookie` (Tactical Guide & Legal): PES positional suitability index guide, privacy settings, and cookie manager.

---

---

## 5. Catalog of 20 Advanced Feature Ecosystem Modules

| # | Module Name | Component Path / Route | Core Capabilities |
|---|---|---|---|
| 1 | **Deterministic Matchmaking & Balancing Engine** | `src/lib/engine.ts` | 13 PES Position Weight Matrices, Positional Suitability Index (PSI), physical attribute modifiers, team variance minimization algorithm |
| 2 | **Firestore Path & Sync Engine** | `src/lib/firestorePaths.ts` | Strongly-typed path definitions and realtime streaming wrappers for players, communities, matches, and chat feeds |
| 3 | **Live Captain Draft Room** | `src/components/draft/CaptainDraftRoom.tsx` (`/match/draft`) | Interactive 22-player captain draft with snake & classic pick modes, OVR balance meters, positional coverage indicators, and auto-draft fallback |
| 4 | **Live Spectator Broadcaster** | `src/components/broadcaster/LiveMatchBroadcaster.tsx` (`/match/live`) | Interactive spectator broadcast with 2D pitch animation, Web Speech commentary synthesis, dynamic momentum pressure gauge, and stoppage time tracker |
| 5 | **Retro Sports Newspaper Generator** | `src/components/newspaper/SportsNewspaperCover.tsx` (`/match/newspaper`) | "HAGOOZAT DAILY" retro post-match cover generator with dynamic headlines, MOTM spotlight card, match article writeup, starting XI box, and high-res PNG export via `html2canvas` |
| 6 | **11AI Opposition Scouting Report** | `src/components/scouting/OppositionScoutingReport.tsx` | AI-driven opposition analysis engine calculating team threat index, tactical strengths/weaknesses, key danger players, and recommended counters |
| 7 | **Voice Tactics Assistant** | `src/components/tactics/VoiceTacticsAssistant.tsx` | Web Speech API speech-to-text tactical advisor rendering animated audio visualizer waves, intent matching, and realtime voice-guided team adjustments |
| 8 | **Kit & Crest Builder Studio** | `src/components/builder/KitBadgeBuilder.tsx` (`/community/kit-builder`) | Canvas kit & badge customizer with jersey patterns (Stripes, Hoops, Gradient, Diagonal, Camouflage), custom color picker, shield shapes, emblem icons, and PNG download |
| 9 | **Pitch Rent Split Bill Calculator** | `src/components/billing/PitchSplitBillCalculator.tsx` (`/match/split-bill`) | Turf split-bill calculator supporting equal & custom cost allocation, multi-currency switcher (SAR, USD, EUR, EGP), payment status tracker, and shareable link generator |
| 10 | **XP Playstyle Skill Tree** | `src/components/gamification/XpSkillTree.tsx` (`/profile/skill-tree`) | Gamified skill tree with unlockable playstyle badges ("Sniper", "The Engine", "Brick Wall", "Playmaker", "Speed Demon", "Safe Hands"), rank tiers (Bronze, Silver, Gold, Diamond), and Framer Motion effects |
| 11 | **Derby & H2H Rivalry Engine** | `src/components/derby/DerbyRivalryEngine.tsx` (`/stats/derby`) | Head-to-head captain rivalry tracker aggregating win/loss/draw records, goal differences, win rates, rivalry intensity scores (0-100), and historical match logs |
| 12 | **Holographic 3D FUT Card** | `src/components/fut/Holographic3DFutCard.tsx` | CSS 3D transform card with dynamic cursor tilt, sheen reflection, player stats, tier glow borders (Gold Elite, Silver Star, Bronze Pro, Rookie), and interactive flip |
| 13 | **11AI Gemini Chatbot Assistant** | `src/components/AIChatbotWidget.tsx` | Floating 11AI Gemini assistant modal integrated with app context for instant rule lookups, tactical advice, and community assistance |
| 14 | **Dynamic Pitch Heatmap** | `src/components/pitch/DynamicPitchHeatmap.tsx` | Visual pitch heatmap visualization rendering player positioning intensity, activity zones, and tactical spatial density |
| 15 | **Player Onboarding Wizard** | `src/components/onboarding/OnboardingWizard.tsx` (`/onboarding`) | Multi-step interactive profile setup with pitch position selector, Zod-validated bio input, attributes sliders, and AI attribute advisor |
| 16 | **Record Stats & MOTM Calculator** | `src/components/match/RecordStatsModal.tsx` | Post-match statistics logging modal calculating Man of the Match awards, goal/assist updates, clean sheet tags, and player rating recalculations |
| 17 | **Peer Rating & Edit Approval System** | `src/components/admin/AdminTable.tsx` | Administrative review interface for peer rating proposals, profile edit requests, captain vote resets, and roster management |
| 18 | **Season Ceremony & Awards Engine** | `src/app/season-ceremony/page.tsx` | End-of-season ceremony page celebrating Ballon d'Or winners, Golden Boot awardees, Team of the Season XI, and trophy presentations |
| 19 | **Realtime Announcements Broadcast** | `src/app/announcements/page.tsx` | Community broadcast module with draft auto-save, push notification queueing, live chat broadcast, and 11AI Gemini copy enhancer |
| 20 | **Support Desk & Admin Inbox** | `src/app/support/page.tsx` & `src/app/inbox/page.tsx` | Support ticketing and admin inbox system with realtime chat sync, unread counters, and automated support response flows |

---

## 6. Visual & Design System
- **Tier Glow Borders Standard**:
  - **Gold Elite (OVR 85+)**: `#f59e0b` amber border & glow (`rgba(245, 158, 11, 0.45)`), `#b45309` badge, `#fef08a` text, `Crown` icon.
  - **Silver Star (OVR 75+)**: `#cbd5e1` silver border & glow (`rgba(203, 213, 225, 0.35)`), `#334155` badge, `#f8fafc` text, `Sparkles` icon.
  - **Bronze Pro (OVR 65+)**: `#d97706` bronze border & glow (`rgba(217, 119, 6, 0.35)`), `#78350f` badge, `#ffedd5` text, `ShieldCheck` icon.
  - **Rookie (OVR <65)**: `#334155` slate border & glow, `#1e293b` badge, `#cbd5e1` text.
- **Glassmorphism Depth & Aesthetics**:
  - Translucent surfaces (`rgba(15, 23, 42, 0.85)`), multi-layered shadow offsets, and sleek dark pitch emerald accents across all pages.

