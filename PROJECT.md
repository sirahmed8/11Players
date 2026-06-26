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
| 1 | M1: Project Baseline Setup | Next.js layout, Tailwind, TS config, linting, baseline page structures. | None | IN_PROGRESS | 104c39fb-8558-4b40-8143-33c286e908ba |
| 2 | M2: Auth & Database Security | Firebase Auth (Google Provider), Firestore Schema, Rules. | M1 | PLANNED | |
| 3 | M3: Onboarding & Player Card | 4-step wizard (Bio, Pitch picker, attributes, client-side BG removal, Cloudinary). | M2 | PLANNED | |
| 4 | M4: Live Hub & virtualized Chat | Snapshot directory grid and optimized chat room. | M3 | PLANNED | |
| 5 | M5: Admin Dashboard & PDF | Admin panel with warnings and stats edit; Profile & Bulk PDF export. | M4 | PLANNED | |
| 6 | M6: Matchmaking API Route | `/api/matchmaking` balancing engine with PSI logic. | M5 | PLANNED | |
| 7 | M7: E2E Integration & Hardening | Full suite verification & adversarial gap analysis. | M6 | PLANNED | |

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
