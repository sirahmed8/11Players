# Hagoozat Elite — E2E Testing Infrastructure Specification

This document details the End-to-End (E2E) testing infrastructure, methodology, and test suite design for Hagoozat Elite, an enterprise-grade Football Community & Matchmaking Web Application.

---

## 1. Test Philosophy

Our testing strategy follows a strict **opaque-box, requirement-driven** model to ensure validation is decoupled from the implementation details.

### Opaque-Box Validation
Tests assert against the application's external interfaces (the visible DOM, user-facing controls, API responses, and side-effects in simulated databases) rather than component internals, state-management frameworks, or function scopes. This ensures that refactoring Next.js pages or Firestore database pathways will not break the test assertions as long as the functional requirements remain identical.

### Requirement-Driven Testing
Every test is traceably mapped back to the system requirements ($R1$ through $R4$) from the project brief. A test is considered valid only if it asserts a happy path, boundary condition, or interaction required by the master specification.

### Dual-Execution Modes: Mock vs. Live
To achieve maximum reliability and support offline/development workflows, the E2E suite supports two modes configured via environment variables:

1. **Mock Mode (Default, Offline)**
   - **Purpose**: Runs in a purely simulated environment, executing and verifying E2E test cases before the Next.js frontend or Firebase database backend is fully built.
   - **Simulation Layer**: Employs an in-memory Firebase simulator (`MockFirebase`), intercepting `firebase/app`, `firebase/auth`, and `firebase/firestore` calls.
   - **Asset/Processing Mocks**: Intercepts `@imgly/background-removal` WASM execution and Cloudinary upload requests to instantly return standard transparent mocks and mock URLs.
   - **PDF Generation Mock**: Mocks `jspdf` and `html2canvas` output to return structured byte buffers.
   - **Speed**: Executes in milliseconds with zero network overhead.

2. **Live Mode (Integration / Staging)**
   - **Purpose**: Validates the true production build against live Cloud services.
   - **Services**: Connects to a Firebase Local Emulator Suite (or a dedicated staging project) and uses a live sandbox Cloudinary account.
   - **Requirement**: Full implementation of all page components and Next.js backend routes.

---

## 2. Feature Inventory (N = 5)

We decompose the requirements into $N = 5$ distinct core features. Each feature is mapped back to the system specifications:

| Feature ID | Feature Name | Description | Requirements Mapped |
| :--- | :--- | :--- | :--- |
| **F1** | **Landing, Auth & Compliance** | Landing screen cookie consent, privacy policy/terms, Google OAuth login, and owner/admin check. Native Light/Dark theme and English/Arabic (RTL) localization. | $R1$, $R2$, $R4$ |
| **F2** | **Player Onboarding & Card Generation** | 4-step wizard: Bio data input (with client-side age calculation), interactive SVG tactical pitch position selector (Primary, Secondary, Tertiary), attributes sliders (1-99 with warning banners) and skills checklist, WASM background removal, Cloudinary upload, and FIFA/PES-style Player Card layout. | $R1$, $R2$, $R4$ |
| **F3** | **Live Community Directory & Chat** | Real-time virtualized directory grid showing active player cards (updating live via `onSnapshot`), and community group chat with message batching and virtualization. | $R2$, $R4$ |
| **F4** | **Admin Dashboard & PDF Export** | Protected dashboard view for verified owner UIDs, capability to override attributes/stats, toggle forced warning flags, and export Player Profile and Master Bulk PDFs. | $R2$, $R4$ |
| **F5** | **Matchmaking Constraint Engine** | `/api/matchmaking` balancing endpoint, 22-player validation, team-balance variance constraint (< 5% difference in overall, speed, stamina, and defense), 1 GK per team, and backtracking conflict solver with tertiary penalty (25% deduction). | $R3$, $R4$ |

---

## 3. Test Architecture

The E2E test suite is run locally using **Jest** and **TypeScript** (`ts-jest`), executing in a **JSDOM** environment for frontend testing and a **Node** environment for backend API route testing.

### Runner Location & Invocation Command
- **Configuration File**: `d:/11Players/tests/e2e/config/jest.config.ts`
- **Execution Command**:
  ```bash
  # Run the full E2E suite in mock mode
  npm run test:e2e
  
  # Run the E2E suite against live/emulated firebase services
  cross-env TEST_MODE=live npm run test:e2e
  ```

### Directory Layout
The tests and mocks are organized as follows:

```
d:/11Players/
├── tests/
│   └── e2e/
│       ├── config/
│       │   └── jest.config.ts        # Jest configurations for E2E tests
│       ├── mocks/
│       │   ├── firebase.ts          # Memory-based Firebase Mock SDK (Auth, Firestore, Storage)
│       │   ├── cloudinary.ts        # Cloudinary API Mock
│       │   ├── bg-removal.ts        # @imgly/background-removal WASM Mock
│       │   └── jspdf.ts             # PDF Generation Mock
│       ├── helpers/
│       │   ├── test-context.ts      # Global setup/teardown, mock installation
│       │   └── dom-simulator.ts     # User interaction simulators (clicks, input, SVG clicks)
│       ├── tier1-feature/           # Happy path E2E tests (>= 25 cases, 5 per feature)
│       │   ├── auth-compliance.test.ts
│       │   ├── onboarding.test.ts
│       │   ├── community-hub.test.ts
│       │   ├── admin-dashboard.test.ts
│       │   └── matchmaking.test.ts
│       ├── tier2-boundary/          # Boundary & corner cases (>= 25 cases, 5 per feature)
│       │   ├── auth-compliance-boundary.test.ts
│       │   ├── onboarding-boundary.test.ts
│       │   ├── community-hub-boundary.test.ts
│       │   ├── admin-dashboard-boundary.test.ts
│       │   └── matchmaking-boundary.test.ts
│       ├── tier3-combination/      # Pairwise and cross-feature interactions (>= 5 cases)
│       │   └── cross-features.test.ts
│       └── tier4-workload/         # Real-world integration workloads (>= 5 cases)
│           └── scenarios.test.ts
```

---

## 4. Real-World Application Scenarios (Tier 4 List)

These scenarios represent high-fidelity integration workloads that simulate typical active user and administrator behaviors in a production lifecycle.

### F_W1: Community Tournament Setup Workload
- **Description**: Simulates the standard lifecycle of setting up a weekend community match from scratch.
- **Workflow**:
  1. Register 30 players via Google OAuth, completing their 4-step onboarding profiles.
  2. Log in as Admin and review the player directory.
  3. Admin overrides stats (goals, assists) for 5 players, and marks 2 players as having warning flags (`hasWarning: true`) due to unrealistic attributes.
  4. The 2 flagged players log in, are forced to re-complete onboarding with adjusted, realistic attributes.
  5. Admin exports the Master Bulk PDF showing all 30 player profiles.
  6. Admin submits a pool of 22 active, warning-free players to `/api/matchmaking` and verifies the returned balanced team lists.

### F_W2: Active Matchday Rush Hour
- **Description**: Simulates high concurrency and real-time synchronization under matchday conditions.
- **Workflow**:
  1. Log in 22 players who open the Live Community Hub.
  2. Simulate the 22 players actively chatting (sending 50 messages in parallel batches), verifying the virtualized chat layout does not lag.
  3. The matchmaking solver is invoked for these 22 players to generate Team A and Team B.
  4. During match prep, the Admin updates a player's physical weight and attribute sliders.
  5. The change propagates instantly to all connected users via `onSnapshot`.
  6. Matchmaking is re-executed; verify that the teams adjust dynamically to maintain balance under the 5% variance threshold.

### F_W3: Flagged Player Reclamation Cycle
- **Description**: Verifies the system's compliance and warning loops.
- **Workflow**:
  1. A player logs in with unrealistic stats.
  2. Admin flags the player with `hasWarning: true` in the Admin Dashboard.
  3. The player's active session is intercepted: they are blocked from accessing the Community Directory or Chat, and are forced into onboarding step 3 (sliders).
  4. The player corrects their attributes and completes onboarding.
  5. The warning is cleared in the database.
  6. The player is granted access to the Community Hub and chat again.

### F_W4: Multi-lingual Multi-theme Experience
- **Description**: Asserts the layout and functional fidelity across language (LTR vs. RTL) and styling contexts.
- **Workflow**:
  1. Player A logs in with language set to English, theme set to Light.
  2. Player B logs in with language set to Arabic, theme set to Dark.
  3. Both complete onboarding. Verify that error validation messages for Player B render in Arabic RTL.
  4. Player A posts a chat message (English, LTR layout container).
  5. Player B receives it in their Dark Mode, Arabic RTL layout container and replies in Arabic.
  6. Player A receives the Arabic reply in their Light Mode LTR layout container.
  7. Admin logs in, adjusts attributes, and exports a Profile PDF in Arabic; verify text encoding handles Arabic characters.

### F_W5: Extreme Database Recovery & Sync
- **Description**: Validates client-side persistence and offline sync capabilities.
- **Workflow**:
  1. Player begins onboarding.
  2. During Step 4 (card upload), simulate a database/network disconnect.
  3. Verify the client-side displays an offline error warning and prevents system failure.
  4. Simulate a network reconnect.
  5. The client automatically retries, uploading the transparent image to Cloudinary and writing the profile to Firestore.
  6. Verify the player's card shows up instantly in the directory grid on other connected clients.

---

## 5. Test Case Counts for All 4 Tiers

Conforming to the project's strict coverage constraints, the E2E test suite contains a minimum of **60 test cases** structured across 4 distinct tiers:

| Test Tier | Focus Area | Case Count | Description |
| :--- | :--- | :--- | :--- |
| **Tier 1** | **Feature Coverage** | **25 cases** | Happy path execution verifying functional baselines (5 tests per feature for F1–F5). |
| **Tier 2** | **Boundary & Corner Cases** | **25 cases** | Asserts system behavior on limits, empty states, and invalid inputs (5 tests per feature for F1–F5). |
| **Tier 3** | **Cross-Feature Combinations** | **5 cases** | Evaluates pairwise feature interactions (e.g., Onboarding writing -> Real-time grid sync). |
| **Tier 4** | **Real-World Scenarios** | **5 cases** | Multi-user flows and complete user journeys (F_W1 through F_W5). |
| **Total** | | **60 cases** | **Formula**: $11 \times N + \max(5, N/2) = 11 \times 5 + 5 = 60$ |

---

*Note: The mock frameworks are located under `tests/e2e/mocks/` and will be loaded by the test harness prior to execution when running under Node/JSDOM.*
