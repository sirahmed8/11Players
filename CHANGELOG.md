# Changelog

All notable changes to the **11Players** repository will be documented in this file.

## [2026-07-27] - 1000x Platform Transformation & Master Audit

### Added & Enhanced
- **Interactive Hero Google Login CTA**: Added a primary Google Auth CTA button directly in the landing page hero section ([src/app/page.tsx](file:///d:/11Players/src/app/page.tsx#L411-L421)) with active scale micro-interactions, glassmorphic button glow, and state spinners.
- **Glassmorphic Footer Component**: Refactored [src/components/layout/Footer.tsx](file:///d:/11Players/src/components/layout/Footer.tsx) with backdrop blur filtering, developer contact badges, theme-responsive contrast, and Framer Motion micro-interactions.
- **Full Sitemap Documentation**: Updated [PROJECT_OVERVIEW.md](file:///d:/11Players/PROJECT_OVERVIEW.md#L55-L73) and [EXECUTION_PLAN.md](file:///d:/11Players/EXECUTION_PLAN.md) to document the complete 18-stage sitemap architecture with 100% synchronicity.

### Quality Verification & Preservations
- **Unit Testing**: Verified 18/18 Vitest unit test suite passing (`npm run test`).
- **Production Build**: Verified 100% clean Next.js 16 production build across all 31 app routes and API endpoints (`npm run build`).
- **Logic Safeguards**: Preserved 100% backward compatibility of [src/lib/engine.ts](file:///d:/11Players/src/lib/engine.ts), [src/lib/firestorePaths.ts](file:///d:/11Players/src/lib/firestorePaths.ts), `AuthContext.tsx`, `CommunityContext.tsx`, and `PlayersContext.tsx`.

## [2026-07-25] - Engine Hardening, Security, Testing & Repo Hygiene

### Added
- **Unit Testing Suite (`Phase 0`)**: Integrated Vitest unit testing framework (`npm test`) with initial test suites for `engine.ts` (`tests/unit/engine.test.ts`) and `overallCalculator.ts` (`tests/unit/overallCalculator.test.ts`).
- **Path Alias Resolution**: Configured `vitest.config.ts` mapping `@/` to `./src` for clean test imports.

### Security & Access Control
- **Avatar Upload Endpoint (`Phase 1`)**: Added Bearer authorization header validation to `/api/avatar/upload/route.ts` to prevent unauthenticated file writes.
- **Deduplicated Firestore Rules (`Phase 1`)**: Extracted `isProtectedPlayerField()` helper function in `firestore.rules` to prevent rule drift between global `/players/{userId}` and community `/communities/{cid}/players/{userId}` update operations.
- **Cross-Community Data Leak Fix (`Phase 1`)**: Scoped global edit request count listener in `AdminTable.tsx` by `activeCommunityId` to eliminate cross-community pending edit badge leaks.

### UI & UX Improvements
- **Pitch Player Dragging**: Fixed pitch player dragging performance in `MatchConfigModal.tsx` by removing `transition-transform` and binding drag constraints to `containerRef` (`dragElastic={0}`, `dragMomentum={false}`). Dragging is now 60fps smooth and strictly locked inside the pitch container.
- **Dynamic AI Formations**: Added strict out-of-position penalties (`mult < 0.50`) preventing attackers from playing defense, and enabled full tactical formation re-rolls.
- **Clean Toast Notifications (`Phase 2`)**: Replaced native browser `alert()` call in `BlobPhotoUpload.tsx` with `react-hot-toast` notifications.

- **Dead Code Cleanup (`Phase 5`)**: Removed unused `getSpecialSkillsBonus()` function from `overallCalculator.ts`.
- **Fisher-Yates Shuffle (`Phase 5`)**: Replaced biased `0.5 - Math.random()` sort comparator in `adviceGenerator.ts` with a true Fisher-Yates uniform shuffle.
- **Bounded Real-Time Listeners (`Phase 6`)**: Applied query `limit(50)` to match history listener in `useMatchData.ts` and `limit(100)` with clean subscription teardown in `CommunityChallengeModal.tsx`.
- **Repo Hygiene (`Phase 7`)**: Removed legacy `.eslintrc.json` (superseded by flat `eslint.config.mjs`) and untracked `.agents/` / `.zcode/` directories in `.gitignore`.
- **Documentation Alignment (`Phase 8`)**: Updated `README.md` frontend framework stack specifications.
