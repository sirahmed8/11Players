# 📋 Master Project Execution Plan

## Phase 1: Foundation, AI Documentation & Global Design Tokens Setup
### Plan 1.1: AI Rule Architecture & Context Documentation
- [x] Task 1.1.1: Create `AGENT_INSTRUCTIONS.md` as the master directive for all AI tools.
- [x] Task 1.1.2: Generate `.cursorrules`, `CLAUDE.md`, `.github/copilot-instructions.md`, and `AGENTS.md`.
- [x] Task 1.1.3: Generate `PROJECT_OVERVIEW.md` and `DESIGN_SYSTEM.md`.

### Plan 1.2: Global Design System Tokens & Base Layout Architecture
- [x] Task 1.2.1: Audit `globals.css` and enhance glassmorphism utilities, dark/light contrast, and animations.
- [x] Task 1.2.2: Refactor `Sidebar.tsx`, `Footer.tsx`, `SettingsMenu.tsx`, `InstallPWA.tsx`, and `GlobalAnnouncementBanner.tsx`.
- [x] Task 1.2.3: Upgrade system modals and components: `ConfirmModal.tsx`, `CustomDropdown.tsx`, `CustomSelect.tsx`, `SiteRatingModal.tsx`, `SiteSkeletonLoader.tsx`, `FloatingChatWidget.tsx`.

---

## Phase 2: Landing Page & Onboarding Flow
### Plan 2.1: Modernized Landing Page
- [x] Task 2.1.1: Audit `src/app/page.tsx` dependencies, state hooks, and CTA flows.
- [x] Task 2.1.2: Refactor `src/app/page.tsx` hero pitch visualizer, animated stat counters, and feature card grids.
- [x] Task 2.1.3: Verify responsive layout, theme toggle support, and build integrity.

### Plan 2.2: 4-Step Onboarding Flow & AI Advisor
- [x] Task 2.2.1: Audit `src/app/onboarding/page.tsx` and child wizard step components.
- [x] Task 2.2.2: Refactor `OnboardingWizard.tsx`, `Step1PersonalInfo.tsx`, `Step2Positions.tsx`, `Step3Attributes.tsx`, `Step4PhotoSubmit.tsx`, and `OnboardingAIAdvisor.tsx`.
- [x] Task 2.2.3: Test step state persistence, profile creation Firestore calls, and RTL translation.

---

## Phase 3: Core Matchmaking Engine & Live Pitch Workspace
### Plan 3.1: Match Hub Page & Registration Workspace
- [x] Task 3.1.1: Audit `src/app/match/page.tsx`, `RegistrationPanel.tsx`, and `MatchHeader.tsx`.
- [x] Task 3.1.2: Refactor `src/app/match/page.tsx` header banner, squad selection controls, and pitch layout toggle.
- [x] Task 3.1.3: Verify player registration, auto-balancing algorithms, and community state context.

### Plan 3.2: Pitch Renderers & Tactical Squad Displays
- [x] Task 3.2.1: Audit `TurfMatchDisplay.tsx`, `MatchPitchDisplay.tsx`, `SVGPitchDisplay.tsx`, `SVGPitchPicker.tsx`, and `TacticalSuggestionsCard.tsx`.
- [x] Task 3.2.2: Refactor team cards, tactical formation pitches, SVG field lines, and AI tactical suggestion panels.
- [x] Task 3.2.3: Test drag-and-drop substitutions, position suitability badges, and team OVR calculations.

### Plan 3.3: Live Match Controller, Scoreboard & Event Modals
- [x] Task 3.3.1: Audit `LiveMatchController.tsx`, `LiveScoreboard.tsx`, `PenaltyShootout.tsx`, `MotmPanel.tsx`, `RecordStatsModal.tsx`, `MatchPredictionWidget.tsx`, `MatchTimeline.tsx`, and `MatchConfigModal.tsx`.
- [x] Task 3.3.2: Refactor timer controls, goal trackers, penalty shootout modals, MOTM voting cards, and post-match stat recorders.
- [x] Task 3.3.3: Verify live match timer accuracy, Firestore match history sync, and player stat update batch transactions.

---

## Phase 4: Community Hub, Real-Time Chat & Community Settings
### Plan 4.1: Community Directory & Public Community Hub
- [x] Task 4.1.1: Audit `src/app/communities/page.tsx` and community modals (`CreateCommunityModal.tsx`, `ManageUserCommunitiesModal.tsx`, `CommunityChallengeModal.tsx`).
- [x] Task 4.1.2: Refactor community search cards, join password inputs, creation forms, and inter-community challenge modals.
- [x] Task 4.1.3: Test Firestore community list fetching, join requests, and search filter responsiveness.

### Plan 4.2: Active Community Workspace & Pulse Feed
- [x] Task 4.2.1: Audit `src/app/community/page.tsx`, `CommunityPulseFeed.tsx`, and `CommunityStatsEditor.tsx`.
- [x] Task 4.2.2: Refactor active community header, pulse feed summary widgets, match activity timeline, and leaderboards.
- [x] Task 4.2.3: Verify real-time pulse feed listeners, active community switching, and permissions checks.

### Plan 4.3: Real-Time Community Chat Room & Settings
- [x] Task 4.3.1: Audit `src/app/community-chat/page.tsx` and `src/app/community-settings/page.tsx`.
- [x] Task 4.3.2: Refactor chat message bubbles, emoji pickers, voice message players, announcement pins, and community settings form.
- [x] Task 4.3.3: Verify Firestore chat collection sub-queries, image attachment uploads, and admin permissions.

---

## Phase 5: Player Profiles, Peer Ratings & FUT-Style Cards
### Plan 5.1: Player Directory & Profile Workspace
- [x] Task 5.1.1: Audit `src/app/users/page.tsx`, `src/app/profile/page.tsx`, and `EditProfileModal.tsx`.
- [x] Task 5.1.2: Refactor player directory grid, user profile header, position chips, and profile edit modal.
- [x] Task 5.1.3: Verify user search filters, profile updates, photo uploads, and Firestore sync.

### Plan 5.2: FUT Player Cards, Podiums & Exporters
- [x] Task 5.2.1: Audit `PlayerCard.tsx`, `PlayerCardCompact.tsx`, `PlayerOfTheWeekCard.tsx`, `Top3Podium.tsx`, `PDFPlayerCard.tsx`, and `PDFBulkTable.tsx`.
- [x] Task 5.2.2: Refactor FUT card tier glow borders, position suitability badges, POTW gold cards, and PDF report templates.
- [x] Task 5.2.3: Verify high-resolution PDF download rendering, overall rating theme boundaries, and mobile responsiveness.

### Plan 5.3: Rating Systems, Radar Analytics & Attribute Controls
- [x] Task 5.3.1: Audit `PlayerRatingModal.tsx`, `SuggestPeerRatingModal.tsx`, `PlayerComparisonModal.tsx`, `AttributeSliders.tsx`, `AttributesBreakdown.tsx`, `OVRHistoryChart.tsx`, and `OvrExplanationModal.tsx`.
- [x] Task 5.3.2: Refactor peer rating sliders, head-to-head comparison radar charts, OVR trajectory graphs, and attribute breakdown tables.
- [x] Task 5.3.3: Verify peer rating calculation formulas, daily rating aggregation jobs, and comparison state logic.

---

## Phase 6: Leaderboards, Season Ceremony & Achievements
### Plan 6.1: Community Leaderboard & Overall Rankings
- [x] Task 6.1.1: Audit `src/app/stats/page.tsx` and `src/app/global/page.tsx`.
- [x] Task 6.1.2: Refactor top 3 animated podiums, goalscorer tables, assist leaderboards, MVP counts, and global player rankings.
- [x] Task 6.1.3: Verify stat sort order toggles, pagination, search filters, and Arabic localization.

### Plan 6.2: Achievements Engine & Season Ceremony
- [x] Task 6.2.1: Audit `src/app/achievements/page.tsx`, `src/app/season-ceremony/page.tsx`, and `SeasonCeremonyModal.tsx`.
- [x] Task 6.2.2: Refactor achievement badge grid, progress bars, season awards ceremony slides, and Golden Boot/Ball trophies.
- [x] Task 6.2.3: Verify achievement trigger criteria evaluation, trophy animations, and seasonal reset actions.

---

## Phase 7: Administration, Support & Utility Pages
### Plan 7.1: Admin Dashboard & Pending Requests
- [x] Task 7.1.1: Audit `src/app/admin/page.tsx`, `AdminTable.tsx`, `AdminTableRow.tsx`, `PendingEdits.tsx`, and `PendingRequests.tsx`.
- [x] Task 7.1.2: Refactor admin tab navigation, player attribute editing tables, pending attribute request cards, and bulk AI suggestion tools.
- [x] Task 7.1.3: Verify Firestore admin batch operations, edit approval/rejection logic, and toast notifications.

### Plan 7.2: Owner Operations Dashboard & Global User Directory
- [x] Task 7.2.1: Audit `src/app/owner/page.tsx`, `GlobalUsersTable.tsx`, and `GlobalUserRow.tsx`.
- [x] Task 7.2.2: Refactor community creation forms, admin assignment modals, AI engine model toggles, and global user role controls.
- [x] Task 7.2.3: Verify owner authorization middleware, global database backups, and community deletion cascades.

### Plan 7.3: Messaging, Notifications & Support Systems
- [x] Task 7.3.1: Audit `src/app/inbox/page.tsx`, `src/app/notifications/page.tsx`, `src/app/announcements/page.tsx`, and `src/app/support/page.tsx`.
- [x] Task 7.3.2: Refactor direct message threads, real-time notification lists, community announcement broadcasts, and support ticket creation.
- [x] Task 7.3.3: Verify unread badge count synchronization, notification mark-as-read Firestore updates, and ticket resolution logic.

### Plan 7.4: User Guide & Legal Policy Pages
- [x] Task 7.4.1: Audit `src/app/guide/page.tsx`, `src/app/privacy/page.tsx`, `src/app/tos/page.tsx`, `src/app/cookie/page.tsx`, and `src/app/maintenance/page.tsx`.
- [x] Task 7.4.2: Refactor interactive user guide accordion, privacy policy legal layout, terms of service cards, cookie choices banner, and maintenance mode overlay.
- [x] Task 7.4.3: Verify legal page navigation links, dark/light contrast legibility, and maintenance mode toggle flag.

---

## Phase 8: Cross-Platform Mobile Application (React Native & Expo)
### Plan 8.1: Architecture, Credentials & Preview Engine Setup
- [x] Task 8.1.1: Document mobile app architecture, dependencies, and setup commands in `MOBILE_APP_OVERVIEW.md`.
- [x] Task 8.1.2: Configure `eas.json` cloud build profiles (development, preview APK/IPA, production AAB).
- [x] Task 8.1.3: Define shared Firebase Mobile auth hooks & Firestore path bridges (`src/lib/firestorePaths.ts`).

### Plan 8.2: Mobile Design System & Shared Native Components
- [x] Task 8.2.1: Implement mobile glassmorphic native cards, bottom sheet containers, and touch feedback wrappers.
- [x] Task 8.2.2: Implement native SVG tactical field visualizer (`MobilePitch.tsx`) with haptic drag-and-drop support.
- [x] Task 8.2.3: Build native animated FUT player card component (`FUTCardNative.tsx`) supporting OVR tier themes.

### Plan 8.3: Auth & Onboarding Mobile Module
- [x] Task 8.3.1: Build native Google Auth login & anonymous sign-in screen (`mobile/app/(auth)/login.tsx`).
- [x] Task 8.3.2: Build 4-step native swipeable onboarding flow (`mobile/app/(auth)/onboarding.tsx`).
- [x] Task 8.3.3: Verify Firebase Auth state sync between Web and Mobile clients.

### Plan 8.4: Core Bottom Tab Navigation & Screen Modules
- [x] Task 8.4.1: Build Bottom Tab Navigation shell with smooth haptic tab bar (`mobile/app/(tabs)/_layout.tsx`).
- [x] Task 8.4.2: Build Home Dashboard screen (`mobile/app/(tabs)/index.tsx`).
- [x] Task 8.4.3: Build Tactical Matchmaking & Pitch Hub screen (`mobile/app/(tabs)/match.tsx`).
- [x] Task 8.4.4: Build Community Directory & Real-time Chat screen (`mobile/app/(tabs)/community.tsx`).
- [x] Task 8.4.5: Build Leaderboards & Podium screen (`mobile/app/(tabs)/stats.tsx`).
- [x] Task 8.4.6: Build Native FUT Profile & Settings screen (`mobile/app/(tabs)/profile.tsx`).

### Plan 8.5: Native Bottom Sheet Modals & Cloud Build Verification
- [x] Task 8.5.1: Build native bottom-sheet modals for peer rating, profile editing, and match config.
- [x] Task 8.5.2: Verify real-time bi-directional data synchronization between Web and Mobile.
- [x] Task 8.5.3: Validate EAS Cloud Build configuration for Android APK and iOS TestFlight binaries.

