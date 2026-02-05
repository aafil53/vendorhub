# VendorHub Management System

A full-stack vendor management system built with **React (+Vite, TypeScript)** and **Node.js (+Express, SQLite/MySQL)**.

## Project Structure

```
vendorhub/
├── src/                # Frontend (React + Vite)
├── backend/            # Backend (Express + Sequelize)
└── README.md           # This file
```

## Quick Start (Copy-Paste) 🚀

Follow these steps to set up the project locally.

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **Git**

### 2. Clone the Repository
```bash
git clone <repository-url>
cd vendorhub
```

### 3. Backend Setup
The backend uses **SQLite** by default for local development (zero-config).

```bash
# Open a new terminal for the backend
cd backend

# Install dependencies
npm install

# Setup environment variables (Windows)
copy .env.example .env
# OR for Mac/Linux: cp .env.example .env

# Seed the database (creates local 'vendorhub.sqlite' with test data)
npm run seed

# Start the server (runs on port 5000)
npm run dev
```
> **Note:** The backend must be running for the frontend to work.

### 4. Frontend Setup
```bash
# Open a NEW terminal in the project root (vendorhub/)
cd vendorhub

# Install dependencies
npm install

# Start the frontend (runs on port 5173)
npm run dev
```

### 5. Access the App
Open your browser to: **http://localhost:5173**

## Docker Deployment (Production-Ready) 🐳

To run the full stack (Frontend + Backend + Nginx) with a single command:

1.  **Start Services**:
    ```bash
    docker-compose up --build
    ```
2.  **Access App**:
    Open **http://localhost** (runs on port 80 via Nginx).

> **Note**: The backend works automatically within the Docker network. The database is persistent in `backend/data`.

## Test Credentials

Login with these pre-seeded accounts to test different roles:

| Role | Email | Password |
|------|-------|----------|
|-------------|----------|
| **Client** | `client@example.com` | `123` |
| **Vendor** | `vendor1@example.com` | `123` |
| **Admin** | `admin@example.com` | `123` |

## Key Features & Testing Flow

1.  **Client Portal**:
    -   Login as **Client**.
    -   Go to **Equipment Inventory** -> Check Vendors -> Send RFQ.
    -   Go to **RFQ & Bids** -> Compare Bids -> **Create Purchase Order**.
    -   View **Purchase Orders** history.

2.  **Vendor Portal**:
    -   Login as **Vendor**.
    -   Go to **Incoming Requests** (was "Active RFQs").
    -   Click **Submit Bid**. Enter Price ($500) and Availability (Immediate).
    -   *Note: You can view the RFQs you've been invited to.*

3.  **Admin Portal**:
    -   Login as **Admin**.
    -   View **Admin Dashboard**. All active bids are listed.
    -   Click **Approve** on a bid. This marks the bid as accepted and the RFQ as awarded.

## Troubleshooting

-   **"ECONNREFUSED"**: Ensure the backend server is running on port 5000.
-   **"401 Unauthorized"**: If you just restarted the backend or changed `.env`, **Log Out** and Log In again to refresh your token.
-   **Database Issues**: Run `npm run seed` in the `backend/` folder to reset the database.

## Tech Stack
-   **Frontend**: React, Vite, TypeScript, Tailwind CSS, Shadcn UI, React Query.
-   **Backend**: Node.js, Express, Sequelize, SQLite (Dev) / MySQL (Prod).
