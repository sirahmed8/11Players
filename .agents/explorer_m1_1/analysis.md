# Milestone 1: Next.js Baseline Setup Analysis & Strategy

## 1. Executive Summary
This document presents the complete architectural analysis and setup strategy for **Hagoozat Elite** (Milestone 1). The target is a highly-optimized, localized (Arabic/English), and themed (Light/Dark) football community and matchmaking web application using Next.js 14+ (App Router), TypeScript, Tailwind CSS, ESLint, Framer Motion, and Lucide React. 

Since the workspace is currently empty (except for metadata files), this plan lays down the exact configuration files, folder structure, dependency trees, and implementation templates to guide the implementer agent in setting up the project baseline safely and cleanly.

---

## 2. Workspace Observations
- **Workspace Path**: `d:\11Players`
- **Initial State**: 
  - `list_dir` and `find_by_name` verify that the project root is clean.
  - The only existing files are `PROJECT.md` (defining architecture, specs, schema, and API contracts) and `ORIGINAL_REQUEST.md`.
  - There is no `package.json`, `tsconfig.json`, or directory structure.
- **Architectural Constraints**:
  - Must use Next.js 14+ App Router.
  - Must support Arabic (AR, default, RTL) and English (EN, LTR).
  - Must support Dark/Light modes synced natively via `localStorage` and `class` strategy in Tailwind.
  - Read-only constraint: Explorer agent does not edit or create code files outside `.agents/`.

---

## 3. Technology Stack & Baseline Dependencies

We split dependencies into **Core Baseline** (Milestone 1) and **Extended Support** (Milestones 2–6) to keep the initial setup lightweight while planning ahead.

### 3.1. Core Baseline (Milestone 1)
These must be added to `package.json` immediately to support next.js, styling, icons, and animations.

| Package | Version | Type | Purpose |
|---------|---------|------|---------|
| `next` | `^14.2.4` | Dependency | Next.js Core Framework (App Router) |
| `react` | `^18.3.1` | Dependency | UI library |
| `react-dom` | `^18.3.1` | Dependency | DOM renderer |
| `framer-motion` | `^11.2.10` | Dependency | Fluid animations & transitions for onboarding wizard / cards |
| `lucide-react` | `^0.395.0` | Dependency | Modern icons (pitch, sliders, user dashboard) |
| `clsx` | `^2.1.1` | Dependency | Conditionally joining classNames (crucial for theme / RTL) |
| `tailwind-merge` | `^2.3.0` | Dependency | Merging conflicting Tailwind utility classes |
| `typescript` | `^5.4.5` | DevDependency | Strong typing |
| `@types/node` | `^20.14.2` | DevDependency | Node types for Next.js configuration |
| `@types/react` | `^18.3.3` | DevDependency | React typings |
| `@types/react-dom`| `^18.3.0` | DevDependency | React-DOM typings |
| `postcss` | `^8.4.38` | DevDependency | CSS processing |
| `tailwindcss` | `^3.4.4` | DevDependency | Utility-first styling framework |
| `autoprefixer` | `^10.4.19` | DevDependency | Vendor prefixing for CSS properties |
| `eslint` | `^8.57.0` | DevDependency | Linting utility |
| `eslint-config-next`| `14.2.4` | DevDependency | ESLint rules tailored for Next.js |

### 3.2. Extended Support (Milestones 2–6)
*These should be added later by subsequent agents as needed, but are documented here for complete planning visibility:*
- **Firebase**: `firebase ^10.12.2` (Real-time Firestore sync, Auth, Cloud Storage)
- **Client-Side BG Removal**: `@imgly/background-removal ^1.5.5` (Local WASM-based subject extraction)
- **PDF Generation**: `jspdf ^2.5.1` and `html2canvas ^1.4.1` (With `@types/html2canvas` in devDependencies)
- **Cloudinary Integration**: `next-cloudinary ^6.6.2` (Or direct API queries to handle processed PNGs)

---

## 4. Baseline Configuration Designs

Below are the optimized configurations proposed for Hagoozat Elite. 

### 4.1. TypeScript (`tsconfig.json`)
- Set target to `es2022`.
- Enable strict mode (`strict: true`).
- Path aliases: `@/*` pointing to `src/*` for cleaner imports.
- Configure standard Next.js plugins and options.

### 4.2. Tailwind (`tailwind.config.ts`)
- Use the modern TypeScript configuration syntax.
- Configure `darkMode: "class"` to toggle light/dark via setting the `dark` class on the `<html>` root.
- Define custom color extensions (e.g., soccer field greens, dark theme cards) to match high-fidelity presentation requirements.
- Add RTL supporting utilities if required, though Tailwind 3+ supports standard `rtl:` and `ltr:` variants out of the box.

### 4.3. Next.js Config (`next.config.mjs`)
- Standard config with support for external asset domains (e.g., Cloudinary, Google User Profiles).
- Optional headers/configurations to allow WebAssembly (WASM) headers (Cross-Origin-Opener-Policy & Cross-Origin-Embedder-Policy) which might be needed for `@imgly/background-removal`.

---

## 5. Architectural Components: Theme & Language

### 5.1. Localization System (English & Modern Standard Arabic)
1. **Arabic Default**: The application must default to Arabic (MSA, no colloquialisms), rendering in Right-to-Left (RTL) mode.
2. **Context-Based Translation**: To avoid complex file routing setups while keeping bundle size negligible, we introduce a custom `LocaleProvider` which exports:
   - `locale`: `'ar' | 'en'`
   - `dir`: `'rtl' | 'ltr'`
   - `t(key: string)`: Translation helper mapping JSON-based dictionaries.
3. **RTL Switching**: Switching locale dynamically changes the `lang` and `dir` attributes on the root `<html>` element.

### 5.2. Theme Synchronization (Light & Dark)
1. **Tailwind Class Strategy**: Selecting theme sets the class `dark` or `light` on `document.documentElement`.
2. **Syncing & Persistence**: A light `ThemeProvider` syncs theme state, listens to system preferences (optional fallback), and reads/writes to `localStorage`.
3. **Preventing Flash**: To prevent light-theme flash on initial page load when loading from SSR, we inject a short blocking script in the document `<head>`.

---

## 6. Proposed Code & Configuration Drafts

The following scripts and structures are ready to be created by the Implementer Agent.

### 6.1. File: `package.json`
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

### 6.2. File: `tsconfig.json`
```json
{
  "compilerOptions": {
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

### 6.3. File: `tailwind.config.ts`
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
        // Sports/Soccer pitch branding
        pitch: {
          light: '#22c55e',
          dark: '#15803d',
          deep: '#14532d',
          boundary: '#ffffff'
        },
        card: {
          light: '#ffffff',
          dark: '#1e293b', // slate-800
        },
        bg: {
          light: '#f8fafc', // slate-50
          dark: '#0f172a',  // slate-900
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
```

### 6.4. File: `next.config.mjs`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google User Profile Images
      }
    ],
  },
  // Ensure custom headers are configured to support WASM background-removal multithreading if needed
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### 6.5. File: `postcss.config.js`
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 6.6. File: `src/components/LocaleProvider.tsx`
```tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Locale = "en" | "ar";
type Direction = "ltr" | "rtl";

interface LocaleContextProps {
  locale: Locale;
  direction: Direction;
  toggleLocale: () => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    welcome: "Welcome to Hagoozat Elite",
    tagline: "Gamified Football Matchmaking & Community Management",
    cta_login: "Login with Google",
    privacy_banner: "We use cookies to enhance your matchmaking balance accuracy.",
    accept: "Accept",
    profile: "Player Profile",
    admin: "Admin Console",
    onboarding: "Player Onboarding",
  },
  ar: {
    welcome: "مرحباً بك في حجزات إيليت",
    tagline: "تنظيم مجتمعي متكامل وتشكيل متوازن ومحسّن لفرق كرة القدم",
    cta_login: "تسجيل الدخول بواسطة جوجل",
    privacy_banner: "نحن نستخدم ملفات تعريف الارتباط لتحسين دقة موازنة تشكيل الفرق.",
    accept: "موافق",
    profile: "ملف اللاعب",
    admin: "لوحة التحكم للمشرفين",
    onboarding: "تسجيل اللاعب وتحديد البيانات",
  },
};

const LocaleContext = createContext<LocaleContextProps | undefined>(undefined);

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<Locale>("ar"); // Default language is Arabic (MSA)
  const [direction, setDirection] = useState<Direction>("rtl");

  useEffect(() => {
    const savedLocale = localStorage.getItem("locale") as Locale;
    if (savedLocale) {
      setLocale(savedLocale);
      setDirection(savedLocale === "ar" ? "rtl" : "ltr");
      document.documentElement.lang = savedLocale;
      document.documentElement.dir = savedLocale === "ar" ? "rtl" : "ltr";
    }
  }, []);

  const toggleLocale = () => {
    const nextLocale = locale === "ar" ? "en" : "ar";
    const nextDir = nextLocale === "ar" ? "rtl" : "ltr";
    setLocale(nextLocale);
    setDirection(nextDir);
    localStorage.setItem("locale", nextLocale);
    document.documentElement.lang = nextLocale;
    document.documentElement.dir = nextDir;
  };

  const t = (key: string) => {
    return (translations[locale] as any)[key] || key;
  };

  return (
    <LocaleContext.Provider value={{ locale, direction, toggleLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
};
```

### 6.7. File: `src/components/ThemeProvider.tsx`
```tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "light" | "dark";

interface ThemeContextProps {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>("dark"); // Default dark themed soccer pitch feel

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(savedTheme);
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
```

### 6.8. File: `src/app/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #f8fafc;
  --foreground: #0f172a;
}

.dark {
  --background: #0f172a;
  --foreground: #f8fafc;
}

body {
  background-color: var(--background);
  color: var(--foreground);
  transition: background-color 0.3s ease, color 0.3s ease;
  font-family: Arial, Helvetica, sans-serif;
  margin: 0;
  padding: 0;
  min-height: 100vh;
}

/* Custom Soccer Pitch Elements / Lines */
.pitch-bg {
  position: relative;
  background-color: #15803d;
  background-image: repeating-linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05),
    rgba(255, 255, 255, 0.05) 40px,
    transparent 40px,
    transparent 80px
  );
}
```

### 6.9. File: `src/app/layout.tsx`
```tsx
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LocaleProvider } from "@/components/LocaleProvider";

export const metadata: Metadata = {
  title: "Hagoozat Elite - Football Matchmaking & Community",
  description: "Highly balanced matchmaking system for amateur players",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Defaulting to Arabic (ar) / Right-to-Left (rtl) as per specs
    <html lang="ar" dir="rtl" className="dark">
      <head>
        {/* Anti-flash Script for SSR Theme Stability */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme') || 'dark';
                  document.documentElement.className = savedTheme;
                  const savedLocale = localStorage.getItem('locale') || 'ar';
                  document.documentElement.lang = savedLocale;
                  document.documentElement.dir = savedLocale === 'ar' ? 'rtl' : 'ltr';
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <LocaleProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
```

### 6.10. File: `src/app/page.tsx`
```tsx
"use client";

import { useLocale } from "@/components/LocaleProvider";
import { useTheme } from "@/components/ThemeProvider";
import { motion } from "framer-motion";
import { Sun, Moon, Globe, LogIn } from "lucide-react";

export default function Home() {
  const { locale, toggleLocale, t } = useLocale();
  const { theme, toggleTheme } = useTheme();

  return (
    <main className="min-h-screen flex flex-col justify-between items-center p-6 relative overflow-hidden bg-bg-light dark:bg-bg-dark transition-colors duration-300">
      
      {/* Dynamic Header Controls */}
      <header className="w-full max-w-6xl flex justify-between items-center py-4 z-10">
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
          ⚽ HAGOOZAT ELITE
        </h1>
        <div className="flex gap-2 items-center">
          {/* Language Switcher */}
          <button
            onClick={toggleLocale}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title={locale === "ar" ? "Switch to English" : "تغيير إلى العربية"}
          >
            <Globe className="w-5 h-5" />
          </button>
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Landing Info */}
      <section className="flex-1 flex flex-col items-center justify-center text-center max-w-3xl z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <span className="px-4 py-1.5 rounded-full text-xs font-semibold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {t("onboarding")}
          </span>
          <h2 className="text-4xl md:text-6xl font-black text-slate-800 dark:text-slate-100 leading-tight">
            {t("welcome")}
          </h2>
          <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            {t("tagline")}
          </p>

          <div className="pt-4">
            <button className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95">
              <LogIn className="w-5 h-5" />
              <span>{t("cta_login")}</span>
            </button>
          </div>
        </motion.div>
      </section>

      {/* Footer / Cookie Banner */}
      <footer className="w-full max-w-6xl text-center py-6 text-xs text-slate-500 dark:text-slate-400 z-10 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p>{t("privacy_banner")}</p>
          <button className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-medium rounded-lg text-slate-700 dark:text-slate-300 transition-colors">
            {t("accept")}
          </button>
        </div>
      </footer>
    </main>
  );
}
```

---

## 7. Folder Layout Verification & Structural Advice

Per the target system specifications in `PROJECT.md`, the folders and routing targets are explicitly mapped. For security and compatibility:
1. **Routing Files Extension**: The routing target files (e.g. `app/admin/page.ts`, `app/community/page.ts`, etc.) should be changed from `.ts` to `.tsx` if they render React components. If left as `.ts`, TypeScript compile errors will occur when JSX elements are used.
2. **Path Mapping**: Always use absolute path mapping via the `@/` namespace to avoid visual depth lookup issues (e.g. `../../components`).

---

## 8. Verification Strategy & Commands

After the Implementer Agent writes the initial files, they must run the following commands to check correctness:
1. **Dependency Installation**:
   ```bash
   npm install
   ```
2. **ESLint Rules Validation**:
   ```bash
   npm run lint
   ```
3. **Next.js Production Compilation (Ensures TypeScript is 100% compliant)**:
   ```bash
   npm run build
   ```
4. **Locality Checks**: Check that all new files are under `src/app`, `src/components`, and root, and verify that no test/source files are created in `.agents/`.
