# Project: Hagoozat Elite

## Architecture
Hagoozat Elite is structured as a full-stack Next.js 14+ application integrated with Firebase v10+ (Authentication, Firestore, Storage) and Cloudinary.
- **Frontend Layer**: Next.js App Router, Tailwind CSS, Framer Motion. Handles layout, multilinguality (EN/AR), theme synchronization (Dark/Light via localStorage), client-side background removal via WebAssembly, and PDF generation.
- **Backend & Database Layer**: Firebase Authentication coordinates login via Google Provider. Firestore holds live sync collections for players, admins, and chat. Firebase Cloud Storage or Cloudinary handles processed images.
- **Matchmaking Engine**: Next.js API Route (`/api/matchmaking`) that implements a deterministic team balance solver based on player attributes, positional suitability indexes, and age/physical multipliers.

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
│   │   │   └── page.ts      # Admin dashboard view
│   │   ├── community/
│   │   │   └── page.ts      # Live directory & chat view
│   │   ├── onboarding/
│   │   │   └── page.ts      # 4-step onboarding wizard
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
│   │   ├── pdf.ts           # PDF Generation (jspdf & html2canvas wrapper)
│   │   └── matchmaker.ts    # Positional Suitability Index & Backtracking solver
│   └── types/
│       └── index.ts         # System-wide type definitions & schemas
```

## Milestones
| # | Name | Scope | Dependencies | Status | Conversation ID |
|---|------|-------|--------------|--------|-----------------|
| 1 | M1: Codebase Exploration & Testing Baseline | Verify E2E baseline and map codebase structures. | None | DONE | aedd1092-ccc2-460d-be49-95f783416b17 |
| 2 | M2: UI & Styling Enhancements | Scrollbars, active tab Navbar, light/dark themes, animations, layout centering, load speed. | M1 | PLANNED | |
| 3 | M3: Arabic Localization | Arabic translation for Community, Stats, and Admin pages. | M2 | PLANNED | |
| 4 | M4: Profile & Workflows | Fix Player Not Found, Owner workflow, Normal user approval workflow, Unique username + cooldown. | M3 | PLANNED | |
| 5 | M5: Community Chat Features | Name/Avatar in chat, Reply and React functionality. | M4 | PLANNED | |
| 6 | M6: Matchmaking & Admin Improvements | Owner visibility, 22-player limit, stats/positions/ratings logic. | M5 | PLANNED | |
| 7 | M7: Final Integration, E2E Testing, and Deployment | Complete new E2E tests, final build, and Firebase deployment. | M6 | PLANNED | |

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

### 2. Firestore Schema

#### `/admins/{uid}`
- Owner privilege checklist.

#### `/players/{uid}`
- Holds `PlayerProfile` data matching the master specification.

#### `/chats/{messageId}`
- Community messages virtualized:
  ```typescript
  {
    senderUid: string;
    senderName: string;
    text: string;
    timestamp: FieldValue;
  }
  ```

### 3. PDF Generator Helper
- **`generateProfilePDF(profile: PlayerProfile): Promise<void>`**: Creates a single-page player resume using `jspdf`/`html2canvas`.
- **`generateMasterBulkPDF(profiles: PlayerProfile[]): Promise<void>`**: Compiles all player metrics into a tabular document summary.
