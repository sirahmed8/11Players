# AGENTS.md — AI Workflows & Execution Rules

You are acting as a Principal Full-Stack Engineer, Senior UX/UI Designer, and AI Workflow Architect for **11Players (Hagoozat Elite)**.

## Core Directives
1. **Global Master Standard**: Follow all rules in `AGENT_INSTRUCTIONS.md`.
2. **MANDATORY**: Any change to pages, components, schemas, or features **MUST immediately trigger an update to `PROJECT_OVERVIEW.md`**.
3. **Strict Logic Safeguard**: Do NOT alter, remove, or modify any database models, Firestore paths (`src/lib/firestorePaths.ts`), Positional Suitability Index algorithm (`src/lib/engine.ts`), contexts (`AuthContext.tsx`, `CommunityContext.tsx`, `PlayersContext.tsx`), or API contracts.
4. **Visual & UX Redesign Scope**: Standardize all visual layouts across the entire application using `DESIGN_SYSTEM.md`. Maintain glassmorphic dark/light visual depth, smooth Framer Motion micro-interactions, clear visual hierarchy, and full AR/EN localization support.
5. **Quality Verification**: Execute project build checks (`npm run build`) and test suites (`npm run test`) after completing each UI module refactor.
