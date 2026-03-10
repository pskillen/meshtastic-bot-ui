# MeshFlow: Design & Migration Specification

This document serves as the UI/UX migration guide for MeshFlow. It defines the transition from the legacy "white-label" interface to a high-density, dual-theme (Light/Dark) tactical dashboard.

## 1. Visual Vision: "Tactical Modern"

The goal is to move away from a generic white background to a structured, component-based layout that feels like a professional radio monitoring station. The UI prioritizes high-contrast data visualization and geospatial clarity.

## 2. Dual-Theme Color System

MeshFlow uses a semantic color system that adapts to user preference. Implementation should utilize Tailwind CSS's `dark:` utility classes.

### A. Dark Mode (Tactical/Night)

Designed for low-light monitoring and power users.

| Element             | Hex Code  | Tailwind Class     |
| ------------------- | --------- | ------------------ |
| **Surface (Base)**  | `#0F172A` | `bg-slate-900`     |
| **Surface (Card)**  | `#1E293B` | `bg-slate-800`     |
| **Border/Stroke**   | `#334155` | `border-slate-700` |
| **Text Primary**    | `#F1F5F9` | `text-slate-100`   |
| **Accent (Active)** | `#2DD4BF` | `text-teal-400`    |

### B. Light Mode (High Visibility)

Designed for outdoor field use and standard desktop environments.

| Element             | Hex Code  | Tailwind Class     |
| ------------------- | --------- | ------------------ |
| **Surface (Base)**  | `#F8FAFC` | `bg-slate-50`      |
| **Surface (Card)**  | `#FFFFFF` | `bg-white`         |
| **Border/Stroke**   | `#E2E8F0` | `border-slate-200` |
| **Text Primary**    | `#0F172A` | `text-slate-900`   |
| **Accent (Active)** | `#0D9488` | `text-teal-600`    |

## 3. Typography & UI Tokens

- **Headings:** `Montserrat` (Bold/Semi-bold). Used for branding and site-wide section titles.
- **Interface Text:** `Inter`. Optimized for legibility in dense data grids.
- **Telemetry/IDs:** `JetBrains Mono`. Used for Node IDs (e.g., `!2d4a1b8c`) and packet hex strings.
- **Radii:** `0.75rem` (Large) for cards and containers to soften the technical feel.

## 4. Component Overhaul

### A. The "Master-Detail" Shell

1. **Sidebar:** Replace the top navigation with a collapsible side rail. This provides more vertical space for the Map and Message list.
2. **Breadcrumbs:** Use breadcrumbs (e.g., `UK-Mesh > South-East > Node-Alpha`) to give users geographic context.

### B. Map Implementation

The map should adapt to the theme:

- **Dark Mode:** Use a "Dark Matter" or "CartoDB Dark" tile set. Beams between nodes should glow using the `#2DD4BF` (Teal) accent.
- **Light Mode:** Use standard "Positron" or "OpenStreetMap" tiles with `#0D9488` (Dark Teal) for link paths.

### C. Node Detail Panel (Slide-over)

Instead of a separate page, use a slide-over panel that appears when clicking a node. This allows the user to keep the "Country-Scale" map in view while inspecting a single hardware unit.

## 5. Technical Migration Guide

### 1. Tailwind Configuration

Update `tailwind.config.js` to enable class-based dark mode and define the custom palette:

```
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mesh: {
          teal: '#2DD4BF',
          blue: '#3B82F6',
        }
      },
      fontFamily: {
        header: ['Montserrat', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    }
  }
}

```

### 2. Implementation Strategy

- **Global Wrapper:** Ensure the root `div` has `bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200`.
- **Semantic Replacement:** Audit the existing code for `bg-white` and replace it with `bg-white dark:bg-slate-800`. Replace `border-gray-200` with `border-slate-200 dark:border-slate-700`.
- **Themed Assets:** The Logo SVG should use `fill="currentColor"` to automatically adapt to the text color of the parent container.

## 6. Logo & Favicon

The logo must be updated from its current form to the **MeshFlow Gradient Mark**:

- **The Mark:** An 'M' structure branching into a right-ward arrow.
- **Favicon:** A high-contrast version of the arrow for use in browser tabs (where it must be visible against both light and dark browser Chrome).
