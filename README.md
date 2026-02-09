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
3.  **MySQL Server & Workbench**: [Download here](https://dev.mysql.com/downloads/installer/)

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
We use a **local MySQL** installation.

> [!IMPORTANT]
> **Database Creation**: Before running the backend, you must create a database named `vendorhub` in your MySQL instance (use MySQL Workbench or the command line).

1.  **Install MySQL**: Ensure MySQL Server is running on your machine.
2.  **Create Database**:
    ```sql
    CREATE DATABASE vendorhub;
    ```
3.  **Update Configuration**: Open `backend/.env` and set your `DB_PASSWORD` to your local MySQL root password.
4.  **Populate the data (CRITICAL)**: Go into the `backend/` folder and run:
    ```bash
    # This ensures your database matches the team's data
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
-   **Database**: Managed via **MySQL Workbench** or any other MySQL client.

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
-   **"Database connection error"**: 
    1. Make sure your local MySQL service is running.
    2. Verify your credentials in `backend/.env`.
    3. Ensure you created the `vendorhub` database.
-   **"Port 5000 already in use"**: Close any other terminal where the backend might be running.

---

## 💡 Developer Cheat Sheet
Common commands you might need:
-   `npm run dev`: Starts the project.
-   `npm run seed`: Resets the database with fresh test data.
