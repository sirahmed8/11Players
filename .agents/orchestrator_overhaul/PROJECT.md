# Project: Hagoozat Elite Overhaul

## Architecture
Hagoozat Elite is structured as a full-stack Next.js 14+ application integrated with Firebase v10+ (Authentication, Firestore, Storage) and Cloudinary.
This overhaul focuses on performance optimizations, persistent navigation, translation layout alignment, and codebase clean-up.

## Code Layout
```
d:/11Players/
├── .agents/
├── public/                  # Static assets and WASM binaries for background removal
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── matchmaking/
│   │   │   │   └── route.ts # Matchmaking solver API endpoint
│   │   ├── admin/
│   │   │   └── page.tsx     # Admin dashboard view
│   │   ├── community/
│   │   │   └── page.tsx     # Live directory & chat view
│   │   ├── onboarding/
│   │   │   └── page.tsx     # 4-step onboarding wizard
│   │   ├── layout.tsx       # Root layout (Theme & Language Context)
│   │   └── page.tsx         # Welcome / Landing page
│   ├── components/
│   │   ├── OnboardingWizard.tsx
│   │   ├── SVGPitchPicker.tsx
│   │   ├── AttributeSliders.tsx
│   │   ├── BackgroundRemover.tsx
│   │   ├── PlayerCard.tsx
│   │   ├── VirtualChat.tsx
│   │   ├── AdminTable.tsx
│   │   └── ThemeProvider.tsx
│   ├── lib/
│   │   ├── firebase.ts      # Firebase configuration & SDK init
│   │   ├── pdf.ts           # PDF Generation
│   │   └── matchmaker.ts    # Positional Suitability Index & Backtracking solver
│   └── types/
│       └── index.ts         # System-wide type definitions
```

## Milestones
| # | Name | Scope | Dependencies | Status | Conversation ID |
|---|------|-------|--------------|--------|-----------------|
| 1 | M1: Performance Audit & Exploration | Investigate causes of slow loading times between pages, identify dead code/unused libraries. | None | DONE | eb5b2723-57e9-46b2-a29a-0b7830b4df71 |
| 2 | M2: E2E Test Suite Creation | Design and implement E2E tests for navigation, RTL/LTR layout, and page load performance. | M1 | DONE | 01d63205-036c-44c3-9e7b-d1aba0645fd9 |
| 3 | M3: Persistent Navigation & RTL/LTR Fixes | Replace Back buttons with persistent navigation tabs. Fix English punctuation position in Arabic RTL mode. | M2 | DONE | 5c84c8fd-fa5a-4324-ad85-b733fcc191bb |
| 4 | M4: Performance Optimizations & Refactoring | Refactor pages and components to optimize loading transitions. Remove unused libraries and files. | M3 | DONE | 5c84c8fd-fa5a-4324-ad85-b733fcc191bb |
| 5 | M5: E2E Test Suite Verification | Run E2E test suite (Tiers 1-4) and adversarial testing (Tier 5) to verify functionality. | M4 | DONE | 56c62c26-b65a-49ee-8ff0-2f6364a2ca9f |
| 6 | M6: Production Build & Firebase Deployment | Run production builds and deploy the application to Firebase. | M5 | DONE | 129d67e1-50b5-4809-b158-0aef6c6f455e |

## Interface Contracts

### 1. Matchmaking API (`POST /api/matchmaking`)
- **Request Body**:
  ```typescript
  {
    playerIds: string[]; // List of player UIDs to balance (must be exactly 22 for 11v11)
  }
  ```
- **Response Format**:
  ```typescript
  {
    success: boolean;
    teamA: PlayerProfile[];
    teamB: PlayerProfile[];
    metrics: {
      teamAOverall: number;
      teamBOverall: number;
      variance: {
        overall: number; // target < 5%
        speed: number;
        stamina: number;
        defense: number;
      };
    };
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Incorrect number of players, missing goalkeeper on either team, or invalid profiles.
