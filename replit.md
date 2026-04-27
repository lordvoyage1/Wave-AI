# Wave AI

## Overview
A Vite + React + TypeScript single-page application using shadcn/ui, Tailwind CSS, React Router, and integrations for Supabase, Stripe, Three.js, and more.

## Tech Stack
- Vite 5 + React 18 + TypeScript
- Tailwind CSS + shadcn/ui (Radix UI primitives)
- React Router DOM
- TanStack Query, Redux Toolkit, Zustand
- Supabase JS, Stripe JS, Google Generative AI
- Three.js + react-three/fiber/drei

## Replit Setup
- Frontend dev server runs on `0.0.0.0:5000` (configured in `vite.config.ts`).
- `allowedHosts: true` is set so the Replit iframe proxy can reach the dev server.
- Workflow: `Start application` runs `npm run dev`.

## Deployment
- Target: `static`
- Build: `npm run build`
- Public dir: `dist`

## Environment Variables
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are stored in `.env`.

## AI Service (2026-04-27) — Multi-Provider Aggregator
- `src/lib/aiService.ts` aggregates ~25 free chat endpoints across three providers: princetechn (`PRINCE`), xcasper.space (`XCASPER`, GET-only with `?message=`), and apiskeith (`KEITH`).
- Tier 1 (fast/reliable): xcasper openrouter/cerebras/cohere/mistral/gemini.
- Tier 2: prince letmegpt/gpt4o/ai + keith chatgpt4/gpt4/gpt.
- Tier 3 (often spam, kept as fallback): all remaining prince endpoints + xcasper deepseek/pollinations.
- Response sanitizer rejects upstream Chinese-government takedown notices ("📢 通知", "网信办", "aichatos", "chat18") and rewrites identity leaks (ChatGPT, OpenAI, Gemini, Claude, DeepSeek, LLaMA, Mistral, Cohere, Cerebras, Pollinations, Keith AI / Keith Keizzah, TRABY CASPER / CASPER TECH KENYA, PrinceTech, Gifted Tech, "trained by Google", etc.) → "Wave AI" / "Wave Platforms, Inc.".
- 24h in-memory response cache (200-entry LRU) for repeat queries.
- Race fetcher: parallel batches of 5, 7.5s batch timeout, first sanitized response wins, others aborted.
- Image generation uses pollinations.ai directly (faster + more reliable than fluximg's wrapper). text2img returns image/png directly.
- TTS uses prince/tts (audio/mpeg direct).
- Vision falls back to chat-based description when prince/vision returns spam.
- Video (veo3) is currently 404 upstream; `generateVideo` detects HTML/error responses and returns "" so UI can show a graceful message.

## Page-Load Performance (2026-04-27)
- Vite manualChunks split bundle into: react-vendor (162 KB), supabase (205 KB), ui-vendor (60 KB), main index (56 KB).
- `Home.tsx` is now lazy-loaded; Landing/Login/Signup prefetch the Home chunk in `useEffect` so navigating to `/app` is instant.
- Initial bundle dropped from 537 KB → 56 KB main JS (17 KB gzipped). Vendors are cached separately and reused across routes.

## Recent Fixes (2026-04-27) — Loading & Auth Stability
- Added a static HTML boot splash (`#wave-boot` in `index.html`) shown until React mounts; removed by `src/main.tsx` after first paint to eliminate the white flash on first load.
- Service worker (`public/sw.js`) is now registered ONLY in production. In dev (`localhost`, `*.replit.dev`, `*.repl.co`) any existing SW is unregistered and caches cleared so Vite HMR isn't broken by stale cached bundles. Cache version bumped to `wave-ai-v5`.
- `Landing`, `Login`, `Signup`, `Profile` no longer use the `useEffect + return null` redirect pattern — they now redirect synchronously via `<Navigate>` JSX so there is no blank-page flash after sign-in / sign-out.
- `Profile.tsx` no longer calls `navigate()` during render (anti-pattern); uses `<Navigate>` instead.
- `PageLoader` (`src/components/features/PageLoader.tsx`) now shows a centered animated orb overlay during route transitions in addition to the top progress bar — so navigating between routes always shows a visible loading animation. The overlay uses `pointer-events: none` and never blocks user interaction.
- Fixed duplicate `style` attribute warning in `OnboardingModal.tsx`.
