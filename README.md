# VendorHub VMS - Production README 🚀

**Full-cycle Vendor Management System** (RFQ → Bid → PO). **React + Node + MySQL Workbench**. **Copy-paste setup ready!**

## 🎯 **What You'll Get (5 Minutes)**
```
✅ Client Portal → Equipment → RFQ → Bid comparison → Purchase Order
✅ Vendor Portal → RFQ Inbox → Accept → Submit Response → Invoice  
✅ Admin Dashboard → Analytics + Approvals
✅ Multi-tenant security → Enterprise-grade
✅ Live notifications → Real-time updates
```

## 📦 **Prerequisites (Install Once)**
```powershell
# Node.js 18+ (https://nodejs.org)
node --version  # Should be v18+ or v20+

# MySQL Server running (localhost:3306)
# MySQL Workbench installed
```

## 🚀 **1-Click Setup (Copy-Paste All)**

## 🧭 Beginner Command-Only Setup

For a strict command-by-command guide (ideal for first-time users), use:

- `BEGINNER_SETUP_COMMANDS.md`


### **Step 1: Clone & Install**
```powershell
git clone https://github.com/aafil53/vendorhub.git
cd vendorhub
```

### **Step 2: Backend Setup**
```powershell
# Go to backend folder
cd backend
npm install
```

### **Step 3: MySQL Workbench Setup**
```sql
-- Open MySQL Workbench, connect to localhost:3306
-- Run this SQL:
CREATE DATABASE vendorhub;
USE vendorhub;
```

### **Step 4: Environment (.env)**
```powershell
# Create backend/.env (Copy-paste exactly)
echo DB_HOST=localhost > .env
echo DB_PORT=3306 >> .env  
echo DB_NAME=vendorhub >> .env
echo DB_USER=root >> .env
echo DB_PASS=YOUR_MYSQL_PASSWORD >> .env
echo DB_DIALECT=mysql >> .env
echo JWT_SECRET=supersecret >> .env
echo PORT=5000 >> .env
```
**⚠️ Replace `YOUR_MYSQL_PASSWORD` with your actual MySQL root password (e.g., `Aafil@2004`)!**

### **Step 5: Database Migration (No Seed)**
```powershell
# Create all tables (Users, RFQ, Bid, Equipment, Notification)
npx sequelize-cli db:migrate
```

### **Step 6: Frontend (Root)**
```powershell
# In a new terminal, from the root folder:
npm install
npm run dev  # http://localhost:5173
```

### **Step 7: Backend (New Terminal)**
```powershell
# In another terminal, from /backend folder:
npm run dev   # http://localhost:5000
```

## ✅ **Step 8: First Users (Production Data)**
Browser: `http://localhost:5173/register`

### **1. 👨💼 CLIENT Registration**
- **Email**: `client@volvitech.com`
- **Role**: `Client`
- **Company**: `Volvitech Construction`

### **2. 👨🔧 VENDOR Registration**
- **Email**: `hitachi@volvitech.com`
- **Role**: `Vendor`
- **Categories**: `["Cranes", "Excavators"]`

### **3. 👨💻 ADMIN Registration**
- **Email**: `admin@volvitech.com`
- **Role**: `Admin`

## 🧪 **Live Demo Test Flow**
```
1️⃣ Client Login → Equipment Catalog → "Crane Pro X" → **Send RFQ**
2️⃣ Select vendors → **Send RFQ** → Success toast!
3️⃣ Vendor Login → 🔔 **RFQ Inbox (1)** → **Accept RFQ**
4️⃣ **Submit Bid** → Price: $12,500 → Submit
5️⃣ Client Login → View Bids → **Compare & Award**
```

## ⚙️ **Quick Reset (Clean Slate)**
```powershell
# If you want to wipe everything and start over:
npx sequelize-cli db:migrate:undo:all
npx sequelize-cli db:migrate
# Now register fresh users via /register
```

## 🛡️ **Production Security Features**
```
🔒 JWT Authentication → All APIs secured
🛡️ Role-Based Access → Client/Vendor/Admin isolation  
🔍 Audit Logging → SOC2 compliance ready
🚫 Multi-tenant Isolation → No data leaks
🛡️ SQL Injection Safe → Sequelize ORM
```

## 📱 **Mobile-First Design**
```
✅ shadcn/ui + Tailwind → Perfect mobile UX
✅ Collapsible RFQ inbox → Zero scroll waste
✅ Touch-optimized buttons → iOS/Android ready
✅ Responsive tables → All screen sizes
```

***

**Manual data = Enterprise best practice ✅** 🎯

**Status: Production Setup Ready!** 🚀
