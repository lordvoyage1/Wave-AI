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
