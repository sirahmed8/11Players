# DESIGN_SYSTEM.md — 11Players Unified Design System

> **Design Philosophy**: High-performance, modern football gaming aesthetic inspired by EA Sports FC, PES, and contemporary SaaS platforms. Combines dark pitch emeralds, gold highlights, sleek glassmorphism, responsive visual depth, and smooth Framer Motion micro-interactions.

---

## 1. Color Palette & Tokens

### 1.1 Brand & Accent Colors
```css
--color-primary:        #10b981;  /* Emerald-500: Main interactive & success brand color */
--color-primary-dark:   #059669;  /* Emerald-600: Hover & primary headers */
--color-primary-deeper: #047857;  /* Emerald-700: Dark accents */
--color-primary-glow:   rgba(16, 185, 129, 0.25);

--color-gold:           #f59e0b;  /* Amber-500: OVR 85+ / Elite badges / MVP */
--color-gold-light:     #fbbf24;  /* Amber-400: Highlights */
--color-gold-glow:      rgba(245, 158, 11, 0.30);

--color-accent-blue:    #3b82f6;  /* Blue-500: Info & Team B accents */
--color-accent-purple:  #8b5cf6;  /* Violet-500: Master / Special awards */
--color-accent-rose:    #f43f5e;  /* Rose-500: Team A / Danger states */
```

### 1.2 Surface & Theme Tokens

#### Light Mode (`:root`)
- `--color-bg`: `#f8fafc` (Slate-50)
- `--color-bg-2`: `#f1f5f9` (Slate-100)
- `--color-surface`: `#ffffff` (Pure White)
- `--color-surface-2`: `#f8fafc` (Slate-50)
- `--color-border`: `#e2e8f0` (Slate-200)
- `--color-border-2`: `#cbd5e1` (Slate-300)
- `--color-text`: `#0f172a` (Slate-900)
- `--color-text-muted`: `#64748b` (Slate-500)

#### Dark Mode (`.dark`)
- `--color-bg`: `#020617` (Slate-950)
- `--color-bg-2`: `#0f172a` (Slate-900)
- `--color-surface`: `#0f172a` (Slate-900)
- `--color-surface-2`: `#1e293b` (Slate-800)
- `--color-border`: `#1e293b` (Slate-800)
- `--color-border-2`: `#334155` (Slate-700)
- `--color-text`: `#f8fafc` (Slate-50)
- `--color-text-muted`: `#94a3b8` (Slate-400)

---

## 2. Glassmorphism & Blur Tokens

```css
/* Glass Card (Default component container) */
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px) saturate(200%);
  -webkit-backdrop-filter: blur(20px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: var(--shadow-lg);
}

.dark .glass-card {
  background: rgba(15, 23, 42, 0.75);
  border-color: rgba(255, 255, 255, 0.07);
}

/* Glass Modal / Floating Overlay */
.glass-surface {
  background: rgba(248, 250, 252, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-border);
}

.dark .glass-surface {
  background: rgba(30, 41, 59, 0.8);
  border-color: var(--color-border);
}
```

---

## 3. Typography Scale & Fonts
- **Primary Font**: `Inter`, system-ui, -apple-system, sans-serif
- **Heading 1 (`.section-title`)**: `font-weight: 900`, `font-size: clamp(1.75rem, 4vw, 2.5rem)`, `letter-spacing: -0.02em`
- **Subtitles (`.section-subtitle`)**: `font-size: 1.05rem`, `color: var(--color-text-muted)`
- **Card Titles**: `font-weight: 700`, `font-size: 1.125rem`
- **Stat Values (`.stat-value`)**: `font-weight: 900`, `font-size: clamp(2rem, 5vw, 3.5rem)`, `letter-spacing: -0.03em`

---

## 4. Spacing, Radius & Shadows

### Border Radii
- `--radius-sm`: `8px`
- `--radius-md`: `12px`
- `--radius-lg`: `16px`
- `--radius-xl`: `20px`
- `--radius-2xl`: `24px`
- `--radius-full`: `9999px`

### Shadow Scale
- `--shadow-sm`: `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)`
- `--shadow-md`: `0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)`
- `--shadow-lg`: `0 10px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)`
- `--shadow-xl`: `0 20px 60px rgba(0,0,0,0.16), 0 8px 24px rgba(0,0,0,0.08)`
- `--shadow-glow-primary`: `0 0 30px rgba(16,185,129,0.25)`
- `--shadow-glow-gold`: `0 0 30px rgba(245,158,11,0.30)`

---

## 5. Animation Presets & Framer Motion Variants

### 5.1 CSS Keyframes & Classes
- `.animate-fade-up`: `fadeSlideUp 0.5s ease both`
- `.animate-scale-in`: `scaleIn 0.3s ease both`
- `.animate-pulse-glow`: `pulseGlow 2s ease-in-out infinite`
- `.animate-float`: `float 3s ease-in-out infinite`

### 5.2 Framer Motion Configurations
```typescript
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.25, ease: "easeOut" }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08
    }
  }
};
```

---

## 6. Standardized UI Components

1. **Buttons (`.btn`)**:
   - `.btn-primary`: Emerald-to-teal gradient with shadow-glow and hover translation.
   - `.btn-ghost`: Transparent background with border-slate-700/20 and hover fill.
   - `.btn-danger`: Red gradient for destructive actions.
2. **Inputs (`.input`)**:
   - Slate-900 background in dark mode, crisp border-slate-800, emerald focus ring.
3. **Badges (`.badge`)**:
   - Subtly tinted background pill with matching border and bold uppercase font.
4. **Cards (`.card`, `.glass-card`)**:
   - Soft rounded corners (`radius-xl`), backdrop filter, hover elevation.
