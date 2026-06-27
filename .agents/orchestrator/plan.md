# Plan - Hagoozat Elite Improvements (2026-06-27)

This plan describes the roadmap and milestones to implement the requested UI/UX improvements, Arabic translations, profile workflows, and matchmaking logic improvements.

## Milestones

### Milestone 1: Codebase Exploration & Testing Baseline
- Objective: Investigate current codebase layout, existing test suites, Firebase configuration, and run a baseline test verification.
- Verification: Successful run of `npm run test:e2e` (or existing test commands) via worker/explorer.

### Milestone 2: UI & Styling Enhancements (R1)
- Objective:
  - Hide default HTML scrollbars across the app (use custom/hidden scrollbars).
  - Improve light mode styling for Admin & Community pages, ensuring loading screen respects active theme.
  - Highlight active tab in the Navbar.
  - Animate cookie acceptance banner (appear/disappear).
  - Remove "تسجيل اللاعب وتحديد البيانات" from welcome screen.
  - Add focus outline animation to Community search box.
  - Fix layout centering issues (no default typing box center, center on mobile when keyboard open).
  - Optimize page load speeds.
- Verification: Visual verification, component unit tests, and layout checks.

### Milestone 3: Arabic Localization (R2)
- Objective: Translate "Community Hub Lounge", Stats page, and Admin page fully to Arabic.
- Verification: Check text and language switching support.

### Milestone 4: Profile & Workflows (R3)
- Objective:
  - Fix "Player Not Found" error on profile page.
  - Owner workflow: Owner can create/edit profile anytime.
  - Normal user workflow: Edits go to a pending state in Firestore and require Owner's approval.
  - Unique usernames on registration with 7-day cooldown note and enforcement.
- Verification: Verify workflow state machine in Firestore and edit controls.

### Milestone 5: Community Chat Features (R4)
- Objective:
  - Display sender name and Google profile picture next to messages.
  - Add Reply and React (emoji) functionality.
- Verification: Verify Firestore chat structure and UI rendering.

### Milestone 6: Matchmaking & Admin Improvements (R5)
- Objective:
  - Limit Run Matchmaking button to Owner only, remove "(Admin)" text.
  - Hide/disable matchmaking button if registered players < 22.
  - Review and optimize stats, positions, ratings, and matchmaking balancing logic.
- Verification: Run matchmaking with mocked and real datasets; check team balancing metrics.

### Milestone 7: Final Integration, E2E Testing, and Deployment
- Objective: Validate all improvements, run full E2E test suite, and deploy to Firebase.
- Verification: Successful `npm run build` and `firebase deploy --project an-11-players` (or the configured Firebase project).
