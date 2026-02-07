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
The backend is currently configured to use **MySQL** with Docker.

```bash
# Open a new terminal for the backend
cd backend

# Install dependencies
npm install

# Setup environment variables (Windows)
copy .env.example .env
# OR for Mac/Linux: cp .env.example .env
```

**Start Docker Services (MySQL + phpMyAdmin):**
```bash
# From project root, start MySQL and phpMyAdmin containers
cd ..
docker-compose up -d mysql phpmyadmin
```
-   **MySQL**: `localhost:3307`
-   **phpMyAdmin**: `http://localhost:8080` (Login: `root` / `rootpassword`)

**Populate Database:**
```bash
# Back to backend directory
cd backend

# Seed the database with test data
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

## Database Setup 🗄️

### Current Setup: MySQL with Docker (Active)
The project is currently configured to use **MySQL** running in Docker containers.

**Access phpMyAdmin for visual database management:**
-   URL: [http://localhost:8080](http://localhost:8080)
-   Username: `root`
-   Password: `rootpassword`
-   Database: `vendorhub`

**Configuration Details:**
-   **MySQL Port**: `3307` (Docker container)
-   **Tables**: Users, Equipment, RFQs, Bids, Orders, SequelizeMeta
-   **Test Data**: 5 equipment items, 3 vendors, 1 client, 1 admin

### Alternative: Switch to SQLite
If you prefer a simpler, file-based database for local development:

#### 1. Update Configuration
Edit `backend/.env`:
```properties
DB_DIALECT=sqlite
DB_STORAGE=./vendorhub.sqlite

# Comment out MySQL settings:
# DB_DIALECT=mysql
# DB_HOST=localhost
# DB_PORT=3307
# DB_USER=root
# DB_PASS=rootpassword
```

#### 2. Seed SQLite Database
```bash
cd backend
npm run seed
```

#### 3. Restart Backend
The app will now use the SQLite file (`backend/vendorhub.sqlite`) instead of MySQL.

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
-   **Backend**: Node.js, Express, Sequelize, MySQL (Production) / SQLite (Alternative).
-   **DevOps**: Docker, Docker Compose, phpMyAdmin.
