# Project Context - Hagoozat Elite

## Tech Stack Summary
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Database & Auth**: Firebase v10+ (Authentication, Firestore, Storage)
- **Media**: Cloudinary (Image uploads)
- **Local Processing**: `@imgly/background-removal` (wasm-based background removal)
- **PDF Generation**: `jspdf` & `html2canvas`

## Environment Settings
- **Working Directory**: `d:\11Players`
- **Network Mode**: `CODE_ONLY` (no external requests or HTTP clients to external services)
- **Integrity Mode**: `development`
- **Firebase Project Name**: `11Players`
- **Local Repository Name**: `11Players`
- **Cloudinary Setup**: Cloud Name: `dfvh4jcsh`, unsigned upload preset named `11players` for client-side uploads

## Project Schema & Type Definitions
The data structures for `PlayerProfile`, `PlayerAttributes`, and `PESPosition` are strictly defined in `ORIGINAL_REQUEST.md` and must be adhered to exactly.

## Code Layout Guidelines
We will define a modular directory structure under `d:\11Players` during project setup:
- `/src/app`: Next.js app router pages, layouts, and API routes.
- `/src/components`: Reusable UI components (Onboarding, Directory, Chat, Admin, PlayerCard).
- `/src/lib`: Firebase initialize logic, PDF generation utils, Matchmaking algorithm.
- `/src/types`: TypeScript models and definitions.
- `/src/styles`: Tailwind global styles.
- `/public`: Static assets and WASM binaries for background removal.
