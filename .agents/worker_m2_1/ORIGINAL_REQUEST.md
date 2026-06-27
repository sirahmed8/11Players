## 2026-06-27T15:42:26Z
You are teamwork_preview_worker.
Your working directory is d:\11Players\.agents\worker_m2_1.
Your task is to implement the Milestone 2: UI & Styling Enhancements based on the user's requirements:

1. Hide default HTML scrollbars across the app (you can use CSS to hide scrollbars globally or use scrollbar-none, while preserving the ability to scroll). Check `src/app/globals.css`.
2. Improve light mode styling for Admin and Community pages to make them look cohesive and beautiful, and ensure all loading screens (e.g., auth check loading screen on the welcome page, and profile loading screens) respect the active theme (light/dark).
3. Add an active state highlight to the Navbar (`src/components/Navbar.tsx`) to clearly show which tab is currently selected.
4. Animate the cookie acceptance banner (appear/disappear) on the welcome screen using Framer Motion or custom CSS transitions.
5. Remove the text "تسجيل اللاعب وتحديد البيانات" from the welcome screen and translations (`src/components/ThemeProvider.tsx`).
6. Add an outline focus animation to the Community search box (`src/app/community/page.tsx`) matching the onboarding registration input boxes.
7. Fix layout centering issues: the screen should not center on the chat type box by default on desktop, but on mobile, it should center the type box when the keyboard is open (e.g., using mobile focus event listeners).
8. Ensure all pages load extremely fast for the first time by avoiding unnecessary blocking renders or heavy operations.

Once done, verify that the project builds successfully (`npm run build`) and the test suite passes (`npm run test:e2e`).
Write a detailed handoff report in `d:\11Players\.agents\worker_m2_1\handoff.md` with the files you changed, the exact changes you made, and verification results.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
