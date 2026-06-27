# Original User Request

## Initial Request — 2026-06-26T14:25:36+03:00

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

Build "Hagoozat Elite" - an enterprise-grade, highly-optimized Football Community & Matchmaking Web Application for amateur 11v11 matches.

Working directory: d:/11Players
Integrity mode: development

## Requirements

### R1. Frontend & Onboarding
Develop a Next.js (App Router) frontend with Tailwind CSS and Framer Motion. Include a 4-step onboarding wizard:
1. Bio Data (Name, DOB, Height, Weight).
2. Interactive SVG pitch to select Primary, Secondary, and Tertiary positions.
3. Attribute sliders (1-99) and skills checklist.
4. Client-side background removal using `@imgly/background-removal`, upload to Cloudinary, and render a dynamic Player Card.

### R2. Backend & Live Community
Use Firebase v10+ (Auth, Firestore, Storage). Implement:
- Google OAuth login (differentiating Admins vs Players).
- A public directory grid of player cards that updates in real-time via Firestore `onSnapshot`.
- Real-time community group chat.
- Admin dashboard to override stats, edit attributes, issue warnings, and export PDFs.

### R3. Deterministic Matchmaking Algorithm
Build an optimized `/api/matchmaking` endpoint that:
- Calculates a Positional Suitability Index (PSI) with a 25% penalty for tertiary positions.
- Resolves conflicts by comparing PSI and using a backtracking hierarchy (Primary > Secondary > Tertiary).
- Minimizes the variance of overall rating, speed, stamina, and defense between two teams of 11.

### R4. Adherence to Master Specification
You MUST follow the strict architectural modules, constraints, and TypeScript definitions detailed in the master specification below:

<details>
<summary>Master Specification</summary>

Role: You are a Principal Full-Stack Engineer, UI/UX Architect, and Data Scientist specializing in high-performance Web Applications, Gamified Sports Analytics, and Complex Matchmaking Algorithms.

Project Specification:
You are building an enterprise-grade, highly-optimized Football Community & Matchmaking Web Application called "Hagoozat Elite" for a private GitHub repository setup. The application must be secure, production-ready, highly animated (Framer Motion / Tailwind CSS), multi-lingual (English & Arabic - Modern Standard Arabic as the default language with NO colloquial slang), and supporting Dark/Light modes natively synced with localStorage. The project must handle global error management gracefully with a custom gamified Error Boundary page and run symmetrically on both Firebase and Vercel hosting environments.

Tech Stack Requirements:
- Frontend: Next.js (14+ App Router), TypeScript, Tailwind CSS, Framer Motion.
- Backend & Database: Firebase v10+ (Firestore Live Sync, Auth via Google Provider, Cloud Storage/Hosting).
- Media Management: Cloudinary API for storing processed user images.
- Client-Side Image Processing: Integrate '@imgly/background-removal' via browser WebAssembly (WASM). Process the selected file locally on the client's machine to detach the subject from the background for FREE before uploading a pure transparent PNG to Cloudinary.

### DATABASE SCHEMA & SYSTEM TYPES (TypeScript Definitions)

Implement the following strict data models exactly:

```typescript
export interface PlayerAttributes {
  attackingProwess: number; // 1-99
  defensiveProwess: number; // 1-99
  speed: number;            // 1-99
  acceleration: number;     // 1-99
  stamina: number;          // 1-99
  dribbling: number;        // 1-99
  passing: number;          // 1-99
  physicalContact: number;  // 1-99
  shotPower: number;        // 1-99
  goalkeeping: number;      // 1-99
}

export interface PlayerProfile {
  uid: string;
  fullName: string;
  cardName: string;
  dateOfBirth: string; // YYYY-MM-DD
  calculatedAge: number;
  height: number; // cm
  weight: number; // kg
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

### CORE ARCHITECTURAL MODULES

1. Landing, Authentication & Compliance (Welcome Screen):
   - Professional landing page containing Cookie Consent, Privacy Policy, and Terms of Service banners explaining how data coordinates an enhanced matchmaking experience.
   - Google OAuth integration. Upon successful auth, cross-check the user's UID/Email against a secure 'admins' collection to designate the Owner/Admin status.

2. Onboarding & Player Registration Wizard Flow:
   - Step 1 (Bio Data): Input fields for Full Name, Card Name, Height (cm), Weight (kg), Preferred Foot, and DOB. Automatically compute the exact age instantly on the client side upon date entry.
   - Step 2 (Visual Pitch Picker): An interactive SVG/HTML5 canvas layout representing a tactical football field. Map click zones directly to PESPosition types. Users click to assign Primary, Secondary, and Tertiary positions sequentially. Highlight selections with distinct hierarchical colors.
   - Step 3 (Attributes & Skills): Standardized HTML5 sliders mapped to PlayerAttributes (1-99). Display a prominent warning banner: "Warning: Realistic attribute entry will trigger an automated profile review and a forced re-evaluation flag by the Administrator." Below the sliders, provide a multi-select grid combining technical, physical, and tactical skills from FIFA/PES (e.g., One-touch Pass, Step On Skill, Interception, Pinpoint Crossing, Acrobatic Clearance, Speed Merchant) complete with brief hover tooltips.
   - Step 4 (Card Generation & Upload): Execute client-side background removal using '@imgly/background-removal'. Upload the output transparent file directly to Cloudinary. Instantly render a high-fidelity dynamic CSS-grid based Player Card replicating FIFA/PES presentation aesthetics, showing the transparent image, card name, computed overall rating, and positional specialties.

3. Live Community Hub & Real-time Profile Directory:
   - Public Directory: A virtualized scrolling grid fetching all active player cards using a Firebase 'onSnapshot' listener. Any updates to player profiles, stats, or admin warning states must render live across all active user views instantly without page refreshes.
   - Community Group Chat: A real-time chat room built within the hub, utilizing sub-collections in Firestore with message batching and text virtualization for optimal rendering performance.

4. Admin Dashboard (Owner Exclusive Privileges):
   - Protected via secure backend Firestore Security Rules allowing write privileges only to the verified Owner.
   - Features: Table view of all players, capability to override stats (Goals, Assists, MVP), manually adjust attributes, or toggle 'hasWarning: true' (which prompts a modal forcing the targeted user to re-submit their values upon their next login).
   - Document PDF Engine (using jspdf / html2canvas):
     * Profile PDF: Generates a highly stylized single-page profile resume sheet (accessible by that specific player or the Admin).
     * Master Bulk PDF: A single-click Admin option executing a map-reduce script over the entire player collection to export a clean, multi-page tabular data summary of all registered players, metrics, and tactical ratings.

5. THE DETERMINISTIC MATCHMAKING ALGORITHM (`/api/matchmaking`)
Implement a highly optimized matchmaking pipeline based on the following constraint logic:
   - Positional Suitability Index ($PSI$): For any selected position $P$, calculate $PSI = \sum (Weight_i \times Attribute_i)$. For example, a Center Forward (CF) weight map prioritizes Attacking Prowess, Speed, Shot Power, and Height. Apply a fixed 25% rating deduction penalty ($Attribute \times 0.75$) to all metrics if a player is forced into their Tertiary position. Physical stats (Height/Weight ratios) must dynamically impact physical attributes like Speed and Strength.
</details>

## Acceptance Criteria

### Onboarding & UI
- [ ] Users can log in via Google OAuth.
- [ ] The 4-step onboarding wizard functions correctly without errors.
- [ ] Uploaded images have backgrounds removed client-side before Cloudinary upload.
- [ ] The app supports both Arabic (RTL) and English (LTR).

### Live Community & Admin
- [ ] Player attributes updated by an Admin reflect instantly on the public directory for all connected clients.
- [ ] Admin dashboard is restricted to authorized UIDs.
- [ ] Admin can generate a PDF of all registered players.

### Matchmaking Engine
- [ ] The `/api/matchmaking` endpoint returns two balanced teams of 11.
- [ ] Each team has exactly 1 Goalkeeper (GK).
- [ ] The calculated average overall rating of Team A and Team B is within a 5% variance.
- [ ] Conflict resolution prioritizes players with a higher PSI for a contested position.

## Follow-up — 2026-06-26T11:27:50Z

The user clarified the following details for the project configuration:
1. Firebase Project Name: '11Players'
2. Local Repository Name: '11Players' (matches the working directory d:/11Players)
3. Cloudinary: The user is currently setting up the unsigned upload preset based on instructions the parent is providing them. We will use this for client-side uploads.

## Follow-up — 2026-06-26T11:29:55Z

The user has provided the Cloudinary configuration details for the frontend integration:
- Upload Preset Name: `11players`
- Mode: Unsigned

## Follow-up — 2026-06-26T11:31:00Z

The user has provided the final Cloudinary configuration details:
- Cloud Name: `dfvh4jcsh`
- Upload Preset Name: `11players`
- Mode: Unsigned

## Follow-up — 2026-06-27T14:50:52Z

# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

An extensive overhaul of the "11Players" Next.js application focusing on performance optimizations, persistent navigation, RTL/LTR layout fixes, and a comprehensive codebase cleanup.

Working directory: d:\11Players
Integrity mode: development

## Requirements

### R1. Performance Optimization
Investigate and resolve the slow loading times when navigating between the top-level pages (`/admin`, `/profile`, `/stats`, `/community`). 

### R2. Persistent Navigation Bar
Replace the current page-specific "Back" buttons with a persistent top navigation bar (tabs) that remains visible and accessible across all main pages.

### R3. LTR/RTL Text Direction Fixes
Fix the text direction issue where English text in an RTL context displays the period at the beginning of the sentence (e.g., ".Live roster of all registered Elite players" -> "Live roster of all registered Elite players."). Ensure proper `dir` attributes are applied based on language.

### R4. Codebase Cleanup and Refactoring
Conduct a deep architectural review to remove unused libraries, dead code, and duplicate files. Refactor the codebase into a clean, maintainable architecture. You have full freedom to completely rewrite complex React components and introduce new libraries (like Zustand, Framer Motion, etc.) if it results in the best possible application.

### R5. Deployment
Ensure the application builds successfully and deploy the final result to Firebase.

## Acceptance Criteria

### Performance & Navigation
- [ ] The browser subagent can navigate between `/admin`, `/profile`, `/stats`, and `/community` without encountering slow loading states.
- [ ] The top navigation bar is present on all main pages, replacing the page-specific "Back" buttons.

### UI & Layout
- [ ] The English text "Live roster of all registered Elite players" correctly displays with the period at the end of the sentence, not the beginning.
- [ ] The UI feels highly polished, professional, and visually excellent.

### Codebase & Deployment
- [ ] The command `npm run build` completes successfully with no critical errors.
- [ ] The application is successfully deployed to production using `firebase deploy --project an-11-players`.
