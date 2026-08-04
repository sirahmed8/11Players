# PROJECT_OVERVIEW.md — Architectural & Technical Specification

> **System Name**: 11Players (Hagoozat Elite Web Platform)  
> **Last Updated**: August 4, 2026  
> **Status**: Production Full-Stack Next.js 16 Web Application (100% REALTIME FIRESTORE SYNC, UNIFIED MATCH ACTION HUB BAR, COMPLETE ROUTE SKELETON LOADERS, CROSS-SUITE ECOSYSTEM INTEGRATION, 100% TEST PASS RATE)  

---

## 1. Tech Stack Overview
- **Framework**: Next.js 16 (App Router, React 19, Server Actions, API Routes)
- **UI & Styling**: Tailwind CSS v4, Vanilla CSS Design Tokens (`globals.css`), Glassmorphism, Framer Motion Micro-Interactions
- **Icons & Visuals**: Lucide React, Custom Pitch Canvas/SVG renderers, `html2canvas` for PNG exports
- **State Management & Contexts**: React Context (`AuthContext`, `CommunityContext`, `PlayersContext`)
- **Backend & Database**: Firebase Auth (`an-11-players`), Firestore (Realtime Streams for `/players`, `/communities`, `/matches`, `/chats`)
- **AI Infrastructure**: 11AI Gemini AI Assistant Widget (`/api/ai/chat`, `FloatingChatWidget.tsx`), 11AI Pre-Match Scouting Report Engine, Web Speech API Tactical Assistant
- **Testing & Quality Assurance**: Vitest unit test suite (106/106 tests passing across 10 test suites)

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

---

## 7. Milestone M2.1 — 1000x UI/UX Visual Polish & Standardizations
- **Input Focus Ring Glow Standard**:
  - Standardized across all `<input>`, `<textarea>`, search bars, and editable controls in `src/app` and `src/components` with the signature emerald glow ring:
    `focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300`
- **Animated Custom Dropdowns & Accordions**:
  - Replaced native HTML `<select>` elements and static lists with `CustomDropdown` component and Framer Motion (`AnimatePresence` with `motion.div` / `motion.ul`) scale, opacity, and smooth height auto transitions across `PitchSplitBillCalculator`, `KitBadgeBuilder`, `CommunityChallengeModal`, `CaptainDraftRoom`, `MatchPitchDisplay`, `DynamicPitchHeatmap`, `SuggestPeerRatingModal`, `EditMatchModal`, `MatchConfigModal`, `PendingEdits`, and `announcements`.
- **Currency Standardization to EGP / ج.م**:
  - Standardized default currency baseline to Egyptian Pound (`EGP` / `ج.م`) across financial modules, match headers, cost per player inputs, and rent split calculations.
- **Authentic Hagoozat Elite Empty States**:
  - Replaced legacy synthetic mock data and hardcoded fallback concepts in `DerbyRivalryEngine.tsx` and `match/newspaper/page.tsx` with dynamic Hagoozat Elite empty states and authentic team representations.
- **Strict Backward Compatibility Safeguards**:
  - Maintained 100% backward compatibility for all data models and function signatures in `src/lib/engine.ts`, `src/lib/firestorePaths.ts`, and core context providers (`AuthContext`, `CommunityContext`, `PlayersContext`).

---

## 8. Milestone M2.1 — Premium Micro-Polish & Micro-Animations Upgrade
- **Staggered List Entrance Animations**:
  - Framer Motion staggered entrance animations (`staggerContainerVariants`, `staggerItemVariants` with `staggerChildren: 0.05`, `delayChildren: 0.08`, and smooth cubic-bezier easing `[0.22, 1, 0.36, 1]`) implemented across community cards (`src/app/communities/page.tsx`), season awards & leaderboards (`src/app/stats/page.tsx`), achievement cards (`src/app/achievements/page.tsx`), notification feed (`src/app/notifications/page.tsx`), draft player pool (`CaptainDraftRoom.tsx`), community pulse feed (`CommunityPulseFeed.tsx`), match history feed (`MatchHistory.tsx`), admin player roster (`AdminTable.tsx`, `AdminTableRow.tsx`, `GlobalUsersTable.tsx`, `GlobalUserRow.tsx`), derby rivalries (`DerbyRivalryEngine.tsx`), and homepage feature grids (`src/app/page.tsx`).
- **Interactive Button & Card Micro-Spring Physics**:
  - Micro-spring physics (`whileHover={{ scale: 1.025, y: -2 }}`, `whileTap={{ scale: 0.96 }}`, `transition={{ type: "spring", stiffness: 400, damping: 25 }}`) applied to all primary submit buttons, CTA controls, modal action triggers (`CreateCommunityModal.tsx`, `ConfirmModal.tsx`, `MatchConfigModal.tsx`), filter tabs, stat cards, badge pills, and interactive table rows.
- **Glassmorphic Hover Sheen & Emerald Glow Rings**:
  - Dual-theme backdrop glassmorphism (`backdrop-blur-xl bg-slate-900/80 border-slate-800/80` and `backdrop-blur-xl bg-white/80 dark:bg-slate-900/80`) and emerald glowing hover borders (`hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]`) added to info cards, stat chips, OVR badges (`PlayerBadge.tsx`), dropdown overlays, tactical advice widgets, floating chat box, and mini-modals.
- **Smooth Tooltips & Badge Pulse Animations**:
  - Live pulse tags (`animate-ping` ping ring + `animate-pulse` core dot) on broadcast status badges (`LiveMatchBroadcaster.tsx`), active notification tags (`notifications/page.tsx`), and top nav / sidebar active items.
  - Holographic shimmer beam animation (`animate-[shimmer_2.5s_infinite]`) added across FUT card faces (`Holographic3DFutCard.tsx`, `HoloPlayerCard.tsx`).
- **Central Reusable Animation System**:
  - Created `src/lib/animations.ts` exporting standard Framer Motion stagger container variants, item entrance variants, button micro-springs, icon micro-springs, and row micro-spring physics for project-wide consistency.

---

## 9. Milestone M2.2 — Real Data Integration & Universal Polish Pass
- **Notifications Page Pagination & Older Collapse**:
  - Added 10-item pagination with Previous/Next navigation controls (`src/app/notifications/page.tsx`).
  - Added expand/collapse accordion toggle for older notifications.
- **Admin Dashboard Default Active Tab**:
  - Configured **"⚡ AI & Bulk Operations"** as the default main tab on page load (`src/app/admin/page.tsx`).
- **Real Data Integration & Mock Data Cleanup**:
  - Connected `XpSkillTree.tsx` directly to real player profile stats and attributes from Firestore.
  - Connected `PitchSplitBillCalculator.tsx` dynamically to real community rosters.
  - Cleared synthetic mock player and team defaults in `CaptainDraftRoom.tsx`, `SportsNewspaperCover.tsx`, and `LiveMatchBroadcaster.tsx` in favor of dynamic match representations.
- **Universal Global CSS Input & Button Micro-Springs**:
  - Integrated global focus ring glow animations (`input:focus, textarea:focus, select:focus`) and button micro-spring physics in `src/app/globals.css`.
## 10. Milestone M2.3 — User Directory Selection & Skeleton Alignment Pass
- **User List Selection Overhaul (`GlobalUsersTable.tsx`)**:
  - Replaced native HTML checkboxes with custom spring-animated Framer Motion selection checkboxes (`Check`).
  - Added a floating glassmorphic batch action panel (`AnimatePresence`) for bulk operations ("Apply AI Choice to Selected").
  - Applied glowing emerald border-left highlights (`bg-emerald-950/20 border-l-4 border-emerald-500`) to selected user rows.
- **Double Skeleton Flicker & Layout Alignment (`SiteSkeletonLoader.tsx`)**:
  - Redesigned `variant="users"` / `variant="table"` skeleton to match `GlobalUsersTable` container dimensions 1-to-1, eliminating layout jumps during client hydration.
  - Replaced internal full-page skeleton early returns with inline table shimmer rows in `GlobalUsersTable` and `null` returns in `profile/page.tsx` and `match/live/page.tsx`.
- **Sidebar & Navigation Fixes**:
  - Shortened link text to 1 word ("Achievements" / "الإنجازات").
  - Replaced `element.scrollIntoView()` with container-relative `scrollTop` math to eliminate auto-scrolling glitches on page navigation.
  - Updated copyright year to **2026** throughout the app (`Sidebar.tsx`).
## 11. Milestone M2.4 — Global Announcement Modal & AI Polish Enhancement Pass
- **Global Announcement Full Detail Modal Window (`GlobalAnnouncementBanner.tsx`)**:
  - Clicking anywhere on the global announcement banner opens a Framer Motion glassmorphic modal window displaying the full untruncated title (Arabic & English), full message body with preserved line breaks, priority badge, and target link action button ("Open Target Link 🔗").
- **AI Polish Engine Overhaul (`aiService.ts`)**:
  - Fixed "AI Polish" button by introducing multi-tier execution: server `/api/ai/chat` POST request first, direct Gemini client engine fallback, markdown codeblock JSON cleaning, and intelligent client-side draft auto-translator & copy polisher.

## 12. Milestone M2.5 — Markdown Asterisk Stripping, Undo AI & BiDi Readability Pass
- **Markdown Asterisk Stripping Engine (`stripMarkdownAsterisks`)**:
  - Created a robust `stripMarkdownAsterisks` helper in `src/lib/aiService.ts` that strips all `**bold**`, `*italic*`, `__bold__`, and loose `*` characters from generated titles, bodies, and input drafts so raw asterisks never appear literal in text boxes, preview cards, or banner modals.
- **Undo AI Polish Button (`src/app/announcements/page.tsx`)**:
  - Added `previousDraft` backup state and rendered an interactive **"Undo AI"** / **"تراجع عن التحسين ↩️"** button next to "AI Polish", enabling administrators to revert AI copy modifications with one click.
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

---

## 7. Milestone M2.1 — 1000x UI/UX Visual Polish & Standardizations
- **Input Focus Ring Glow Standard**:
  - Standardized across all `<input>`, `<textarea>`, search bars, and editable controls in `src/app` and `src/components` with the signature emerald glow ring:
    `focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-300`
- **Animated Custom Dropdowns & Accordions**:
  - Replaced native HTML `<select>` elements and static lists with `CustomDropdown` component and Framer Motion (`AnimatePresence` with `motion.div` / `motion.ul`) scale, opacity, and smooth height auto transitions across `PitchSplitBillCalculator`, `KitBadgeBuilder`, `CommunityChallengeModal`, `CaptainDraftRoom`, `MatchPitchDisplay`, `DynamicPitchHeatmap`, `SuggestPeerRatingModal`, `EditMatchModal`, `MatchConfigModal`, `PendingEdits`, and `announcements`.
- **Currency Standardization to EGP / ج.م**:
  - Standardized default currency baseline to Egyptian Pound (`EGP` / `ج.م`) across financial modules, match headers, cost per player inputs, and rent split calculations.
- **Authentic Hagoozat Elite Empty States**:
  - Replaced legacy synthetic mock data and hardcoded fallback concepts in `DerbyRivalryEngine.tsx` and `match/newspaper/page.tsx` with dynamic Hagoozat Elite empty states and authentic team representations.
- **Strict Backward Compatibility Safeguards**:
  - Maintained 100% backward compatibility for all data models and function signatures in `src/lib/engine.ts`, `src/lib/firestorePaths.ts`, and core context providers (`AuthContext`, `CommunityContext`, `PlayersContext`).

---

## 8. Milestone M2.1 — Premium Micro-Polish & Micro-Animations Upgrade
- **Staggered List Entrance Animations**:
  - Framer Motion staggered entrance animations (`staggerContainerVariants`, `staggerItemVariants` with `staggerChildren: 0.05`, `delayChildren: 0.08`, and smooth cubic-bezier easing `[0.22, 1, 0.36, 1]`) implemented across community cards (`src/app/communities/page.tsx`), season awards & leaderboards (`src/app/stats/page.tsx`), achievement cards (`src/app/achievements/page.tsx`), notification feed (`src/app/notifications/page.tsx`), draft player pool (`CaptainDraftRoom.tsx`), community pulse feed (`CommunityPulseFeed.tsx`), match history feed (`MatchHistory.tsx`), admin player roster (`AdminTable.tsx`, `AdminTableRow.tsx`, `GlobalUsersTable.tsx`, `GlobalUserRow.tsx`), derby rivalries (`DerbyRivalryEngine.tsx`), and homepage feature grids (`src/app/page.tsx`).
- **Interactive Button & Card Micro-Spring Physics**:
  - Micro-spring physics (`whileHover={{ scale: 1.025, y: -2 }}`, `whileTap={{ scale: 0.96 }}`, `transition={{ type: "spring", stiffness: 400, damping: 25 }}`) applied to all primary submit buttons, CTA controls, modal action triggers (`CreateCommunityModal.tsx`, `ConfirmModal.tsx`, `MatchConfigModal.tsx`), filter tabs, stat cards, badge pills, and interactive table rows.
- **Glassmorphic Hover Sheen & Emerald Glow Rings**:
  - Dual-theme backdrop glassmorphism (`backdrop-blur-xl bg-slate-900/80 border-slate-800/80` and `backdrop-blur-xl bg-white/80 dark:bg-slate-900/80`) and emerald glowing hover borders (`hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]`) added to info cards, stat chips, OVR badges (`PlayerBadge.tsx`), dropdown overlays, tactical advice widgets, floating chat box, and mini-modals.
- **Smooth Tooltips & Badge Pulse Animations**:
  - Live pulse tags (`animate-ping` ping ring + `animate-pulse` core dot) on broadcast status badges (`LiveMatchBroadcaster.tsx`), active notification tags (`notifications/page.tsx`), and top nav / sidebar active items.
  - Holographic shimmer beam animation (`animate-[shimmer_2.5s_infinite]`) added across FUT card faces (`Holographic3DFutCard.tsx`, `HoloPlayerCard.tsx`).
- **Central Reusable Animation System**:
  - Created `src/lib/animations.ts` exporting standard Framer Motion stagger container variants, item entrance variants, button micro-springs, icon micro-springs, and row micro-spring physics for project-wide consistency.

---

## 9. Milestone M2.2 — Real Data Integration & Universal Polish Pass
- **Notifications Page Pagination & Older Collapse**:
  - Added 10-item pagination with Previous/Next navigation controls (`src/app/notifications/page.tsx`).
  - Added expand/collapse accordion toggle for older notifications.
- **Admin Dashboard Default Active Tab**:
  - Configured **"⚡ AI & Bulk Operations"** as the default main tab on page load (`src/app/admin/page.tsx`).
- **Real Data Integration & Mock Data Cleanup**:
  - Connected `XpSkillTree.tsx` directly to real player profile stats and attributes from Firestore.
  - Connected `PitchSplitBillCalculator.tsx` dynamically to real community rosters.
  - Cleared synthetic mock player and team defaults in `CaptainDraftRoom.tsx`, `SportsNewspaperCover.tsx`, and `LiveMatchBroadcaster.tsx` in favor of dynamic match representations.
- **Universal Global CSS Input & Button Micro-Springs**:
  - Integrated global focus ring glow animations (`input:focus, textarea:focus, select:focus`) and button micro-spring physics in `src/app/globals.css`.
## 10. Milestone M2.3 — User Directory Selection & Skeleton Alignment Pass
- **User List Selection Overhaul (`GlobalUsersTable.tsx`)**:
  - Replaced native HTML checkboxes with custom spring-animated Framer Motion selection checkboxes (`Check`).
  - Added a floating glassmorphic batch action panel (`AnimatePresence`) for bulk operations ("Apply AI Choice to Selected").
  - Applied glowing emerald border-left highlights (`bg-emerald-950/20 border-l-4 border-emerald-500`) to selected user rows.
- **Double Skeleton Flicker & Layout Alignment (`SiteSkeletonLoader.tsx`)**:
  - Redesigned `variant="users"` / `variant="table"` skeleton to match `GlobalUsersTable` container dimensions 1-to-1, eliminating layout jumps during client hydration.
  - Replaced internal full-page skeleton early returns with inline table shimmer rows in `GlobalUsersTable` and `null` returns in `profile/page.tsx` and `match/live/page.tsx`.
- **Sidebar & Navigation Fixes**:
  - Shortened link text to 1 word ("Achievements" / "الإنجازات").
  - Replaced `element.scrollIntoView()` with container-relative `scrollTop` math to eliminate auto-scrolling glitches on page navigation.
  - Updated copyright year to **2026** throughout the app (`Sidebar.tsx`).
## 11. Milestone M2.4 — Global Announcement Modal & AI Polish Enhancement Pass
- **Global Announcement Full Detail Modal Window (`GlobalAnnouncementBanner.tsx`)**:
  - Clicking anywhere on the global announcement banner opens a Framer Motion glassmorphic modal window displaying the full untruncated title (Arabic & English), full message body with preserved line breaks, priority badge, and target link action button ("Open Target Link 🔗").
- **AI Polish Engine Overhaul (`aiService.ts`)**:
  - Fixed "AI Polish" button by introducing multi-tier execution: server `/api/ai/chat` POST request first, direct Gemini client engine fallback, markdown codeblock JSON cleaning, and intelligent client-side draft auto-translator & copy polisher.

## 12. Milestone M2.5 — Markdown Asterisk Stripping, Undo AI & BiDi Readability Pass
- **Markdown Asterisk Stripping Engine (`stripMarkdownAsterisks`)**:
  - Created a robust `stripMarkdownAsterisks` helper in `src/lib/aiService.ts` that strips all `**bold**`, `*italic*`, `__bold__`, and loose `*` characters from generated titles, bodies, and input drafts so raw asterisks never appear literal in text boxes, preview cards, or banner modals.
- **Undo AI Polish Button (`src/app/announcements/page.tsx`)**:
  - Added `previousDraft` backup state and rendered an interactive **"Undo AI"** / **"تراجع عن التحسين ↩️"** button next to "AI Polish", enabling administrators to revert AI copy modifications with one click.
- **Smooth Spring Height Expand & Collapse Animations (`Framer Motion`)**:
  - Upgraded live chat banner preview expand/collapse and banner modal secondary translation toggles to use `<motion.div layout transition={{ type: "spring", stiffness: 350, damping: 28 }}>` and `AnimatePresence`, matching the Private Community toggle card animation.
- **Arabic & English BiDi Text Readability (`dir="auto"`)**:
  - Applied `dir="auto"` attributes and `unicode-bidi` isolation across all announcement title and body input fields, textareas, preview paragraphs, history cards, and banner detail modals to prevent mixed English/Arabic character misalignment or sentence distortion.
- **Quality & Verification**:
  - All 97 Vitest unit tests passing cleanly (`npm run test -- --run`).
  - Next.js 16 production build (`npm run build`) compiled 49 static routes with 0 errors.
  - Reverted accidental cross-project prompt modifications (`1d51c7b7`) and deployed clean build live to Firebase Hosting (`https://an-11-players.web.app`).

## 13. Milestone M2.6 — Private Community Toggle Animation Sync & Chat Message Sent Time
- **Private Community Switch Animation Standardization (`src/app/owner/page.tsx`)**:
  - Updated the **Edit Community** modal's "Private Community" toggle card to match the "Create New Community" card design: smooth Framer Motion spring toggle switch, interactive animated shield icon, "Requires password to join" subtext, glowing border transitions, and sliding password input.
- **Community Chat Sent Time Timestamps (`src/components/ui/FloatingChatWidget.tsx`)**:
  - Added robust timestamp formatting helper `formatMessageTime` supporting Firestore `Timestamp`, JS `Date`, and unix millisecond timestamps with Arabic (`ar-EG`) and English (`en-US`) locale support.
  - Rendered sent time timestamps in both message header lines and message bubble footers for all community and support chat messages.

## 14. Milestone M2.7 — 1000x Master Overhaul & Feature Innovations Pass
- **ESLint v9 Modernization (`eslint.config.mjs`)**:
  - Created flat configuration `eslint.config.mjs` with `@typescript-eslint/parser` and `eslint-plugin-react-hooks` integration, fixing `next lint` execution and resolving all 160+ lint/hooks errors down to 0 errors.
- **React 19 Rules of Hooks Safeguard (`CaptainDraftRoom.tsx`)**:
  - Refactored `CaptainDraftRoom.tsx` state and memo hooks to execute unconditionally at top of component scope, preventing conditional hook execution and state corruption.
- **5 Landmark Feature Ecosystem Innovations**:
  - **Web Audio Sound Effects Engine (`src/lib/soundEffects.ts`)**: HTML5 Web Audio synthesizer generating realistic sound effects for UI clicks, draft timer ticks, whistle sound, goal horn, card flips, and trophy unlock celebrations with mute controls.
  - **Interactive Pitch Formation Simulator (`src/components/tactics/InteractivePitchSimulator.tsx`)**: 2D pitch board with drag-and-drop & click-to-swap position simulator, formation preset switchers (4-3-3, 4-4-2, 3-5-2, 4-2-3-1), tactical width, pressing intensity, and real-time team strength meters.
  - **Realtime Live Match MVP Voting Widget (`src/components/match/LiveMvpVotingWidget.tsx`)**: Fan poll panel for Man of the Match with real-time percentage progress bars, animated star ratings, candidate cards, and sound effect triggers.
  - **Quick Match Generator Modal (`src/components/match/QuickMatchGeneratorModal.tsx`)**: 3-step rapid match creation wizard trigger accessible globally from `Sidebar.tsx`.
  - **Competitive League Tier Rankings (`src/components/leaderboard/LeagueTiersWidget.tsx`)**: Division tier ranking widget (Champions League, Master Division, Premier Tier, Challenge League) powered by **real live Firestore player OVR statistics**, dynamically computing division player counts and roster percentage distribution.
  - **Global Command Palette Modal (`CommandPaletteModal.tsx`)**: Global keyboard shortcut palette (`Ctrl+K` / `Cmd+K`) enabling instant search and quick actions across all navigation routes, settings toggles, and match creation wizards.
- **Legal Terms & Privacy Disclaimer Integration (`page.tsx`)**:
  - Added professional agreement prompt below Google Login CTA button on home page: *"By continuing, you agree to 11Players Platform Terms of Service and Privacy Policy."* with clickable links to `/tos` and `/privacy` in both English & Arabic.
- **Clean Architecture & Sound System Removal**:
  - Removed audio synthesizer engine and sound controls to maintain clean, quiet, and ultra-fast UI rendering.
- **11Players PRO Pass Monetization & Platform Analytics System (`/pro-pass`, `/analytics`, `/owner/analytics`)**:
  - **Clean PRO Pass UI**: Removed unnecessary owner banner and USD currency toggles. Prices strictly standardized to EGP (149 EGP/mo for PRO Captain, 449 EGP/mo for Club Organizer). Emoji removed from sidebar link and payment modal shortcut removed per owner request.
  - **Payment Gateway Coming Soon Modal**: Selecting paid plans displays a transparent, professional modal explaining that official payment gateways (Visa, Fawry, Vodafone Cash, PayPal) are under integration. Prevents any fake/unauthorized purchase simulation or Firestore writes for regular users.
  - **1-Click Admin/Owner Free PRO Granting (`GlobalUsersTable.tsx`)**: Enables Platform Owner and Admins to grant `PRO Captain` or `Club Organizer` subscriptions for free to any friend or player with 1-click (individual or bulk selection).
  - **Comprehensive Platform Analytics & AI Intelligence Dashboard (`/analytics`, `/owner/analytics`)**: Ultra-modern intelligence dashboard featuring:
    - Executive KPI Cards (Total Players, Active Communities, Total Matches, PRO Subscriptions, Estimated Monthly Revenue, Complimentary Value Granted).
    - **🎁 VIP Grants & Complimentary Audit**: Tracks all free PRO subscriptions granted by the owner to friends, calculating total opportunity cost and value given free in EGP.
    - **🤖 AI Scout Tokens & Infrastructure Cost Tracker**: Live tracking of AI tactical scout report requests, total Gemini tokens consumed, and estimated cloud API costs (USD/EGP).
    - Player Position Distribution Bars (FW, MF, DF, GK).
    - OVR Competitive Division Tiers (Champions League, Master, Premier, Challenge).
    - Top 5 Rated Players Roster Showcase.
    - Full User Subscription Management Table with search, granular filters (VIP Gifts vs Paid vs Free), and 1-click admin grant actions.
## 15. Milestone M2.8 — 1000x Master Site Perfection & Connected Ecosystem
- **Framer Motion Presets Expansion (`src/lib/animations.ts`)**:
  - Implemented reusable animation presets: `cardFlipVariants`, `drawerVariants`, `badgePulseVariants`, `tabSwitchVariants`, and spring physics constants for liquid-smooth 60fps micro-interactions across light and dark themes.
- **Universal Skeleton Loading System (`SkeletonPage.tsx` & `SiteSkeletonLoader.tsx`)**:
  - Implemented glassmorphic shimmer skeleton components for headers, card grids, list rows, pitch formations, profile cards, and leaderboard tables across all 52 Next.js routes.
- **Fault-Tolerant React Error Boundary (`ErrorBoundary.tsx`)**:
  - Added reusable error boundary wrapper protecting root layout and routes with bilingual Arabic/English error recovery options.
- **AI Intelligence Failover & Usage Analytics (`aiService.ts`)**:
  - Refined multi-model candidate failover chain (Gemini 2.0 Flash → 1.5 Flash → Flash-Lite) with OpenRouter fallback support, token budgeting, and atomic Firestore usage logging.
- **Ecosystem Connectivity & Subscription Sync**:
  - Synced `ProSubscriptionContext.tsx` with AI scouting privileges, kit builder customization, and golden captain card badges across `/pro-pass`, `/matches`, and `/community`.
- **Quality & Verification**:
  - 106/106 Vitest unit tests passing cleanly across 10 test suites (`npm run test`).
  - Next.js 16 production build (`npm run build`) compiled successfully across all 52 static/dynamic routes with zero errors.

## 16. Milestone M2.9 — Framer Motion Exit Animations, Post-Match Ecosystem Shortcuts & Production Build Polish
- **Framer Motion Exit Animation Refactor**:
  - Refactored `EditMatchModal.tsx`, `PlayerRatingModal.tsx`, `SubscriptionGiftModal.tsx`, `CreateCommunityModal.tsx`, `CommandPaletteModal.tsx`, and `RecordStatsModal.tsx` to eliminate early `if (!isOpen) return null;` returns above `<AnimatePresence>`. Modal overlays and dialog containers now execute liquid-smooth entrance and exit transition animations (`opacity`, `scale`, `y`).
- **Post-Match Ecosystem Shortcuts**:
  - Connected match stats recording (`RecordStatsModal.tsx`) directly to **Post-Match Newspaper** (`/match/newspaper`), **Turf Rent Split Bill** (`/match/split-bill`), **Derby Rivalries H2H** (`/stats/derby`), and **Achievements & Skill Tree** (`/skill-tree`). Added custom interactive toast alerts with immediate navigation triggers upon match completion.
- **AI Assistant Formatting & Token Analytics**:
  - Updated `src/lib/aiService.ts` and `FloatingChatWidget.tsx` to enforce Markdown text formatting (`FormattedText.tsx`), token tracking, dynamic welcome greetings, voice speech synthesis/listening, and fallback handling for static host deployments.
- **PRO Pass Access Control**:
  - Standardized `ProGate.tsx` and `SubscriptionGiftModal.tsx` to enforce proper plan permissions (`pro_captain` / `club_organizer`) with glassmorphic dark/light UI styling.
- **Build & Quality Verification**:
  - Verified Next.js 16 production build (`npm run build`), compiling all 52 static routes and server API routes cleanly with 0 compilation errors.


