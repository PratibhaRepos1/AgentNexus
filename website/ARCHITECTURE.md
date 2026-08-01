# AgentNexus Marketing Site — Architecture

Promotion/marketing site for AgentNexus: home page, features, pricing, and free-demo booking.
Separate from `frontend/` (the admin/analytics dashboard, a React SPA) — this is a
purely static, SEO-first site with a different tech stack for a different job.

## Why a separate stack from `frontend/`

`frontend/` is a logged-in, data-heavy React SPA — SEO doesn't matter there, it's behind auth.
This site is the opposite: it's the thing small-business owners find via Google before they've
ever heard of AgentNexus, so page-load speed and crawlability are the whole game. A client-rendered
SPA is the wrong tool for that job — hence a separate static-generation project instead of adding
public routes to the dashboard app.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | [Astro](https://astro.build) (static output) | Ships zero JS by default — every page here is static HTML/CSS, only the demo form has a few lines of vanilla JS. Best-in-class Lighthouse/Core Web Vitals scores, which directly affects Google ranking for local/small-business search. |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) | Same utility approach as `frontend/`, so styling knowledge transfers. Tailwind v4 needs no `tailwind.config.js` — theme tokens (colors, etc.) come from Tailwind's default palette plus a couple of custom CSS variables in `src/styles/global.css`. |
| Fonts | Google Fonts (Sora for headings, Inter for body), loaded via `@import` in `global.css` | Free, fast, no build step needed. |
| SEO | `@astrojs/sitemap` + per-page meta/OG/Twitter tags in `Layout.astro` + `public/robots.txt` | Sitemap and robots.txt are the baseline for organic discovery; per-page `<title>`/`<meta description>` drive click-through from search results. |
| Hosting (recommended) | Vercel, Netlify, or Cloudflare Pages (static) | Astro's static output is plain files — deploys to any static host with zero server cost. Unlike the FastAPI backend, this project has **no** Docker/runtime requirement, so Vercel is actually a great fit here (see note below). |

### Note on Vercel vs. the backend

Earlier we ruled out Vercel for the FastAPI backend (heavy ML deps, stateful startup, no
persistent filesystem — see project discussion). None of that applies here: this site builds to
static files with no server process, so Vercel/Netlify/Cloudflare Pages all work with no changes.

## Folder structure

```
website/
├── src/
│   ├── layouts/
│   │   └── Layout.astro       # <html> shell: meta/OG/Twitter tags, Header, Footer, slot
│   ├── components/
│   │   ├── Header.astro       # Sticky nav, CSS-only (checkbox-hack) mobile menu
│   │   ├── Footer.astro
│   │   ├── FeatureCard.astro  # icon + title + description card, reused on Home & Features
│   │   └── CTASection.astro   # Reusable gradient CTA banner, reused on all 3 marketing pages
│   ├── pages/
│   │   ├── index.astro        # Home — hero, feature highlights, how-it-works, pricing teaser, CTA
│   │   ├── features.astro     # Full feature breakdown, grouped by category (mirrors files/FEATURES.md)
│   │   ├── pricing.astro      # 4-tier pricing cards + billing FAQ (mirrors files/FEATURES.md plans)
│   │   └── demo.astro         # Free-demo lead capture form
│   └── styles/
│       └── global.css         # Tailwind import, Google Fonts import, brand gradient utilities
├── public/
│   ├── favicon.ico / favicon.svg
│   └── robots.txt
└── astro.config.mjs           # site URL (for sitemap), Tailwind + sitemap integrations
```

## Content source of truth

Page copy (features, pricing tiers, billing policy) is derived from `files/FEATURES.md` at the
repo root, which is the canonical, "actually built and working" feature/pricing list. When a
feature ships or a plan changes, update `files/FEATURES.md` first, then reflect it here — don't
let the two drift.

## Known gaps / before going live

- **`site` domain is a placeholder** (`https://agentnexus.app` in `astro.config.mjs` and
  `public/robots.txt`) — replace with the real registered domain before deploying, otherwise the
  sitemap and canonical URLs will point to the wrong host.
- **No `og-image.png`** yet — `Layout.astro` references `/og-image.png` for social share previews;
  add a real 1200×630 image to `public/` before launch or social shares will show a broken image.
- **Demo form has no backend.** `src/pages/demo.astro` currently just shows a client-side "thanks"
  message on submit — it doesn't send the lead anywhere. Before launch, wire it to either:
  - the AgentNexus backend's leads/notifications pipeline (a new public `POST` endpoint), or
  - a form service (Netlify Forms, Formspree, etc.) if hosting on a platform that supports it.
- **No analytics** wired up yet (e.g. Plausible, GA4, or Vercel Analytics) — needed to actually
  measure organic traffic and demo-request conversion once live.
- **No testimonials/social proof yet** — the home page has a placeholder social-proof strip
  ("Built for retail shops, clinics, restaurants...") instead of real customer logos/quotes, since
  AgentNexus doesn't have paying customers yet. Replace once available.

## Commands

```bash
cd website
npm install
npm run dev       # local dev server
npm run build     # static build to dist/
npm run preview   # serve the production build locally
```
