# 🚚 VendorHub Management System Setup Guide

Welcome to the **VendorHub Management System**! This platform has been recently upgraded to a **Premium Enterprise Experience**, featuring a sophisticated design system, high-impact typography, and smooth micro-animations.

---

## ✨ Premium UI Highlights
VendorHub now features a state-of-the-art interface designed for high-stakes procurement:
- **Design System**: Dual-theme support with `Midnight & Obsidian` for professional dark mode and `Smoke & Paper` for clarity.
- **Atmospheric Visuals**: Glassmorphism, subtle background glows, and high-fidelity gradients.
- **Motion System**: Staggered reveal animations for a captivating user journey.

## 🚀 Key Features
- **2-Step Vendor Enrolment**: Modern onboarding flow with basic registration followed by professional profile completion.
- **Integrated Auth**: Role-based access control (Admin, Client, Vendor) with persistent sessions.
- **Vendor RFQ Receiving**: Live procurement grid for vendors to view and bid on opportunities.
- **Admin Command Center**: Real-time surveillance of global bid streams and asset vetting.
- **Professional Bidding**: Secure, digital-first response system with certification verification.

---

## 🛠️ Technical Stack
- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, Framer Motion (animations).
- **Backend**: Node.js, Express, Sequelize (ORM), JWT Authentication.
- **Database**: MySQL (Primary), SQLite (Development fallback).
- **Integration**: Native `fetch` API via Vite development proxy (`/api`).

---

## 📋 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Step 1: Clone & Setup](#step-1-clone--setup)
3. [Step 2: Backend & Database](#step-2-backend--database)
4. [Step 3: Frontend Interface](#step-3-frontend-interface)
5. [🔑 Test Credentials](#-test-credentials)
6. [💡 Developer Cheat Sheet](#-developer-cheat-sheet)

---

## 1. Prerequisites
Ensure you have:
1. **Node.js (v18+)**: [Download](https://nodejs.org/)
2. **Git**: [Download](https://git-scm.com/)
3. **MySQL Server**: [Download](https://dev.mysql.com/downloads/installer/)

---

## Step 1: Clone & Setup
```bash
git clone <repository-url>
cd vendorhub
```

---

## Step 2: Backend & Database
1. **Install Dependencies**:
   ```bash
   cd backend && npm install
   ```
2. **Environment Configuration**:
   ```bash
   copy .env.example .env
   # Update DB_PASSWORD in .env to your local MySQL root password
   ```
3. **Database Initialization**:
   - Create a database named `vendorhub` in MySQL.
   - Run seed data to populate with trial procurement events:
   ```bash
   npm run seed
   ```
4. **Start Engine**:
   ```bash
   npm run dev
   ```

---

## Step 3: Frontend Interface
Open a **NEW** terminal:
```bash
# From the root folder
npm install
npm run dev
```

---

## Step 4: Access the App
- **Website**: [http://localhost:5173](http://localhost:5173)
- **API Proxy**: Automatically routes `/api` to `localhost:5000` via Vite.

---

## 🔑 Test Credentials
| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@example.com` | `123` |
| **Client** | `client@example.com` | `123` |
| **Vendor** | `vendor1@example.com` | `123` |

---

## 🛠️ Troubleshooting
- **404 API Errors**: Ensure the backend is running on port 5000 before starting the frontend.
- **Auth Rejections**: Re-run `npm run seed` to ensure credentials match the database state.
- **Lint Errors in Dev**: The project uses strict ESLint rules for premium code quality. Use `npm run lint` periodically.

---

## 💡 Developer Cheat Sheet
- `npm run dev`: Starts the environment.
- `npm run seed`: Resets database state.
- `npm run build`: Production build.
- `npm run test`: Executes unit and integration tests.
