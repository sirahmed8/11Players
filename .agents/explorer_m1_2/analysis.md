# Milestone 1 Setup Strategy & Dependency Analysis

This document outlines the planning and baseline setup for **Hagoozat Elite**, a Next.js 14+ web application using the App Router, TypeScript, Tailwind CSS, ESLint, Framer Motion, and Lucide React.

---

## 1. Directory Structure Plan

Consistent with `PROJECT.md` and next-generation Next.js structures, we will organize the workspace under `d:/11Players` using the following blueprint:

```text
d:/11Players/
├── .agents/                 # AI Agent metadata (Briefing, logs, progress)
├── public/                  # Static assets and WASM binaries for background removal
├── src/
│   ├── app/                 # Next.js App Router (Layouts, pages, API routes)
│   │   ├── api/
│   │   │   └── matchmaking/
│   │   │       └── route.ts # Matchmaking solver API endpoint (M6)
│   │   ├── admin/
│   │   │   └── page.tsx     # Admin dashboard view (M5)
│   │   ├── community/
│   │   │   └── page.tsx     # Live directory & chat view (M4)
│   │   ├── onboarding/
│   │   │   └── page.tsx     # 4-step onboarding wizard (M3)
│   │   ├── layout.tsx       # Root layout (Theme & Language Context)
│   │   ├── page.tsx         # Welcome / Landing page (with Auth)
│   │   └── globals.css      # Tailwind directives & global styling
│   ├── components/          # Shared and feature-specific React components
│   │   ├── OnboardingWizard.tsx
│   │   ├── SVGPitchPicker.tsx
│   │   ├── AttributeSliders.tsx
│   │   ├── BackgroundRemover.tsx
│   │   ├── PlayerCard.tsx
│   │   ├── VirtualChat.tsx
│   │   ├── AdminTable.tsx
│   │   └── ThemeProvider.tsx
│   ├── lib/                 # Core utilities & third-party initializations
│   │   ├── firebase.ts      # Firebase configuration & SDK init
│   │   ├── pdf.ts           # PDF Generation (jspdf & html2canvas wrapper)
│   │   └── matchmaker.ts    # Matchmaking solver & PSI helper functions
│   └── types/               # System-wide type definitions & schemas
│       └── index.ts         # PlayerProfile, PlayerAttributes, PESPosition
```

---

## 2. Dependency Specification

### Production Dependencies
We pin stable versions compatible with Next.js 14.2 (React 18 ecosystem). We also preemptively include the key Firebase, background removal, and PDF dependencies to prevent version mismatch conflicts in future milestones.

| Package Name | Recommended Version | Purpose |
| :--- | :--- | :--- |
| **`next`** | `^14.2.4` | Framework core supporting App Router |
| **`react`** | `^18.3.1` | UI Library (Next 14 peer dependency) |
| **`react-dom`** | `^18.3.1` | React DOM bindings |
| **`framer-motion`** | `^11.2.10` | High-fidelity page transitions and card animations |
| **`lucide-react`** | `^0.395.0` | Clean vector iconography |
| **`firebase`** | `^10.12.2` | Authentication, Firestore (real-time sync), and Storage |
| **`@imgly/background-removal`**| `^1.4.5` | Client-side WASM background removal |
| **`jspdf`** | `^2.5.1` | Document layout generator for player cards and tables |
| **`html2canvas`** | `^1.4.1` | Captures HTML nodes for rendering into PDF |
| **`clsx`** | `^2.1.1` | Tailwind class concatenation utility |
| **`tailwind-merge`** | `^2.3.0` | Resolves conflicting Tailwind classes dynamically |

### Development Dependencies

| Package Name | Recommended Version | Purpose |
| :--- | :--- | :--- |
| **`typescript`** | `^5.5.2` | Strongly-typed JavaScript compiler |
| **`tailwindcss`** | `^3.4.4` | Utility-first CSS styling framework |
| **`postcss`** | `^8.4.38` | Compiles Tailwind styling directives |
| **`autoprefixer`** | `^10.4.19` | Automatically adds CSS vendor prefixes |
| **`eslint`** | `^8.57.0` | Code quality verification engine (pinned for Next 14 core compat) |
| **`eslint-config-next`** | `^14.2.4` | Next.js lint rules |
| **`@types/node`** | `^20.14.8` | NodeJS type declarations |
| **`@types/react`** | `^18.3.3` | React type declarations |
| **`@types/react-dom`** | `^18.3.0` | React-DOM type declarations |

---

## 3. Configuration Blueprints

### A. `package.json`
```json
{
  "name": "hagoozat-elite",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.2.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "framer-motion": "^11.2.10",
    "lucide-react": "^0.395.0",
    "firebase": "^10.12.2",
    "@imgly/background-removal": "^1.4.5",
    "jspdf": "^2.5.1",
    "html2canvas": "^1.4.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "typescript": "^5.5.2",
    "@types/node": "^20.14.8",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "tailwindcss": "^3.4.4",
    "postcss": "^8.4.38",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.4"
  }
}
```

### B. `tsconfig.json`
Ensures strict TypeScript compilation, enables modern ES features, and maps import paths to `@/*`.
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### C. `tailwind.config.ts`
Includes App Router routes, components, custom themes (football colors), and Dark Mode settings.
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        pitch: {
          green: "#2e7d32",
          darkGreen: "#1b5e20",
          highlight: "#4caf50"
        }
      },
    },
  },
  plugins: [],
};
export default config;
```

### D. `postcss.config.js`
Standard config for pre-processing CSS with tailwindcss and autoprefixer.
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### E. `next.config.mjs`
Configures image domains (Cloudinary) and bypasses client-side webpack resolutions for local file structures.
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
      };
    }
    return config;
  },
};

export default nextConfig;
```

### F. `.eslintrc.json`
Uses recommended rules for Next.js 14 performance and accessibility.
```json
{
  "extends": "next/core-web-vitals"
}
```

---

## 4. Root Routing & Strategy

The following core files should be set up as a baseline in `src/app/` to establish theme synchronization, language direction, and onboarding integration:

### A. Root Layout (`src/app/layout.tsx`)
Must handle theme toggling and support both English (LTR) and Modern Standard Arabic (RTL) natively.
```tsx
import type { Metadata } from 'next';
import './globals.css';
import React from 'react';

export const metadata: Metadata = {
  title: 'Hagoozat Elite',
  description: 'Enterprise football matchmaking and community directory.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className="bg-slate-900 text-white min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
```

### B. Global CSS (`src/app/globals.css`)
Imports Tailwind CSS layers.
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply transition-colors duration-200;
  }
}
```

### C. Landing Page (`src/app/page.tsx`)
Presents the initial greeting, Google authentication gateway, and compliance banners (Cookie Consent, TOS, Privacy Policy).
```tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function WelcomePage() {
  const [cookieConsent, setCookieConsent] = useState(false);

  const handleLogin = () => {
    // Authentication flow entry point (Firebase Google Provider logic)
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-800 rounded-lg p-8 shadow-xl border border-slate-700 text-center"
      >
        <h1 className="text-3xl font-extrabold text-pitch-highlight mb-4">Hagoozat Elite</h1>
        <p className="text-slate-400 mb-8">
          مرحباً بكم في منصة تنظيم المباريات النخبوية. يرجى تسجيل الدخول لبدء رحلتك الكروية.
        </p>

        <button 
          onClick={handleLogin}
          className="w-full bg-pitch-green hover:bg-pitch-highlight transition-all py-3 rounded-md font-bold text-lg"
        >
          تسجيل الدخول عبر Google
        </button>
      </motion.div>

      {/* Cookie Consent Banner */}
      {!cookieConsent && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-950 p-4 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-300">
            تستخدم المنصة ملفات تعريف الارتباط لتحسين تجربة توازن الفرق وإعداد إحصاءات اللاعبين.
          </p>
          <button 
            onClick={() => setCookieConsent(true)}
            className="bg-pitch-green text-xs px-4 py-2 rounded font-semibold hover:bg-pitch-highlight"
          >
            أوافق
          </button>
        </div>
      )}
    </main>
  );
}
```

### D. System Types Configuration (`src/types/index.ts`)
Conforms to the data schema specifications:
```typescript
export type PESPosition = 'GK' | 'CB' | 'LB' | 'RB' | 'DMF' | 'CMF' | 'AMF' | 'LMF' | 'RMF' | 'LWF' | 'RWF' | 'SS' | 'CF';

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
  stats: { 
    goals: number; 
    assists: number; 
    mvp: number; 
    matchesPlayed: number; 
  };
}
```

---

## 5. Verification Method

Once files are generated by the implementer agent in the next step, they must be validated:
1. Run `npm run lint` or `npx eslint src` to confirm formatting compliance.
2. Run `npm run build` to confirm Next.js build compilation and check for type compilation errors.
3. Test layout rendering on both LTR (English) and RTL (Arabic) contexts.
