# Execution Plan — Next.js Overhaul (11Players)

This plan outlines the steps to perform a complete overhaul of the Next.js application, focusing on navigation, performance, layout, codebase clean-up, and Firebase deployment.

## Milestones

1. **Milestone 1: Performance Audit and Codebase Exploration**
   - **Scope**: Identify causes of slow page transitions, search for dead code and unused packages, and analyze layout translation/text direction issues.
   - **Verification**: Handoff report from the Explorer subagent.
   
2. **Milestone 2: Test Suite Preparation (E2E Test Track)**
   - **Scope**: Implement robust Jest tests in `tests/e2e` verifying the overhaul requirements (navigation existence, RTL/LTR formatting, performance checks).
   - **Verification**: `TEST_READY.md` generated with passing test runs.

3. **Milestone 3: Navigation Overhaul & Text Layout Fixes**
   - **Scope**: Replace page-specific Back buttons with a persistent top navigation bar. Fix text direction rendering for English strings.
   - **Verification**: Reviewer confirmation and Jest E2E tests passing.

4. **Milestone 4: Codebase Refactoring & Performance Optimizations**
   - **Scope**: Remove unused packages/dead code, apply loading optimizations (e.g., streaming, code-splitting, query caching), and implement state management or UI updates.
   - **Verification**: Reviewer verification of refactored code and performance.

5. **Milestone 5: Verification and Testing Gate**
   - **Scope**: Pass 100% of the E2E test suite (Tiers 1-4) and conduct adversarial coverage hardening (Tier 5).
   - **Verification**: Forensic Auditor verification and E2E Jest results.

6. **Milestone 6: Production Build & Deployment**
   - **Scope**: Execute `npm run build` to confirm compilation without errors and deploy to Firebase.
   - **Verification**: Successful build output and Firebase deployment log.

## Verification Procedures
- All code changes will be verified by running builds and tests in the subagents.
- Forensic Auditor will run static checks to ensure clean implementations.
