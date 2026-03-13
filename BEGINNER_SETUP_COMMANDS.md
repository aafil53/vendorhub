# VendorHub Local Setup (Beginner, Command-Only)

Use this guide exactly in order.

## 1) Clone the project
```bash
git clone https://github.com/aafil53/vendorhub.git
cd vendorhub
```

## 2) Install frontend dependencies (root)
```bash
npm install
```

## 3) Install backend dependencies
```bash
cd backend
npm install
```

## 4) Create MySQL database in MySQL Workbench
Run these SQL commands in MySQL Workbench:
```sql
CREATE DATABASE vendorhub;
USE vendorhub;
```

## 5) Create backend environment file
From `backend/` directory, run:
```bash
cat > .env <<'ENV'
DB_HOST=localhost
DB_PORT=3306
DB_NAME=vendorhub
DB_USER=root
DB_PASS=YOUR_MYSQL_PASSWORD
DB_DIALECT=mysql
JWT_SECRET=supersecret
PORT=5000
ENV
```

## 6) Run database migrations
From `backend/` directory:
```bash
npx sequelize-cli db:migrate
```

## 7) Start backend server (Terminal 1)
From `backend/` directory:
```bash
npm run dev
```

## 8) Start frontend server (Terminal 2)
Open a new terminal:
```bash
cd vendorhub
npm run dev
```

## 9) Open app
```text
http://localhost:5173
```

## 10) Register users and login
Use these routes:
```text
http://localhost:5173/register
http://localhost:5173/login
```

## Quick restart commands

### Start both servers again
Terminal 1:
```bash
cd vendorhub/backend
npm run dev
```

Terminal 2:
```bash
cd vendorhub
npm run dev
```

### Reset database (optional)
From `backend/` directory:
```bash
npx sequelize-cli db:migrate:undo:all
npx sequelize-cli db:migrate
```
