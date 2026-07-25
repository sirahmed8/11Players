# Changelog

All notable changes to the **11Players** repository will be documented in this file.

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

### Code Hygiene & Dead Code Removal
- **Dead Code Cleanup (`Phase 5`)**: Removed unused `getSpecialSkillsBonus()` function from `overallCalculator.ts`.
- **Repo Hygiene (`Phase 7`)**: Removed legacy `.eslintrc.json` (superseded by flat `eslint.config.mjs`) and untracked `.agents/` / `.zcode/` directories in `.gitignore`.
- **Documentation Alignment (`Phase 8`)**: Updated `README.md` frontend framework stack specifications.
