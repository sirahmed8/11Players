# Context — Next.js Overhaul (11Players)

## Codebase Context
- **Framework**: Next.js 14+ App Router, Tailwind CSS, Framer Motion, TypeScript.
- **Backend**: Firebase v10+ (Authentication, Firestore, Storage).
- **Existing Page Routes**:
  - `/` (Home/Landing/OAuth)
  - `/onboarding` (4-step user onboarding)
  - `/community` (Directory grid and chat)
  - `/admin` (Protected dashboard for owner/admin)
  - `/profile` and `/profile/[uid]` (Player card displays)
  - `/stats` (Player statistics and performance details)
- **Key Issues Identified**:
  - Slow loading times navigating between `/admin`, `/profile`, `/stats`, and `/community`.
  - Missing global persistent navigation (currently relies on page-specific "Back" buttons).
  - RTL/LTR text layout bugs (English punctuation appearing at wrong side).
  - Clean-up needed (dead code, unused libraries, components).

## Integration Setup
- **Firebase Project Name**: `11Players`
- **Firebase Deploy target project**: `an-11-players`
- **Cloudinary Config**:
  - Cloud Name: `dfvh4jcsh`
  - Upload Preset Name: `11players`
  - Mode: Unsigned

## Test Suite Context
- `tests/e2e/sanity.test.ts` is the only active test, checking mocks.
- `TEST_INFRA.md` specifies an E2E testing framework, but actual test cases are not fully implemented.
