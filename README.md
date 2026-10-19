<p align="center">
  <img src="apps/web/public/logo-emblem.png" alt="واحة الإسترخاء للمساج" width="120" style="border-radius: 50%;" />
</p>

<h1 align="center">واحة الإسترخاء للمساج — Oasis Spa & Wellness</h1>

<p align="center">
  <strong>An offline-first, ZATCA Phase 2-compliant Spa Management & POS ecosystem tailored for luxury wellness centers in Saudi Arabia.</strong>
</p>

<p align="center">
  <a href="https://osos3lom.github.io/massage/"><img src="https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-4F46E5?style=for-the-badge&logo=github" alt="Live Demo" /></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
  <a href="https://electronjs.org/"><img src="https://img.shields.io/badge/Electron-Desktop%20POS-47848F?style=for-the-badge&logo=electron" alt="Electron" /></a>
  <a href="https://www.powersync.com/"><img src="https://img.shields.io/badge/PowerSync-Local--First-EC4899?style=for-the-badge" alt="PowerSync" /></a>
  <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" /></a>
  <a href="https://turbo.build/repo"><img src="https://img.shields.io/badge/Monorepo-Turborepo%20%2B%20pnpm-EF4444?style=for-the-badge&logo=turborepo" alt="Turborepo" /></a>
</p>

---

## 📋 Overview

**واحة الإسترخاء للمساج (Relaxation Oasis)** is an enterprise-grade digital solution designed for high-end spa, hammam, and wellness centers. Centered around a single-branch flagship in **Al Nuzha, Jeddah**, this platform bridges a customer-facing digital booking journey with an **offline-first store POS terminal** and a comprehensive **operations dashboard**.

Engineered as a modern **Turborepo monorepo**, the system guarantees zero-downtime sales operations through **local-first replication** (SQLite ↔ Supabase Postgres via PowerSync) and strict adherence to **Saudi ZATCA Phase 2 e-invoicing** standards.

---

## 🏛 Architecture & Engineering Pillars

```
┌────────────────────────────── IN THE STORE (Works 100% Offline) ──────────────────────────────┐
│                                                                                                 │
│  🖥️  Electron Desktop POS Terminal (apps/desktop)                                              │
│      ├── Touch-first till interface (Fast 4-digit PIN access)                                   │
│      ├── Local SQLite Engine (better-sqlite3) ← Instant offline read/write                     │
│      └── Hardware Bridge: 80mm ESC/POS thermal receipt printing & HALA payment integration      │
│                                                                                                 │
└───────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                │
                                                ▼  PowerSync Replicator (Bidirectional sync when online)
┌───────────────────────────────────────────────┴─────────────────────────────────────────────────┐
│                                                                                                 │
│  ☁️  Cloud Infrastructure & Management (Supabase + Next.js)                                      │
│      ├── Supabase: Postgres 16 · Auth · Storage · Row-Level Security (RLS)                      │
│      ├── Next.js Web Application (apps/web):                                                    │
│      │   ├── 🌸 Public Marketing & Online Booking Portal (Bilingual AR/EN)                       │
│      │   └── 📊 Management Dashboard (Bookings calendar, therapist shifts, inventory, ZATCA)    │
│      └── Static Export automatically deployed to GitHub Pages via CI/CD                         │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Key Engineering Decisions

- **Local-First Resilience:** In-store POS checkout continues operating without interruption during internet outages. Local SQLite is the immediate source of truth, replicating to cloud Supabase via **PowerSync** with collision-free UUID primary keys.
- **ZATCA Phase 2 Ready:** Compliant with Saudi ZATCA e-invoicing requirements (15% VAT extraction, cryptographic hash chain, standard QR code metadata generation, and append-only audit trail).
- **Exact Money Representation:** 100% integer arithmetic in **Saudi Halalas** (`*_halalas` columns via `@oasis/shared/money`) across UI, desktop client, and database to eliminate IEEE 754 floating-point rounding discrepancies.
- **Strict Row-Level Security (RLS):** Supabase Postgres security policies restrict operational scopes by role (`admin` vs. `cashier`), protecting audit logs, payroll commission figures, and transaction histories.
- **Bi-directional i18n:** Built from the ground up for Arabic (default RTL) with full English (LTR) language support.

---

## 📦 Monorepo Workspace Structure

```
massage/
├── apps/
│   ├── web/                     # Next.js 16 (App Router) + React 19 + Tailwind CSS 4
│   │   ├── src/app/             # Public landing page, /dashboard, and /pos routes
│   │   ├── src/components/      # UI components, layout sections, modals, icons
│   │   ├── src/data/            # Seed datasets, catalog metadata, business configuration
│   │   └── public/              # Static assets, branding logo, treatment photography
│   │
│   └── desktop/                 # Electron + Vite + React 19 Desktop POS App
│       ├── src/main/            # Electron main process (Node hardware bridge, ESC/POS, HALA)
│       ├── src/preload/         # Context-bridge secure IPC channels
│       └── src/renderer/        # Touch POS UI powered by local SQLite & PowerSync
│
├── packages/
│   ├── db/                      # Database core: Drizzle ORM schema, migrations, RLS policies
│   │   ├── src/schema.ts        # 21 typed tables (sales, appointments, shifts, ZATCA audit)
│   │   └── rls-policies.sql     # Supabase Row Level Security policy definitions
│   │
│   └── shared/                  # Common domain models, Zod validation schemas, halalas math
│       ├── src/money.ts         # Precision currency utilities (formatSAR, halalasToSAR, etc.)
│       └── src/types/           # Shared TypeScript interfaces across web & desktop
│
├── .github/workflows/           # CI/CD: Automated build & deploy to GitHub Pages
├── turbo.json                   # Turborepo task pipeline configuration
├── pnpm-workspace.yaml          # Monorepo package workspace definitions
└── package.json                 # Monorepo root scripts & dev dependencies
```

---

## 🌟 Features

### 1. 🌿 Luxury Customer Experience & SEO Site (`apps/web`)
* **Responsive Visual Showcase:** Polished design featuring tranquil aesthetics, responsive typography, and subtle scroll animations (Framer Motion).
* **Treatment Catalog:** Interactive cards for Deep Tissue, Swedish Massage, Moroccan Bath, Foot Reflexology, and Grooming services.
* **Curated Packages:** Multi-service bundles with clear duration breakdowns and pricing in Saudi Riyals (SAR).
* **Booking & Location:** Interactive appointment request flow, salon operating hours, prayer break accommodations, and interactive Al Nuzha, Jeddah Google Maps integration.
* **SEO & Social Optimization:** Server-Side Pre-rendered static pages with JSON-LD Schema (`DaySpa`), OpenGraph, dynamic sitemap, and robots.txt.

### 2. 🖥️ Native Windows Desktop Application (`apps/desktop`)
* **Dual-Mode Operation:** Functions in-store as `POS_TERMINAL` (touchscreen till, HALA card payments, 80mm ESC/POS thermal receipts, offline SQLite) and remotely on the owner's PC as `CLOUD_OWNER` (full back-office management & reporting).
* **Zero Latency Offline-First:** Built with Electron 34, Vite 6, and SQLite (`better-sqlite3`) synced seamlessly via PowerSync with Supabase PostgreSQL.
* **ZATCA Phase 2 Fatoora:** Embedded background signing worker generating cryptographically compliant ECDSA secp256k1 TLV QR codes and XML hashes, with direct CSID onboarding via Supabase Edge Function.
* **Operator Security:** Quick 4-digit PIN employee switching for cashiers with scrypt-salted verification and brute-force lockout protection.
* **HALA Terminal & Supplies-Only Inventory:** Integrated HALA EFTPOS payment capture (mada, Visa, Mastercard, Apple Pay, STC Pay with 6-digit approval code and 12-digit RRN) and internal massage consumable stock tracking (oils, soap, loofahs, towels).

---

## 🛠 Tech Stack

| Domain | Technologies |
|---|---|
| **Monorepo Management** | [Turborepo](https://turbo.build/), [pnpm Workspaces](https://pnpm.io/) |
| **Web Framework** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/) |
| **Desktop Application** | [Electron 34](https://www.electronjs.org/), [Vite 6](https://vitejs.dev/), [Electron-Vite](https://electron-vite.org/) |
| **Styling & Icons** | [Tailwind CSS 4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/) |
| **Database & ORM** | [PostgreSQL 16](https://www.postgresql.org/) ([Supabase](https://supabase.com/)), [SQLite](https://sqlite.org/) (`better-sqlite3`), [Drizzle ORM](https://orm.drizzle.team/) |
| **Replication / Sync** | [PowerSync](https://www.powersync.com/) (Local-first background sync engine) |
| **State & Data Sharing** | [Zod](https://zod.dev/), TypeScript 5.7+ |
| **Deployment & CI/CD** | [GitHub Actions](https://github.com/features/actions), [GitHub Pages](https://pages.github.com/) |

---

## 🚀 Getting Started

### Prerequisites

* **Node.js:** `v20` or `v22` (LTS recommended)
* **Package Manager:** `pnpm` (`v9` or `v10`) — install via `npm install -g pnpm`
* **Git:** Installed and configured

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/osos3lom/massage.git

# Enter the repository root
cd massage

# Install monorepo dependencies across all packages
pnpm install
```

### 2. Environment Variables

Create a `.env.local` file in the root or in `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Running the Applications

#### Launch the Web Application (Marketing & Dashboard)
```bash
# Starts the Next.js dev server on http://localhost:3000
pnpm dev
# Or specifically:
pnpm --filter @oasis/web dev
```

#### Launch the Desktop POS Application
```bash
# Starts the Electron + Vite dev environment
pnpm --filter @oasis/desktop dev
```

#### Monorepo Building & Linting
```bash
# Build all apps and packages via Turborepo
pnpm build

# Run linting across all workspaces
pnpm lint
```

---

## 🗄️ Database & Schema Management

Database schemas are authored declaratively in `packages/db/src/schema.ts` using **Drizzle ORM** with PostgreSQL types:

```bash
# Inspect or manage schemas
cd packages/db

# Apply SQL RLS policies in Supabase SQL editor:
# packages/db/rls-policies.sql
```

---

## 🔒 Security & Compliance

- **Immutable Sales Ledger:** Transaction rows are append-only. Voids, refunds, or corrections generate linked balancing entries rather than destructively modifying historical records.
- **PIN Cryptographic Security:** Cashier access is validated via salted hashes (`pin_hash`); plain text credentials are never stored.
- **Strict Postgres RLS:** Enforces data isolation between front-line cashier roles and supervisory administrators.

---

## 👤 Author

**Osama Alam**  
*Full Stack & Systems Developer*  
* GitHub: [@osos3lom](https://github.com/osos3lom)
* Repository: [https://github.com/osos3lom/massage](https://github.com/osos3lom/massage)

---

## 📄 License

This project is proprietary and maintained for **واحة الإسترخاء للمساج**. All rights reserved.
