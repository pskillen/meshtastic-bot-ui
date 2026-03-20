# MeshFlow UI style guide

Standalone specification for **MeshFlow** front-end UI: hierarchy, color, surfaces, typography, and dual-theme behavior. Implement with your stack (e.g. Tailwind, shadcn-style tokens, CSS variables)—this document is the contract, not a map to current files.

---

## Principles

1. **Readable hierarchy** — Structure should read at a glance: page canvas → section frame → nested content → (where needed) list rows, inset controls, or accordions.
2. **Both themes, same intent** — Light and dark are first-class. Prefer **2px** borders and explicit slate strokes where panels must separate clearly; a default **1px** hairline often disappears on nearby tones.
3. **Semantic tokens first** — Use global theme tokens (`background`, `foreground`, `card`, `border`, `muted`, `accent`) for surfaces that should track theme. Add explicit **slate** (and `dark:` overrides) when hierarchy or contrast needs it.
4. **Hierarchy drives light/dark, not stripes** — “Alternating” light and dark means **stepping through nested containers** (page → frame → inset → …): each level is defined **relative to its parent** so depth is obvious. It does **not** mean banding **consecutive sibling blocks** (e.g. chart A / chart B / chart C with different backgrounds) for rhythm. Siblings at the same depth should share the **same** container styling unless content semantics differ.
5. **Consistency** — Encode repeated bundles as shared constants or components; avoid one-off border/background combinations for the same role.

---

## Page canvas

The default **page canvas** is the neutral full-page background—the surface users read as “the page.”

| Theme | Canvas background (typical Tailwind) |
| ----- | ------------------------------------ |
| Light | `bg-slate-50`                        |
| Dark  | `bg-slate-900`                       |

Section frames and nested insets are defined **relative** to this canvas: slightly darker/lighter than the canvas, or **matching** the canvas where content should feel flush with the page.

---

## Section frames and nested insets

Use this pattern for dense pages with stacked blocks (dashboards, long settings pages, multi-panel layouts).

### Hierarchical light/dark (not banded sections)

Contrast should change as you **go inward** through the layout tree, not as you **move down a list of peers**:

| Do                                                                                                           | Don’t                                                                                    |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Page canvas → section frame (different tone) → nested inset (often **back to canvas** tone inside the frame) | Same-level items (e.g. three charts in a row) with alternating backgrounds “for variety” |
| Each parent/child step uses the frame vs inset rules below                                                   | Striped siblings that only differ cosmetically                                           |

So “light/dark” here is **structural** (which box am I inside?) — not a visual pattern across **consecutive** sections.

### Section frame (outer container)

The **first visible frame** around a major block is the **section frame**—a raised band around a group of related content.

| Theme | Relationship to canvas  | Typical treatment           |
| ----- | ----------------------- | --------------------------- |
| Light | **Darker** than canvas  | e.g. `bg-slate-200/90`      |
| Dark  | **Lighter** than canvas | e.g. `dark:bg-slate-800/90` |

- Border: **2px**, e.g. `border-2 border-slate-400` (light) with appropriate `dark:` border.
- Optional light shadow so the frame lifts slightly from the canvas.

### Nested inset (inner container)

Regions **inside** a section frame that should feel **on the page** (tables, maps, chart stacks, primary content wells) use the **same background as the page canvas**:

- `bg-slate-50` / `dark:bg-slate-900` (aligned with the canvas table above).

Still wrap with a **2px** border so the inset edge reads against the section frame. Border tones may track `slate-400` (light) and `slate-600`–`700` (dark).

### Card or panel shell inside a frame

If the section frame’s tint lives on a **wrapper**, avoid a second filled card surface on top of it. Use a transparent shell: no border, no card background, preserve spacing and typography for titles and body—e.g. `border-0 bg-transparent shadow-none` with foreground text color.

### Data tables in insets

For tables that sit in a nested inset:

- Use **2px** horizontal rules between rows where the default table border is too subtle.
- **Header vs body:** in **light** mode, the header band is **darker** than the body; in **dark** mode, the header is **lighter** than the body (inverted relationship).

---

## Dense list / accordion rows (forms & settings)

For rows that must read as distinct blocks inside a section (accordion items, managed-node rows, long list panels), use a **strong** frame:

**Example (Tailwind-style):**

```txt
rounded-lg border-2 border-slate-300 bg-slate-50/80 shadow-sm
dark:border-slate-500 dark:bg-slate-950/40
```

### Secondary inset (lower emphasis)

For smaller groupings inside a section—form groups, helper blocks—use a lighter treatment than the accordion row above:

**Example:**

```txt
rounded-md border border-slate-200 bg-slate-50 p-4
dark:border-slate-700 dark:bg-slate-800/50
```

### Subtle divider

To separate stacked blocks **without** a full inset box:

```txt
border-t border-slate-200/80 pt-3 dark:border-slate-700/80
```

Match horizontal padding to the parent.

---

## Layout chrome

**Header, footer, sidebar, breadcrumbs** should use the same **slate / teal** system and the same **light/dark** parity. Prefer **2px** borders where chrome meets content or where stacked surfaces need a clear edge. Exact implementation is left to layout components; behavior should match the principles above.

---

## Color and theme

### Global tokens

Prefer **HSL CSS variables** for theme-driven surfaces: `--background`, `--foreground`, `--card`, `--border`, `--accent`, `--muted`, chart and sidebar tokens as needed.

| Intent         | Typical role                       |
| -------------- | ---------------------------------- |
| App background | Canvas and base text               |
| Cards / panels | Elevated surfaces, borders         |
| Muted          | Secondary text, disabled states    |
| Accent         | Links, highlights, primary actions |

Default **corner radius** for large containers: **0.75rem** (`rounded-lg` in a typical Tailwind + shadcn setup).

### Slate and teal

When tokens alone are not enough, use the **slate** scale for neutrals and **teal** for accents.

| Role              | Light              | Dark               |
| ----------------- | ------------------ | ------------------ |
| Ambient page tone | `bg-slate-50`      | `bg-slate-900`     |
| Elevated surface  | `bg-white`         | `bg-slate-800`     |
| Standard stroke   | `border-slate-200` | `border-slate-700` |
| Primary text      | `text-slate-900`   | `text-slate-100`   |
| Accent            | `text-teal-600`    | `text-teal-400`    |

Optional brand accents (e.g. mesh teal / blue) live in theme extension, not inline magic numbers.

### Dark mode

Use **class-based** dark mode (e.g. `dark:` in Tailwind). Nested or stacked surfaces usually need explicit `dark:border-*` and `dark:bg-*` so edges stay visible without washing the whole UI to one tone.

---

## Typography

| Role                          | Font           | Typical class |
| ----------------------------- | -------------- | ------------- |
| Body and UI                   | Inter          | `font-sans`   |
| Headings and branding         | Montserrat     | `font-header` |
| Node IDs, hex, monospace data | JetBrains Mono | `font-mono`   |

Load **Inter**, **Montserrat**, and **JetBrains Mono** (e.g. from Google Fonts).

---

## Composition utilities

When combining conditional classes, use a **merge helper** that deduplicates conflicting Tailwind utilities (e.g. `tailwind-merge` + `clsx` pattern). Avoid giant one-off strings for the same role; centralize bundles that repeat.
