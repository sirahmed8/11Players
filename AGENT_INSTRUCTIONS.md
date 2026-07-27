# AGENT_INSTRUCTIONS.md — Source of Truth for AI Agents

> **Role & Responsibility**: Any AI Agent (Antigravity, Cursor, Claude Code, OpenAI Codex, GitHub Copilot) working in this repository operates as a Principal Full-Stack Engineer and Senior UX/UI Specialist.

---

## MANDATORY RULE FOR ALL AGENTS
> [!CRITICAL]
> Whenever any AI Agent adds, updates, refactors, or modifies any page, component, API route, state management, or feature in this repository, **IT MUST IMMEDIATELY UPDATE `PROJECT_OVERVIEW.md`** to maintain 100% architectural and documentation synchronicity.

---

## 1. Core Architectural & Preservation Rules
- **ZERO BREAKING CHANGES**: Never alter, remove, or break existing features, database schemas, Firestore paths, API contracts, Server Actions, state management, or core business logic (`src/lib/engine.ts`, `src/lib/firestorePaths.ts`, `AuthContext.tsx`, `CommunityContext.tsx`, `PlayersContext.tsx`).
- **STRICT VISUAL & UX SCOPE**: All modifications must be strictly focused on visual redesign, layout structure, responsive UX, accessibility, micro-interactions, dark/light contrast, and system documentation.
- **FIRESTORE CONSTRAINTS**: Always use path builders from `src/lib/firestorePaths.ts` for all Firestore queries. Never hardcode collection strings.
- **LOCALIZATION INTEGRITY**: Preserve both English and Arabic (RTL/LTR) support across all updated components. Ensure text variables and layout direction function seamlessly.

---

## 2. Component & Design Standards
- **DESIGN SYSTEM DRIVEN**: All visual elements MUST strictly reference `DESIGN_SYSTEM.md` and standard CSS variables in `src/app/globals.css`.
- **REUSABLE COMPONENT PATTERNS**:
  - Cards: Use `.glass-card` or `.card` with standard backdrop blur and border styling.
  - Buttons: Use `.btn-primary`, `.btn-ghost`, `.btn-danger` with active scale micro-interactions (`active:scale-95`).
  - Inputs: Standardized `.input` focus glow ring (`focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20`).
  - Modals: Animated via `framer-motion` (`AnimatePresence`) with blurred backdrop overlay (`bg-slate-950/60 backdrop-blur-md`).
- **ACCESSIBILITY & INTERACTIONS**:
  - Focus outlines via `focus-visible`.
  - ARIA attributes for dynamic interactive triggers.
  - Micro-animations via Framer Motion for entrance (`fadeSlideUp`, `scaleIn`) and state transitions.

---

## 3. Workflow & Modification Protocol
1. **Pre-Execution Inspection**: Inspect existing state hooks, contexts, and backend logic before modifying TSX layouts.
2. **Atomic Upgrades**: Upgrade one module/page at a time, testing layout consistency and verifying zero regression on data flow.
3. **Documentation Sync**: Update `PROJECT_OVERVIEW.md` immediately following changes.
4. **Verification**: Validate Next.js build (`npm run build`) or unit tests (`npm run test`) to confirm zero compilation errors.
