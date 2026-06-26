# Explorer Findings Report: E2E Testing Track

This report presents the findings, architectural decisions, and directory layout design for the E2E test infrastructure of Hagoozat Elite, drafted by the E2E Explorer.

---

## 1. Requirement & Feature Analysis

Based on `d:\11Players\ORIGINAL_REQUEST.md` and `d:\11Players\PROJECT.md`, the Hagoozat Elite application has 5 primary features ($N = 5$) mapped to system requirements:

- **F1: Landing, Auth & Compliance**
  - Consists of Cookie Consent, Privacy Policy, and Terms of Service banners ($R1$).
  - Supports English (LTR) and Modern Standard Arabic (RTL) localization and theme synchronizations natively via local storage ($R4$).
  - Google OAuth login with post-auth check against `admins` collection in Firestore to designate Owner/Admin privileges ($R2$).
- **F2: Player Onboarding & Card Generation**
  - 4-step wizard:
    - Step 1 (Bio Data): name, calculated age, height, weight, preferred foot. Age is calculated instantly client-side ($R1$).
    - Step 2 (Visual Pitch Picker): interactive SVG field click zones, selecting positions sequentially (Primary, Secondary, Tertiary), hierarchical colors ($R1$).
    - Step 3 (Attributes & Skills): attribute sliders (1-99) with warning banners for unrealistic attributes, skills checklist ($R1$).
    - Step 4 (Card Generation & Upload): client-side background removal WASM, Cloudinary upload, dynamic Player Card layout ($R1$).
- **F3: Live Community Directory & Chat**
  - Real-time virtualized directory grid showing active player cards (updating live via `onSnapshot` listener) ($R2$).
  - Community group chat with message batching and virtualization ($R2$).
- **F4: Admin Dashboard & PDF Export**
  - Owner dashboard restricted by UIDs ($R2$).
  - Override stats & attributes, warn flag toggle (`hasWarning: true` triggers re-onboarding) ($R2$).
  - Profile PDF and Master Bulk PDF tabular summary ($R2$).
- **F5: Matchmaking Solver Engine**
  - `/api/matchmaking` endpoint taking 22 players ($R3$).
  - PSI calculation with 25% tertiary position penalty, physical height/weight multipliers ($R3$).
  - Backtracking conflict resolution prioritizing Primary > Secondary > Tertiary ($R3$).
  - Variance analysis for overall rating, speed, stamina, and defense (target < 5%) ($R3$).

---

## 2. Test Architecture Design

### Test Runner & Environment
We propose a **Jest** test runner configured to run TypeScript files using `ts-jest`.
- **Environment**: 
  - **JSDOM**: Used for client-side pages and components (F1, F2, F3, F4 client interactions).
  - **Node**: Used for API endpoints (F5 matchmaking solver) and server-side logic checks.
- **Why JSDOM over Playwright/Cypress for baseline E2E?**
  - In a `CODE_ONLY` network environment where Next.js pages and external Firebase resources are not yet fully implemented, running a browser automation tool is fragile and requires full production compilation.
  - JSDOM allows rendering client-side pages (react components) and simulating user events (clicking, typing, SVG interaction) in memory, running tests symmetrically against in-memory mocks.
  - Playwright can be added later once Next.js is fully built and running in live mode, but Jest + JSDOM serves as the core E2E validation engine during development.

### Mock/Simulation Framework
To allow tests to run before Next.js and Firebase integration is fully complete, we design a comprehensive simulation layer:
1. **MockFirebase**:
   - An in-memory JavaScript database that mimics the Firestore, Auth, and Storage SDKs.
   - Implements `onSnapshot` using an event listener/callback array. When a profile is updated via simulated admin methods, it calls all registered callbacks, replicating real-time updates.
   - Emulates authentication state changes via `onAuthStateChanged`.
2. **MockCloudinary**:
   - Mocks the Cloudinary upload API, returning mock asset URLs without sending HTTP requests.
3. **MockBackgroundRemover**:
   - Intercepts WebAssembly client-side calls to `@imgly/background-removal`, immediately returning a transparent mock pixel data URL to bypass neural network processing.
4. **MockPDFGenerator**:
   - Intercepts `jspdf` and `html2canvas` layout capture, returning a mock binary buffer to verify file export methods.

---

## 3. Proposed Directory Layout

```
d:/11Players/
├── tests/
│   └── e2e/
│       ├── config/
│       │   └── jest.config.ts        # Jest and ts-jest options
│       ├── mocks/
│       │   ├── firebase.ts          # Mock implementation of Firebase v10 client SDK
│       │   ├── cloudinary.ts        # Mock implementation of Cloudinary image uploads
│       │   ├── bg-removal.ts        # Mock implementation of client-side wasm background remover
│       │   └── jspdf.ts             # Mock implementation of jspdf and html2canvas PDF exporters
│       ├── helpers/
│       │   ├── test-context.ts      # Setup test environments, mock bindings, database teardown
│       │   └── dom-simulator.ts     # Wrapper functions for rendering and UI interactions
│       ├── tier1-feature/           # Happy path E2E tests (25 cases)
│       │   ├── auth-compliance.test.ts
│       │   ├── onboarding.test.ts
│       │   ├── community-hub.test.ts
│       │   ├── admin-dashboard.test.ts
│       │   └── matchmaking.test.ts
│       ├── tier2-boundary/          # Boundary & corner cases (25 cases)
│       │   ├── auth-compliance-boundary.test.ts
│       │   ├── onboarding-boundary.test.ts
│       │   ├── community-hub-boundary.test.ts
│       │   ├── admin-dashboard-boundary.test.ts
│       │   └── matchmaking-boundary.test.ts
│       ├── tier3-combination/      # Cross-feature combinations (5 cases)
│       │   └── cross-features.test.ts
│       └── tier4-workload/         # Real-world user stories / integration workloads (5 cases)
│           └── scenarios.test.ts
```

---

## 4. Test Specifications

### Tier 1: Feature Coverage (25 cases, 5 per feature)
- **F1.1**: Toggle language between English/Arabic; verify RTL change and content translation.
- **F1.2**: Toggle theme dark/light; verify local storage synchronization.
- **F1.3**: Standard user OAuth login completes successfully and triggers onboarding redirect.
- **F1.4**: Admin user OAuth login checks `admins` collection and grants administrator access.
- **F1.5**: Cookie consent banners allow/decline cookie storage; verify consent flags in local storage.
- **F2.1**: Step 1 bio data entry computes exact age from DOB (e.g. 1998-05-15 -> age 28 in 2026).
- **F2.2**: Step 2 interactive SVG pitch selector receives click events and maps click zones to Primary, Secondary, Tertiary positions.
- **F2.3**: Step 3 attributes entry sets values (70-80), attributes warnings remain hidden, and skills are checklisted.
- **F2.4**: Step 4 background remover WASM mock runs successfully, detaching image, and uploads to Cloudinary mock.
- **F2.5**: Full player card renders showing name, computed overall rating, positions, and transparent image.
- **F3.1**: Public directory grid displays active players, and reacts instantly to simulated `onSnapshot` data changes.
- **F3.2**: Virtualized grid displays and scrolls through a collection of player cards.
- **F3.3**: Community chat room receives text message, saves to Firestore sub-collection, and renders in view.
- **F3.4**: Community chat batching renders messages batched dynamically.
- **F3.5**: Directory grid shows warning indicators on player cards when warning flags are enabled.
- **F4.1**: Authorized admin accesses the Admin Dashboard and renders the player data table.
- **F4.2**: Admin overrides stats (goals, assists, mvp) for a player; change updates in Firestore.
- **F4.3**: Admin manually adjusts attributes of a player card from dashboard; saves and syncs.
- **F4.4**: Admin flags a player with `hasWarning: true` and verifies flag updates.
- **F4.5**: Admin exports Profile PDF and Master Bulk PDF reports, verifying mock PDF returns bytes.
- **F5.1**: Matchmaking endpoint balances two teams of 11 from a 22-player profile collection.
- **F5.2**: Matchmaking solver assigns exactly 1 Goalkeeper (GK) to each team.
- **F5.3**: Balance verification verifies average rating, speed, stamina, and defense are within 5% variance.
- **F5.4**: Solver applies 25% penalty on tertiary positions and respects weight mappings.
- **F5.5**: Backtracking hierarchy resolves placement conflicts prioritizing Primary > Secondary > Tertiary.

### Tier 2: Boundary & Corner Cases (25 cases, 5 per feature)
- **F1.1_B**: DOB entry under limits (e.g. age < 16, negative age, or age > 120), verifying error layout or validation blocking.
- **F1.2_B**: Rapid double toggling of language/theme styles to verify state stability.
- **F1.3_B**: Google OAuth token expiration during session; verify landing page redirection.
- **F1.4_B**: Special character sanitization in user profiles to prevent scripting injections (XSS).
- **F1.5_B**: Non-existent admin credentials access Admin Dashboard; verify 403 Forbidden rejection.
- **F2.1_B**: Leap year DOB (e.g. Feb 29, 2000) age verification.
- **F2.2_B**: Clicks outside SVG zone boundaries; verify selection state is unaffected.
- **F2.3_B**: Attributes sliders at boundary limits (minimum 1, maximum 99); verify constraints.
- **F2.4_B**: Set attribute values to extreme unrealistic levels (e.g. 99 all attributes); verify the forced warning banner is triggered.
- **F2.5_B**: Background remover WASM failure; verify fallback default picture layout.
- **F3.1_B**: Empty directory grid (0 players) renders a clean placeholder view.
- **F3.2_B**: Chat spamming/flooding checks (rate-limiting mock).
- **F3.3_B**: 1000+ character long chat message validation limits.
- **F3.4_B**: Concurrent client profile updates on Firestore `onSnapshot`; verify last-write wins or merge resolution.
- **F3.5_B**: 1000+ virtualized player grid scroll performance; checks memory stability.
- **F4.1_B**: Unauthorized player attempts dashboard URL access; verify redirect to home/landing.
- **F4.2_B**: Negative or floating-point stats override input validation; checks rejection.
- **F4.3_B**: Adjusting attribute overrides to invalid range (<1 or >99); checks rejection.
- **F4.4_B**: Toggling warning flags on offline users; verify persistence in Firestore.
- **F4.5_B**: Master Bulk PDF export with 0 players in collection; verify empty state PDF table layout.
- **F5.1_B**: `/api/matchmaking` with less than 22 players (e.g. 21); verify 400 Bad Request error.
- **F5.2_B**: `/api/matchmaking` with more than 22 players (e.g. 24); verify selection of top 22 or 400 Bad Request.
- **F5.3_B**: 22-player pool with 0 Goalkeepers (GK); verify 400 Bad Request: missing goalkeeper error.
- **F5.4_B**: 22-player pool where all 22 players are Goalkeepers; verify solver balances.
- **F5.5_B**: Matchmaking solver under extreme conflicts (e.g., 22 players all with identical position preferences); verify backtracking returns fallback.

### Tier 3: Cross-Feature Combinations (5 cases)
- **F_C1**: Admin Dashboard override -> Firestore sync -> Client community hub directory update -> Force re-onboarding warning flag triggers warning modal for target player on next auth change.
- **F_C2**: Flagged player (`hasWarning: true`) input in matchmaking endpoint; verify API handles them as unverified/restricted.
- **F_C3**: New player completes onboarding step 4 submit -> Profile saved -> Instant render on another client's community hub directory via `onSnapshot` sync.
- **F_C4**: Language Arabic RTL -> Trigger onboarding bio/attributes validation errors; verify error text and styles render in Arabic RTL.
- **F_C5**: Admin adjusts player attributes (increasing speed to 99) -> Runs matchmaking solver for pool containing player -> Recalculated PSI shifts team balance configuration.

### Tier 4: Real-World Scenarios (5 cases)
- **F_W1: Tournament Setup Workload**: 30 players register/onboard -> Admin overrides 5 player stats and flags 2 players -> Flagged players re-onboard -> Admin exports tabular PDF -> Admin balances 22 players via matchmaking endpoint.
- **F_W2: Matchday Rush Hour**: 22 players online on Live directory -> Heavy community chat room traffic (50 parallel messages) -> Matchmaking endpoint balance run -> Admin overrides speed attribute -> Real-time sync -> Matchmaking run re-calculates teams dynamically.
- **F_W3: Flagged Player Cycle**: Player joins with unrealistic stats -> Admin flags player -> Player session blocked and redirected to onboarding -> Player edits attributes -> Admin approves and clears flag -> Access restored.
- **F_W4: Multi-lingual Multi-theme Experience**: Player A (English/Light) and Player B (Arabic/Dark) onboard -> Player A chats -> Player B views in Arabic RTL Dark container and replies -> Player A views in LTR Light container -> Admin Arabic PDF export check.
- **F_W5: Extreme Database Recovery & Sync**: Player submits step 4 -> Network disconnected simulation -> Local error handler triggers -> Network restored -> Auto-upload and write transaction finishes -> Directory grid updates.
