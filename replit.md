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

## Recent Fixes (2026-04-27) — Loading & Auth Stability
- Added a static HTML boot splash (`#wave-boot` in `index.html`) shown until React mounts; removed by `src/main.tsx` after first paint to eliminate the white flash on first load.
- Service worker (`public/sw.js`) is now registered ONLY in production. In dev (`localhost`, `*.replit.dev`, `*.repl.co`) any existing SW is unregistered and caches cleared so Vite HMR isn't broken by stale cached bundles. Cache version bumped to `wave-ai-v5`.
- `Landing`, `Login`, `Signup`, `Profile` no longer use the `useEffect + return null` redirect pattern — they now redirect synchronously via `<Navigate>` JSX so there is no blank-page flash after sign-in / sign-out.
- `Profile.tsx` no longer calls `navigate()` during render (anti-pattern); uses `<Navigate>` instead.
- `PageLoader` (`src/components/features/PageLoader.tsx`) now shows a centered animated orb overlay during route transitions in addition to the top progress bar — so navigating between routes always shows a visible loading animation. The overlay uses `pointer-events: none` and never blocks user interaction.
- Fixed duplicate `style` attribute warning in `OnboardingModal.tsx`.
