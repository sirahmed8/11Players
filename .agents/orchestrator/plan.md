# Implementation Plan - Hagoozat Elite

This plan describes the high-level roadmap and architectural steps for Hagoozat Elite, conforming to the Project Pattern.

## Dual-Track Strategy
The project will run two tracks in parallel:
1. **E2E Testing Track**: Build the test infrastructure and a comprehensive 4-tier test suite.
2. **Implementation Track**: Decompose the project into sequential milestones, developing the frontend, backend integration, admin dashboard, and matchmaking engine.

## Milestones Decomposition
We will target the following milestones:
- **Milestone 1: Project Setup & Baseline**
  - Git repository layout, TypeScript configuration, Next.js boilerplate, Firebase config, Tailwind CSS, and basic ESLint setup.
- **Milestone 2: Database Schema, Security Rules & Authentication**
  - Implement Google OAuth, configure public/private Firestore collections (e.g. `admins`, `players`, `chats`) under the '11Players' Firebase project scope, and define Firestore security rules.
- **Milestone 3: 4-Step Onboarding Wizard**
  - Step 1 (Bio Data) with age computation.
  - Step 2 (Interactive SVG Pitch Position Picker).
  - Step 3 (Attribute sliders and skills checklist).
  - Step 4 (Client-side background removal using `@imgly/background-removal`, Cloudinary upload using cloud name `dfvh4jcsh` and unsigned preset `11players`, and FIFA/PES-style Player Card).
- **Milestone 4: Live Community Hub & Chat**
  - Real-time directory grid with `onSnapshot` listener.
  - Virtualized real-time chat with message batching.
- **Milestone 5: Admin Dashboard & PDF Engine**
  - Restricted Admin view for profile adjustments (override stats, toggle warnings).
  - Single profile PDF export & Master Bulk PDF summary.
- **Milestone 6: Matchmaking API & Constraint Engine**
  - `/api/matchmaking` endpoint implementation.
  - Positional Suitability Index ($PSI$) calculation with penalties and physical attribute modifiers.
  - Two-team backtracking/balancing solver.
- **Milestone 7: E2E Integration and Adversarial Hardening**
  - Integrate all modules and execute the full test suite.
  - Perform adversarial testing (white-box gap analysis) to harden coverage.

## Verification
- Each milestone must undergo exploration, implementation, review, and forensic audit.
- No milestone is declared complete without a passing audit and verified build/test suite.
