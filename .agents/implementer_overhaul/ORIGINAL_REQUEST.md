## 2026-06-27T15:01:43Z
<USER_REQUEST>
You are a Full-Stack Engineer and Optimizer.
Your identity: teamwork_preview_worker.
Your working directory: d:\11Players\.agents\implementer_overhaul.
Create your working directory and save your files inside it.

Objective:
Implement the performance optimizations, persistent navigation, RTL/LTR layout fixes, and codebase cleanup according to the project specifications.

Tasks:
1. Performance Optimization (R1):
   - Implement a shared 'PlayersContext' and 'PlayersProvider' in a new file 'src/contexts/PlayersContext.tsx' that subscribes to the Firestore 'players' collection once on mount via 'onSnapshot'.
   - Wrap the application's root layout 'src/app/layout.tsx' with the new 'PlayersProvider'.
   - Refactor 'src/app/admin/page.tsx', 'src/app/community/page.tsx', and 'src/app/stats/page.tsx' to consume cached player data and loading status from 'PlayersContext' instead of initializing local page-level 'onSnapshot' listeners.
   - Refactor 'src/app/profile/page.tsx' (or the profile content renderer) to either use the cached profile from the PlayersContext or run a clean, direct subscription without redundant duplicate 'getDoc' calls on mount.
   - Fix the authentication loading race condition in 'src/contexts/AuthContext.tsx'. Ensure global auth 'loading' is only set to 'false' AFTER 'checkAdminStatus' resolves.

2. Persistent Navigation Bar (R2):
   - Verify that 'src/components/Navbar.tsx' contains a fully responsive, styled top navigation header with tabs linking to main pages: Community (/community), Stats (/stats), Profile (/profile), and Admin (/admin, visible only for admins).
   - Ensure the 'Navbar' is rendered at the top of '/admin', '/community', '/stats', and '/profile' pages.
   - Remove any custom page-specific "Back" buttons or arrows.

3. RTL/LTR Text Direction Fixes (R3):
   - Locate hardcoded English strings with trailing punctuation (such as periods) and wrap them with explicit 'dir="ltr"' and appropriate CSS alignment (e.g., 'text-start') to prevent punctuation alignment bugs in Arabic RTL context. This applies to:
     - 'Live roster of all registered Elite players.' inside 'src/app/community/page.tsx'.
     - 'Manage players, update stats, and run matchmaking.' inside 'src/app/admin/page.tsx'.
     - 'The best of the best in 11Players.' inside 'src/app/stats/page.tsx'.

4. Codebase Cleanup and Refactoring (R4):
   - Review package.json dependencies and clean up unused packages ('clsx', 'tailwind-merge', '@emotion/is-prop-valid').
   - Refactor the matchmaking call in 'src/app/community/page.tsx'. You can either implement the Next.js API route '/api/matchmaking' (as a simple POST handler in 'src/app/api/matchmaking/route.ts' that imports and runs 'balanceTeams(players)') or update the frontend to run 'balanceTeams(players)' directly on the client, avoiding the 404 fetch error.
   
5. Compile and Test:
   - Run 'npm run test:e2e' to verify all test suites (including sanity and overhaul tests) pass successfully.
   - Run 'npm run build' to verify that the application compiles without any TypeScript or Next.js build errors.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
</USER_REQUEST>
