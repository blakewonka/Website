# CLAUDE.md — AI Assistant Guide for Portfolio Website

This file documents the codebase structure, development workflows, and conventions for AI assistants working in this repository.

---

## Project Overview

A **personal portfolio website** for Ravan Alasgarov (blakewonka) — a multidisciplinary designer, design systems architect, and AI enthusiast. The site is a static, vanilla web project with no framework dependencies.

- **Live pages:** Home (`index.html`) and About (`about.html`)
- **Stack:** Vanilla HTML5, CSS3, JavaScript (ES6+), built with Vite
- **No backend, no database, no JavaScript framework**

---

## Repository Structure

```
Website/
├── index.html          # Home page (Showroom/portfolio)
├── about.html          # About page
├── vite.config.js      # Vite build configuration
├── package.json        # Project metadata and npm scripts
├── src/
│   ├── css/
│   │   ├── style.css       # Main stylesheet (~413 lines)
│   │   └── variables.css   # Design tokens and CSS custom properties
│   └── js/
│       └── main.js         # All site JavaScript (~56 lines)
└── dist/               # Production build output (do not edit manually)
    ├── index.html
    ├── about.html
    └── assets/
        ├── main-[hash].css
        ├── main-[hash].js
        └── icons/
```

---

## Development Workflow

### Prerequisites

- Node.js (any recent LTS version)
- npm

### Install dependencies

```bash
npm install
```

### Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at `http://localhost:5173` |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build locally |

### Typical workflow

1. Run `npm run dev` and open `http://localhost:5173`
2. Edit files in `src/css/`, `src/js/`, `index.html`, or `about.html`
3. Vite hot-reloads changes instantly
4. Run `npm run build` to produce the final `dist/` output

---

## Key Files and Their Roles

### `index.html` / `about.html`
HTML entry points. Both pages share the same nav structure and load `src/css/variables.css`, `src/css/style.css`, and `src/js/main.js` as a module.

- Use semantic HTML5 elements
- Include proper ARIA attributes for accessibility
- SVG icons are inlined (no icon fonts)
- Font is loaded from Fontshare CDN with `<link rel="preconnect">`

### `src/css/variables.css`
All design tokens — colors, typography, spacing, breakpoints. **Always update design values here, not inline in style.css.**

Key variables:
- `--color-bg`, `--color-text` — dark theme colors (`#0a1013`, `#f8f9f9`)
- `--font-family` — Neue Machina
- Responsive type sizes via `@media` inside this file

### `src/css/style.css`
All component and layout styles. Organized in logical sections:
- CSS reset / base
- Navigation bar
- Icon buttons
- Info blocks
- Project grid (full-width and two-column variants)
- Menu overlay
- Theme switcher

### `src/js/main.js`
All interactive behavior:
- Back button (`history.back()`)
- Mobile hamburger menu toggle with slide animation
- Keyboard (Escape) support for menu
- Theme switcher with sliding indicator

### `vite.config.js`
Multi-page build config. Both `index.html` and `about.html` are explicit entry points. Dev server runs on port **5173**.

---

## Code Conventions

### HTML
- Use semantic elements: `<nav>`, `<section>`, `<main>`, `<footer>` where appropriate
- Every interactive element needs an `aria-label` or visible label
- State attributes: `aria-expanded`, `aria-pressed`, `aria-hidden`
- No inline styles

### CSS
- **BEM-like naming:** `block__element--modifier` (e.g., `.menu-overlay__links`, `.theme-switcher__indicator`)
- **Custom properties** for all design tokens — never hardcode color/font values
- **Mobile-first** responsive design using `min-width` media queries
- Transitions use `cubic-bezier` easing for smooth animations
- z-index: nav is `101`, overlays layer above

### JavaScript
- Vanilla ES6+ only — no libraries or frameworks
- Always null-check before using a DOM element: `if (element) { ... }`
- Use CSS class toggling for state changes, not inline style manipulation
- Maintain ARIA attributes in sync with visual state changes
- No global variables — wrap logic in functions or event listeners

---

## Design System

### Colors (Dark Theme)
| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#0a1013` | Page background |
| `--color-text` | `#f8f9f9` | Primary text |

### Typography
- **Font:** Neue Machina (loaded from Fontshare)
- **Weights:** 400 (regular), 800 (bold/display)
- **Responsive scale:** 60px → 52px → 44px (desktop → tablet → mobile)

### Breakpoints
| Breakpoint | Width |
|---|---|
| Tablet | ≤ 1279px |
| Mobile | ≤ 767px |

### Spacing
- Base unit: `1rem`
- Section gaps: `100px`
- Card gaps: `16px`
- Nav button size: `40px`

---

## No Tests, No CI/CD

This project has **no test suite** and **no CI/CD pipeline**. There is no lint configuration. Quality is maintained through manual review and consistent conventions described above.

---

## External Dependencies

| Service | Purpose |
|---|---|
| `api.fontshare.com` / `cdn.fontshare.com` | Neue Machina font delivery |
| `linkedin.com/in/blakewonka/` | Social link |
| `t.me/blakewonka` | Social link |
| `mailto:contact@blakewonka.com` | Contact link |

---

## Git Workflow

- **Main branch:** `main` (on remote `origin`)
- **Local development branch:** `master`
- Changes are developed on feature branches with the prefix `claude/`
- The `dist/` folder is committed and reflects the latest production build

When making changes:
1. Ensure you are on the correct branch
2. After editing source files, run `npm run build` if the `dist/` folder needs updating
3. Commit with clear, descriptive messages
4. Push to `origin/<branch-name>`

---

## What NOT to Do

- Do not edit files inside `dist/` directly — they are generated by `npm run build`
- Do not install npm packages unless clearly necessary — the project intentionally has zero runtime dependencies
- Do not add a JavaScript framework (React, Vue, etc.) without explicit instruction
- Do not hardcode color, font, or spacing values in `style.css` — use CSS custom properties from `variables.css`
- Do not break ARIA/accessibility attributes when editing interactive components
