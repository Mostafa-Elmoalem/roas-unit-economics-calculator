---
name: TrueROAS Design System
version: 1.0.0
status: final
updated: 2026-08-16
tokens:
  colors:
    dark:
      bg_app: "#09090b"
      bg_surface: "#18181b"
      bg_surface_subtle: "#121214"
      bg_input: "#09090b"
      bg_hover: "#202024"
      border_default: "#27272a"
      border_subtle: "#1f1f23"
      border_hover: "#3f3f46"
      text_primary: "#f4f4f5"
      text_secondary: "#a1a1aa"
      text_muted: "#71717a"
    light:
      bg_app: "#f8fafc"
      bg_surface: "#ffffff"
      bg_surface_subtle: "#f1f5f9"
      bg_input: "#f8fafc"
      bg_hover: "#f1f5f9"
      border_default: "#e2e8f0"
      border_subtle: "#f1f5f9"
      border_hover: "#cbd5e1"
      text_primary: "#09090b"
      text_secondary: "#52525b"
      text_muted: "#a1a1aa"
    brand:
      profit: "#10b981"
      loss: "#f43f5e"
      warning: "#f59e0b"
      accent: "#6366f1"
      neutral: "#71717a"
  typography:
    latin_sans: "'Plus Jakarta Sans', system-ui, sans-serif"
    arabic_sans: "'Cairo', 'Plus Jakarta Sans', system-ui, sans-serif"
    numbers_mono: "'JetBrains Mono', monospace"
  rounded:
    sm: "0.375rem"
    md: "0.5rem"
    lg: "0.75rem"
    xl: "1rem"
    "2xl": "1.5rem"
    full: "9999px"
  spacing:
    container_max: "80rem"
    header_height: "4rem"
---

# TrueROAS — Visual Design Identity (DESIGN.md)

## 1. Brand & Style
TrueROAS is a modern, high-precision financial calculation platform engineered for performance media buyers, e-commerce brand operators, and growth agencies. The visual identity embodies:
- **Financial Authority & Precision:** Tabular numerals, razor-sharp contrast, zero visual clutter, and data-density without cognitive overwhelm.
- **Modern SaaS Polish:** Subtle glassy backdrops, refined hairline borders (`1px`), tactile hover transitions (`150ms ease`), and focused micro-interactions.
- **Bi-Directional Cultural Harmony:** Native right-to-left (RTL) Arabic typography using **Cairo** paired with **Plus Jakarta Sans** for English and **JetBrains Mono** for numerical values.

---

## 2. Colors & Semantic Palettes

### 2.1 Dark Palette (Primary SaaS Experience)
- **App Background:** `#09090b` (Deep obsidian black)
- **Surface Elevation 1 (Cards):** `#18181b` (Refined zinc dark)
- **Surface Elevation 2 (Sub-panels & Inputs):** `#09090b` / `#121214`
- **Borders & Dividers:** `#27272a` (Hairline high-contrast separation)
- **Hover States:** `#202024`

### 2.2 Light Palette (Clean Commercial Clarity)
- **App Background:** `#f8fafc` (Ultra-light slate)
- **Surface Elevation 1 (Cards):** `#ffffff` (Pure crisp white with shadow-xs)
- **Surface Elevation 2 (Inputs):** `#f8fafc` / `#f1f5f9`
- **Borders & Dividers:** `#e2e8f0` / `#cbd5e1`
- **Hover States:** `#f1f5f9`

### 2.3 Semantic Status & Risk Accents
- **Profit / Positive Margin / Above BE ROAS:** Emerald (`#10b981` / `emerald-500`)
- **Loss / Negative Margin / Danger / Destructive Action:** Rose (`#f43f5e` / `rose-500`)
- **Delivery Risk / Warning / Shipping Cost:** Amber (`#f59e0b` / `amber-500`)
- **Overheads / Fixed Costs / System Information:** Indigo (`#6366f1` / `indigo-500`)

---

## 3. Typography Hierarchy

| Role | Font Family | Size | Weight | Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | Plus Jakarta Sans / Cairo | 1.875rem (30px) | 800 (Bold) | 1.2 | -0.025em |
| **Card Header** | Plus Jakarta Sans / Cairo | 0.875rem (14px) | 600 (Semi-bold)| 1.3 | -0.015em |
| **Hero Metric Numbers** | JetBrains Mono (Tabular) | 3rem (48px) | 900 (Black) | 1.0 | -0.03em |
| **Body & Microcopy** | Plus Jakarta Sans / Cairo | 0.75rem - 0.875rem | 400 - 500 | 1.5 | Normal |
| **Badge Labels** | Plus Jakarta Sans / Cairo | 0.6875rem (11px)| 700 (Bold) | 1.0 | +0.02em |

> **Crucial Rule:** All monetary amounts, ROAS multipliers, percentages, and units MUST utilize `.font-mono-nums` (`font-feature-settings: "tnum" 1, "zero" 1`) to ensure perfect tabular alignment across multi-row tables.

---

## 4. Layout & Spacing
- **Base Grid:** 4px / 8px spacing cadence (`p-2`, `p-4`, `p-6`, `p-8`).
- **Maximum Content Width:** `max-w-7xl` (`1280px`) with fluid edge-padding (`px-4 sm:px-6 lg:px-8`).
- **Header:** Sticky top navigation (`h-16`, `z-30`, `backdrop-blur-md`).
- **Grid Layouts:**
  - Portfolio Dashboard: 4-column KPI overview (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).
  - Detailed Calculator: 2-column asymmetric split (Inputs on the left/top, visual real-time analytics & simulation on the right/bottom).

---

## 5. Elevation & Depth
- **Elevation 0 (Base):** Flat background with zero shadow.
- **Elevation 1 (Cards):** Hairline border (`1px solid var(--border-default)`) + subtle ambient shadow (`box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05)`).
- **Elevation 2 (Dropdowns & Modals):** `z-50`, backdrop-blur overlay (`bg-black/60 dark:bg-black/80`), deep elevation shadow (`shadow-2xl`).
- **Glow Accents:** Soft radial atmospheric glow behind profitable KPIs (`.glow-emerald`) and critical warning cards (`.glow-rose`).

---

## 6. Shapes & Border Radii
- **Full Containers / Cards:** `rounded-2xl` (`1rem` / `16px`) for friendly, contemporary ergonomics.
- **Inputs, Buttons, and Selects:** `rounded-xl` (`0.75rem` / `12px`).
- **Pills, Badges, and Status Tags:** `rounded-full` (`9999px`) or `rounded-lg` (`8px`).
- **Sliders:** Custom rounded thumb with interactive scaling (`transform: scale(1.15)`) on hover.

---

## 7. Component Styling Specifications

### 7.1 Buttons
- **Primary Action (Add Product, Save):** Emerald solid (`bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold`).
- **Secondary Action (Export, Switch View):** Outlined / Subtle Surface (`bg-white dark:bg-[#18181b] border-zinc-200 dark:border-[#27272a] hover:bg-zinc-100 dark:hover:bg-[#27272a]`).
- **Danger Action (Delete):** Rose solid (`bg-rose-600 hover:bg-rose-500 text-white font-bold`).

### 7.2 Inputs & Form Fields
- Surface: `bg-zinc-50 dark:bg-[#09090b]`
- Border: `border-zinc-200 dark:border-[#27272a]` with emerald focus ring (`focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500`).
- Prefix Icon / Currency: Centered absolute positioning with RTL inversion (`left-3 rtl:right-3 rtl:left-auto`).

### 7.3 Sensitivity Matrix Heatmap
- **High Profit (>$10k):** Emerald high-intensity container (`bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300`).
- **Moderate Profit:** Emerald subtle container (`bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400`).
- **Loss / Below Zero:** Rose warning container (`bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400`).
- **Baseline Selection Anchor:** Double ring emerald border (`ring-2 ring-emerald-500 font-extrabold`).

---

## 8. Do's and Don'ts

### ✅ DO:
- Keep financial figures strictly mono-spaced with consistent decimal places (2 for currency, 2 for ROAS, 1 for percentages).
- Provide immediate visual validation on risky fulfillment rates (<70% highlighted in amber/rose).
- Invert directional icons (arrows, chevrons, search icons) when in RTL mode.
- Maintain persistent sync across both `sessionStorage` and `localStorage`.

### ❌ DON'T:
- Do not use abrasive pure red/green text without background pills or contrast borders.
- Do not use generic browser alert/confirm dialogues (always use `DeleteConfirmationModal`).
- Do not hide critical delivery loss calculations behind complex accordion menus.
- Do not block user workflow with unnecessary multi-step confirmation wizards.
