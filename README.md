# Placement Preparation Platform

Full-stack platform designed to prepare students for campus and off-campus placements by correlating company interview patterns, student coding weaknesses, resume analysis, and tailored AI question generation.

## Monorepo Structure

- `client/`: Next.js (TypeScript, Tailwind CSS, Lucide icons)
- `server/`: Express.js, Prisma ORM (PostgreSQL), JWT Auth, Multer, pdf-parse
- `shared/`: Shared TypeScript interfaces and Zod validation schemas

## Environment Setup

1. Copy `.env.example` in `server/` to `server/.env`:
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/placement_platform?schema=public"
   JWT_SECRET="placement_super_secret_jwt_key_2026"
   PORT=5000
   CLIENT_URL="http://localhost:3000"
   ```
2. Setup database:
   ```bash
   cd server
   npm run prisma:migrate
   npm run prisma:seed
   ```
3. Run both client and server:
   ```bash
   npm run dev
   ```
