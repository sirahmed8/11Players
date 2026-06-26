# Scope: Milestone 1 - Project Baseline Setup

## Architecture & Layout
Milestone 1 establishes the baseline for the Hagoozat Elite project.
The directory structure will be created under `d:/11Players/`.
Key packages to configure:
- Next.js 14+ (App Router)
- React, React-DOM
- Tailwind CSS, PostCSS, Autoprefixer
- TypeScript
- ESLint
- Framer Motion
- Lucide React (for icons)

Key files to create/configure:
- `package.json`
- `tsconfig.json`
- `tailwind.config.ts`
- `postcss.config.js`
- `next.config.mjs`
- `eslint.config.mjs` or `.eslintrc.json`
- `src/app/layout.tsx` (Root layout, Theme and Language Context providers/hooks)
- `src/app/page.tsx` (Landing page / Welcome view with multilingual English/Arabic support, Dark/Light modes)
- `src/app/admin/page.tsx` (Admin dashboard placeholder)
- `src/app/community/page.tsx` (Live directory & chat placeholder)
- `src/app/onboarding/page.tsx` (Onboarding wizard placeholder)
- `src/types/index.ts` (Core database schema & system type definitions)
- `src/lib/firebase.ts` (Firebase setup placeholder)

## Milestones
| # | Step Name | Scope | Dependencies | Status |
|---|-----------|-------|--------------|--------|
| 1 | M1.1: Exploration & Planning | Inspect workspace, verify Node.js environment, outline file modifications/creations. | None | PLANNED |
| 2 | M1.2: Package Installation & Configuration | Initialize package.json, install dependencies, set up Next.js config, Tailwind, ESLint, TypeScript. | M1.1 | PLANNED |
| 3 | M1.3: Core TypeScript Definitions | Create `src/types/index.ts` containing the specified data schemas. | M1.2 | PLANNED |
| 4 | M1.4: Base Application Layout & Contexts | Implement theme provider (Dark/Light synced to localStorage) and Language context (EN/AR). | M1.3 | PLANNED |
| 5 | M1.5: Page Structures | Create basic page templates for Landing, Onboarding, Community, and Admin. | M1.4 | PLANNED |
| 6 | M1.6: Review & Verification | Run build, check TypeScript errors, ESLint compliance, challenger validations. | M1.5 | PLANNED |
| 7 | M1.7: Integrity Audit | Forensic auditor checks for correctness, cheating, and cleanliness. | M1.6 | PLANNED |

## Interface Contracts & Schemas
Core schemas in `src/types/index.ts` must match the following definitions:
```typescript
export interface PlayerAttributes {
  attackingProwess: number;
  defensiveProwess: number;
  speed: number;
  acceleration: number;
  stamina: number;
  dribbling: number;
  passing: number;
  physicalContact: number;
  shotPower: number;
  goalkeeping: number;
}

export interface PlayerProfile {
  uid: string;
  fullName: string;
  cardName: string;
  dateOfBirth: string;
  calculatedAge: number;
  height: number;
  weight: number;
  preferredFoot: 'Right' | 'Left' | 'Ambidextrous';
  primaryPosition: PESPosition;
  secondaryPosition: PESPosition;
  tertiaryPosition: PESPosition;
  attributes: PlayerAttributes;
  specialSkills: string[];
  photoUrl: string;
  isVerifiedByAdmin: boolean;
  hasWarning: boolean;
  stats: { goals: number; assists: number; mvp: number; matchesPlayed: number; };
}

export type PESPosition = 'GK' | 'CB' | 'LB' | 'RB' | 'DMF' | 'CMF' | 'AMF' | 'LMF' | 'RMF' | 'LWF' | 'RWF' | 'SS' | 'CF';
```
