# 🚚 VendorHub Management System Setup Guide

Welcome to the **VendorHub Management System**! This guide is designed to help you get the project running on your local machine as quickly and easily as possible, even if you are a beginner.

---

## 📋 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Step 1: Clone the Project](#step-1-clone-the-project)
3. [Step 2: Backend Setup (The Engine)](#step-2-backend-setup-the-engine)
4. [Step 3: Database Setup (The Storage)](#step-3-database-setup-the-storage)
5. [Step 4: Frontend Setup (The Interface)](#step-4-frontend-setup-the-interface)
6. [Step 5: Access the App](#step-5-access-the-app)
7. [🔑 Test Credentials](#-test-credentials)
8. [🛠️ Troubleshooting](#️-troubleshooting)

---

## 1. Prerequisites
Before you start, make sure you have these 3 tools installed on your computer:

1.  **Node.js (v18 or higher)**: [Download here](https://nodejs.org/)
2.  **Git**: [Download here](https://git-scm.com/)
3.  **Docker Desktop** (Required for MySQL): [Download here](https://www.docker.com/products/docker-desktop/)

> [!TIP]
> After installing, shared your computer once to ensure everything is set up correctly.

---

## Step 1: Clone the Project
Open your terminal (Command Prompt, PowerShell, or Git Bash) and run these commands:

```bash
# 1. Download the code
git clone <repository-url>

# 2. Go into the project folder
cd vendorhub
```

---

## Step 2: Backend Setup (The Engine)
The backend handles the data and logic.

```bash
# 1. Enter the backend folder
cd backend

# 2. Install the necessary packages
npm install

# 3. Create your environment file (Windows)
copy .env.example .env

# OR for Mac/Linux:
# cp .env.example .env
```

---

## Step 3: Database Setup (The Storage)
We use **MySQL** running inside a "Docker container." This keeps the database separate from your system files.

1.  **Start Docker Desktop** on your computer.
2.  Go back to the **main project folder** (`vendorhub/`) in your terminal.
3.  Run this command to start the database:
    ```bash
    # Ensure Docker Desktop is open first!
    docker compose up -d mysql phpmyadmin
    ```
    *(This starts MySQL on port 3307 and phpMyAdmin on port 8080)*
4.  **Populate the data**: Go back into the `backend/` folder and run:
    ```bash
    npm run seed
    ```
5.  **Start the Backend**:
    ```bash
    npm run dev
    ```
    *(Keep this terminal open!)*

---

## Step 4: Frontend Setup (The Interface)
Open a **NEW** terminal window so the backend terminal keeps running.

```bash
# 1. Make sure you are in the 'vendorhub' folder
# 2. Install the packages
npm install

# 3. Create the frontend environment file (Windows)
copy .env.example .env

# 4. Start the website
npm run dev
```

---

## Step 5: Access the App
Once everything is running:
-   **Website**: [http://localhost:5173](http://localhost:5173)
-   **Database Manager (phpMyAdmin)**: [http://localhost:8080](http://localhost:8080)
    -   *User: `root` | Pass: `rootpassword`*

---

## 🔑 Test Credentials
Use these accounts to sign in and test the system:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@example.com` | `123` |
| **Client** | `client@example.com` | `123` |
| **Vendor** | `vendor1@example.com` | `123` |

---

## 🛠️ Troubleshooting

-   **"Command not found: npm"**: You need to install [Node.js](https://nodejs.org/).
-   **"Docker not running"**: Open Docker Desktop and wait for the little whale icon to turn green.
-   **"Database connection error"**: 
    1. Make sure Docker Desktop is running.
    2. Run `docker compose up -d mysql` in the main folder.
    3. Check if the container is running with `docker ps`.
    4. If it still fails, try changing `DB_HOST=localhost` to `DB_HOST=127.0.0.1` in `backend/.env`.
-   **"Port 5000 already in use"**: Close any other terminal where the backend might be running.

---

## 💡 Developer Cheat Sheet
Common commands you might need:
-   `npm run dev`: Starts the project.
-   `npm run seed`: Resets the database with fresh test data.
-   `docker-compose stop`: Stops the database to save computer memory.
