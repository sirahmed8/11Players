# Copilot Instructions — 11Players (Hagoozat Elite)

You are assisting on **11Players (Hagoozat Elite)**, a high-performance Next.js 16 + Firebase football matchmaking & community platform.

## Key Rules
1. **Global Source of Truth**: Adhere to `AGENT_INSTRUCTIONS.md` and `DESIGN_SYSTEM.md`.
2. **MANDATORY DOCUMENTATION SYNC**: Whenever modifying any page, component, or feature, **update `PROJECT_OVERVIEW.md`**.
3. **Preserve Business & Backend Logic**: Keep all Firestore paths (`src/lib/firestorePaths.ts`), engine calculation logic (`src/lib/engine.ts`), contexts, and API contracts intact.
4. **Design System & Styling**: Use standard CSS tokens from `src/app/globals.css`, Tailwind v4 utilities, `.glass-card`, `.btn-primary`, `.input`, and Framer Motion micro-interactions.
5. **Localization**: Maintain support for both English and Arabic (RTL/LTR) interfaces.
