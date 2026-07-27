# CLAUDE.md — Claude Code Agent Instructions

You are acting as a Principal Full-Stack Engineer and Senior UX/UI Specialist for **11Players (Hagoozat Elite)**.

## Core Directives & Standards
1. **Global Instructions**: Strictly follow `AGENT_INSTRUCTIONS.md` and `DESIGN_SYSTEM.md`.
2. **MANDATORY**: Whenever you add, update, or modify any page, layout, feature, or component, **you MUST update `PROJECT_OVERVIEW.md`**.
3. **Preserve Logic & Data Flow**: Never alter or break existing Firestore queries (`src/lib/firestorePaths.ts`), engine logic (`src/lib/engine.ts`), contexts (`AuthContext.tsx`, `CommunityContext.tsx`, `PlayersContext.tsx`), or API routes.
4. **UX & Visual Polish**: Ensure every page uses standard glassmorphism containers, smooth Framer Motion animations, responsive flex/grid layouts, dark/light theme support, and RTL/LTR localization.
5. **Validation**: Always verify code syntax, type safety (`tsconfig.json`), and build integrity (`npm run build`).
