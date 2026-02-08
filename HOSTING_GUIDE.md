# Hosting Guide for VendorHub (Free Options)

Hosting for **"Free + No Limits"** is the holy grail of dev-ops. While true "unlimited" doesn't exist for free, here are the best ways to get as close as possible without spending a cent.

---

## 🏗️ Option 1: The "Everything Free" Stack (Easiest)
This combination uses specialized free tiers for each part of your app.

### 🏠 Frontend: [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/)
- **Cost**: $0
- **Limits**: Extremely high bandwidth (100GB+). Essentially "limitless" for small/medium sites.
- **Setup**: Connect your GitHub and it deploys automatically.

### ⚙️ Backend: [Render](https://render.com/) or [Koyeb](https://www.koyeb.com/)
- **Cost**: $0
- **Limits**: **Render** sleeps after 15 minutes of inactivity (slow first load). **Koyeb** is faster but has a strict monthly usage limit.
- **Setup**: Deploy your `backend/` folder.

### 🗄️ Database: [Aiven](https://aiven.io/free-plans) or [TiDB Cloud](https://www.pingcap.com/tidb-cloud/)
- **Cost**: $0
- **Limits**: Aiven offers a **forever free** MySQL instance (5GB storage), which is plenty for VendorHub.
- **Setup**: Create an account, get the connection string, and paste it into your Backend environment variables.

---

## 👑 Option 2: Oracle Cloud Free Tier (The "No Limits" King)
This is the only way to get a powerful server for $0/month for life.

- **Specs**: 4 ARM OCPUs and **24 GB of RAM**.
- **Pros**: Truly "no limits" on compute. You can run your entire Docker Compose (MySQL + Backend + Frontend) on one machine.
- **Cons**: Requires a credit card for identity verification and can be difficult to sign up (they are very selective).
- **Setup**: Create an "Always Free" instance, install Docker, and run your project.

---

## ⚠️ Important: Trade-offs of "Free"
- **"No Limits"**: Free services *must* have some limits to prevent abuse. If you hit 1 million users, you will need to pay.
- **Cold Starts**: On free tiers like Render, the website might take 30 seconds to "wake up" the first time you visit it in a while.
- **MySQL**: Truly free MySQL is rare. I recommend switching to **PostgreSQL** (via Supabase or Neon) for the best free database experience, or using **Aiven** for MySQL.
