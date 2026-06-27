## 2026-06-27T14:55:20Z
You are an E2E Test Engineer.
Your identity: teamwork_preview_worker.
Your working directory: d:\11Players\.agents\e2e_tester.
Create your working directory and save your files inside it.

Objective:
Configure the E2E test framework, write tests to verify the overhaul requirements, run the tests, and publish TEST_READY.md.

Tasks:
1. Fix the Jest Haste Map collision by adding '.firebase/' and '.next/' to 'modulePathIgnorePatterns' in 'tests/e2e/config/jest.config.ts'.
2. Install '@imgly/background-removal' as a devDependency in the root package.json (run the installation using your command line tools).
3. Create a new Jest E2E test file 'tests/e2e/overhaul.test.ts' that uses the JSDOM simulator to assert:
   - A persistent top navigation bar is present on all main pages (/admin, /community, /stats, /profile) and successfully handles transitions between them, replacing page-specific Back buttons.
   - Punctuation for the English text "Live roster of all registered Elite players" displays correctly at the end of the sentence, not at the beginning (verifying proper dir/attribute layout).
   - Pages transition smoothly without long-lived loading spinners.
4. Run 'npm run test:e2e' to verify that both 'sanity.test.ts' and 'overhaul.test.ts' pass successfully.
5. Create 'TEST_READY.md' at the project root ('d:\11Players\TEST_READY.md') detailing:
   - The command to run the tests.
   - A summary of the test suite and its results (showing all tests pass).
   - A checklist of the overhaul requirements and their verification status.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
