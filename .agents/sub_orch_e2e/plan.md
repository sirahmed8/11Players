# Plan: Hagoozat Elite E2E Testing Track

## Objective
Design, implement, and verify a comprehensive, opaque-box, requirement-driven E2E test suite for the Hagoozat Elite project, conforming to the system requirements and minimum test case thresholds.

## Features to Test (N = 5)
1. **F1: Landing, Auth & Compliance**: Terms/Privacy/Cookie consent banners, Google OAuth login, Admin vs Player designation.
2. **F2: Onboarding Flow**: 4-step onboarding, client-side age calculation, SVG Position Picker (Primary/Secondary/Tertiary selection), attributes (1-99) & skills checklist, realism warnings, client-side background removal & dynamic Player Card.
3. **F3: Live Community Hub**: Real-time Directory Grid (onSnapshot updates), real-time community chat (message batching, virtualized rendering).
4. **F4: Admin Dashboard**: Table of players, override stats & attributes, warning flag (`hasWarning: true`), PDF Generation (Profile PDF & Master Bulk PDF).
5. **F5: Matchmaking Engine**: `/api/matchmaking` endpoint, 22-player input, team balance verification (variance < 5% in rating/speed/stamina/defense), 1 GK per team, PSI calculation (with 25% tertiary penalty, physical multipliers), backtracking conflict resolution.

## Test Thresholds (N = 5)
- **Tier 1 (Feature Coverage)**: >= 25 tests (5 per feature)
- **Tier 2 (Boundary & Corner Cases)**: >= 25 tests (5 per feature)
- **Tier 3 (Cross-Feature Combinations)**: >= 5 tests (pairwise interactions)
- **Tier 4 (Real-world Application Scenarios)**: >= 5 tests (integration workloads)
- **Total Minimum**: 60 test cases

## E2E Testing Infrastructure Design
- **Language**: TypeScript
- **Framework**: Jest (or a lightweight custom E2E runner using tsx/ts-node if package.json dependencies are limited) or Playwright. Let's design it with Jest/Playwright. Since there is no Next.js project yet fully set up, we should provision the testing framework in `package.json` (or add it if M1 sets up `package.json`).
Wait, we need to create the files at the project root. Let's make sure the test runner can be executed and runs against both the mock inputs/APIs and simulated DOM environments.
- **Directory Layout**:
  - `tests/e2e/runner.ts` (or similar runner script)
  - `tests/e2e/tier1-feature/`
  - `tests/e2e/tier2-boundary/`
  - `tests/e2e/tier3-combination/`
  - `tests/e2e/tier4-workload/`
  - `tests/e2e/mocks/` (Mocks for Firebase, Cloudinary, @imgly/background-removal)

## Milestones
1. **Milestone 1**: Initialize E2E test infra. Create `TEST_INFRA.md`. Set up test runner, mock environments, and base configurations.
2. **Milestone 2**: Implement Tier 1 (Feature Coverage) test cases (25+ tests).
3. **Milestone 3**: Implement Tier 2 (Boundary & Corner) test cases (25+ tests).
4. **Milestone 4**: Implement Tier 3 (Cross-Feature) and Tier 4 (Real-world) test cases (10+ tests).
5. **Milestone 5**: Full suite verification & compilation of `TEST_READY.md`.

## Verification Plan
For each milestone:
- Run the worker to implement files.
- Run the reviewer to inspect correctness, compliance with specifications, and verify test case counts.
- Gate verification.
