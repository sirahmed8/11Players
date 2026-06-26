# Analysis & Setup Strategy — Next.js 14+ Baseline Setup

This report outlines the analysis and setup strategy for establishing the project baseline (Milestone 1) of the **Hagoozat Elite** full-stack web application.

---

## 1. Project Context & Workspace Observations

- **Workspace Path**: `d:\11Players`
- **Current State**: The repository is empty, containing only:
  - `PROJECT.md` (Defines the project architecture, database schemas, API contracts, and milestone tracking)
  - `ORIGINAL_REQUEST.md` (Task instructions)
  - `.agents/` folder (Agent metadata and workspace)
- **Target Baseline**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, ESLint, Framer Motion, and Lucide React.
- **Constraints**: 
  - Read-only execution for this explorer agent. We will not execute setup commands or write project source code.
  - The project files layout must map to the layout specified in `PROJECT.md`.

---

## 2. Identified Dependencies

The following dependencies are required to set up the baseline and ensure compatibility across Next.js 14, React 18, Tailwind CSS v3, and Framer Motion.

### 2.1. Production Dependencies (`dependencies`)

| Package Name | Version Spec | Purpose |
|--------------|--------------|---------|
| `next` | `^14.2.4` | Core Next.js Framework (App Router enabled). |
| `react` | `^18.3.1` | Core React library. |
| `react-dom` | `^18.3.1` | React Document Object Model bindings. |
| `framer-motion` | `^11.2.10` | Animation library (React 18 compatible). |
| `lucide-react` | `^0.395.0` | SVG icons library for clean UI indicators. |
| `clsx` | `^2.1.1` | Utility for constructing `className` strings conditionally. |
| `tailwind-merge` | `^2.3.0` | Utility to merge Tailwind CSS classes without conflict. |

### 2.2. Development Dependencies (`devDependencies`)

| Package Name | Version Spec | Purpose |
|--------------|--------------|---------|
| `typescript` | `^5.4.5` | Static type checker. |
| `@types/node` | `^20.14.2` | Type definitions for Node.js. |
| `@types/react` | `^18.3.3` | Type definitions for React. |
| `@types/react-dom` | `^18.3.0` | Type definitions for React DOM. |
| `tailwindcss` | `^3.4.4` | Utility-first CSS framework. |
| `postcss` | `^8.4.38` | CSS processor tool. |
| `autoprefixer` | `^10.4.19` | PostCSS plugin to parse CSS and add vendor prefixes. |
| `eslint` | `^8.57.0` | Pluggable linting utility for JS/TS (ESLint 8 chosen for broad Next.js 14 plugin compatibility). |
| `eslint-config-next` | `14.2.4` | Next.js eslint configurations. |

---

## 3. Directory Layout Strategy

To comply with the directory schema specified in `PROJECT.md`, the folders and files should be initialized as follows:

```
d:/11Players/
├── public/
│   └── (static files & WebAssembly binaries for BG removal later)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── matchmaking/
│   │   │       └── route.ts         # Matchmaking solver API endpoint
│   │   ├── admin/
│   │   │   └── page.tsx             # Admin dashboard (corrected from page.ts to page.tsx)
│   │   ├── community/
│   │   │   └── page.tsx             # Live directory & chat (corrected from page.ts to page.tsx)
│   │   ├── onboarding/
│   │   │   └── page.tsx             # Onboarding wizard (corrected from page.ts to page.tsx)
│   │   ├── globals.css              # Global Tailwind CSS imports & base styles
│   │   ├── layout.tsx               # Root layout (Theme & Language Context)
│   │   └── page.tsx                 # Welcome / Landing page
│   ├── components/
│   │   ├── OnboardingWizard.tsx     # Steps 1-4 Wizard
│   │   ├── SVGPitchPicker.tsx       # Pitch position custom picker
│   │   ├── AttributeSliders.tsx     # Player attribute ratings sliders
│   │   ├── BackgroundRemover.tsx    # WASM background remover
│   │   ├── PlayerCard.tsx           # Player Profile card visualizer
│   │   ├── VirtualChat.tsx          # Chat with window virtualization
│   │   ├── AdminTable.tsx           # Admins controls and player details table
│   │   └── ThemeProvider.tsx        # Dark/Light & Language context wrapper
│   ├── lib/
│   │   ├── firebase.ts              # Firebase client SDK init
│   │   ├── pdf.ts                   # PDF export library helper (jspdf/html2canvas)
│   │   └── matchmaker.ts            # Matchmaking solver logic
│   └── types/
│       └── index.ts                 # TS Interfaces & Schemas
```

> **Note on File Extensions**:
> `PROJECT.md` lists `src/app/admin/page.ts`, `src/app/community/page.ts`, and `src/app/onboarding/page.ts`. Because these files will serve as routes that render user interfaces (React Components), they should use the `.tsx` extension to permit JSX/TSX syntax. The matchmaking API route (`src/app/api/matchmaking/route.ts`) remains `.ts` as it returns JSON payloads and contains no markup.

---

## 4. Suggested Configuration File Layouts

Below are the complete, standard configuration files recommended for this workspace to facilitate a smooth Next.js 14 + Tailwind + TS + ESLint baseline execution.

### 4.1. `package.json`

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
    "clsx": "^2.1.1",
    "framer-motion": "^11.2.10",
    "lucide-react": "^0.395.0",
    "next": "^14.2.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.2",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.4",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.4.5"
  }
}
```

### 4.2. `tsconfig.json`

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
    "moduleResolution": "bundler",
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

### 4.3. `tailwind.config.ts`

Using ES6/TS syntax for configuration:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class", // Enables class-based dark mode
  theme: {
    extend: {
      colors: {
        // Extend default color palette for themes
      },
    },
  },
  plugins: [],
};
export default config;
```

### 4.4. `postcss.config.js`

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 4.5. `next.config.mjs`

Using ESM style as default for modern Next.js configurations:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // We can add configuration for WASM and remote images (Cloudinary) in future milestones here
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
```

### 4.6. `.eslintrc.json`

```json
{
  "extends": "next/core-web-vitals"
}
```

---

## 5. Execution & Verification Guide (For Implementer)

The following sequence of commands is recommended to initialize and verify the project baseline:

1. **Initialize Workspace Configuration Files**:
   Create the configuration files in the root folder `d:\11Players\` based on the templates in Section 4.

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Establish Source Directory Structure**:
   Create folders `src`, `src/app`, `src/components`, `src/lib`, `src/types`, and the boilerplate entry points:
   - `src/app/globals.css`:
     ```css
     @tailwind base;
     @tailwind components;
     @tailwind utilities;
     ```
   - `src/app/layout.tsx`:
     ```tsx
     import type { Metadata } from "next";
     import "./globals.css";

     export const metadata: Metadata = {
       title: "Hagoozat Elite",
       description: "Deterministic matchmaking and community hub",
     };

     export default function RootLayout({
       children,
     }: Readonly<{
       children: React.ReactNode;
     }>) {
       return (
         <html lang="en">
           <body>{children}</body>
         </html>
       );
     }
     ```
   - `src/app/page.tsx`:
     ```tsx
     export default function Home() {
       return (
         <main className="flex min-h-screen flex-col items-center justify-center p-24">
           <h1 className="text-4xl font-bold">Hagoozat Elite</h1>
           <p className="mt-4 text-lg text-gray-600">Milestone 1 Baseline Setup Ready.</p>
         </main>
       );
     }
     ```

4. **Verify ESLint Integration**:
   ```bash
   npm run lint
   ```

5. **Verify Typescript Compilation and Static Next Build**:
   ```bash
   npm run build
   ```

6. **Start Dev Server**:
   ```bash
   npm run dev
   ```
