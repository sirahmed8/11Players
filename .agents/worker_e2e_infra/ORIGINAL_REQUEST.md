## 2026-06-26T11:30:00Z
You are a Worker for the E2E Testing Track of Hagoozat Elite.
Your objective is to implement the E2E test infrastructure (runner, mocks, and helpers) based on d:\11Players\TEST_INFRA.md and d:\11Players\.agents\sub_orch_e2e\explorer_report.md.

Specifically:
1. Modify d:\11Players\package.json to add:
   - `jest`, `ts-jest`, `@types/jest`, `ts-node`, `jsdom`, `@types/jsdom`, `cross-env` to `devDependencies`.
   - Add script `"test:e2e": "jest --config tests/e2e/config/jest.config.ts"`.
   - Run the package installation command to install these dependencies and verify they install correctly.
2. Create d:\11Players\tests\e2e\config\jest.config.ts with:
   - Configuration for running tests in JSDOM environment.
   - ts-jest preset.
   - Setup files mapping.
3. Create the mock files under d:\11Players\tests\e2e\mocks\:
   - firebase.ts: Mock implementation of Firebase v10 SDK. Must mock initializeApp, getAuth (with signInWithPopup, onAuthStateChanged, signOut), getFirestore (with collection, doc, addDoc, updateDoc, onSnapshot, query, where, limit, orderBy), and getStorage. Implement a fully functioning in-memory data store for Firestore so queries, snapshots, updates, and inserts work dynamically.
   - cloudinary.ts: Mock Cloudinary upload API for unsigned uploads ('11Players' preset).
   - bg-removal.ts: Mock @imgly/background-removal returning transparent base64 pixel data.
   - jspdf.ts: Mock jspdf and html2canvas.
4. Create helper files under d:\11Players\tests\e2e\helpers\:
   - test-context.ts: Set up the environment, bind mocks to global/window, and provide helper to reset the in-memory MockFirebase database.
   - dom-simulator.ts: Simulators for user actions, form fills, multi-language/theme state validation, and clicking interactive SVG zones on the pitch picker.
5. Create a simple test file tests/e2e/sanity.test.ts to verify the infrastructure runs successfully and all mocks resolve correctly. Run the test suite via `npm run test:e2e` to verify.
6. Write a completion report to d:\11Players\.agents\sub_orch_e2e\worker_infra_report.md detailing the files created and compilation/run verification.
