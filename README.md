# 🪺 PayNest — Digital Wallet

A full-stack secure digital wallet built with **Next.js**, **PostgreSQL**, **Redis**, and **JWT authentication**.

## ✨ Features

- **Register / Login** — secure auth with JWT stored in HttpOnly cookies (XSS-safe)
- **Wallet Balance** — Redis cache-aside pattern (sub-millisecond reads)
- **Add Money (Top-up)** — add funds to your wallet
- **Send Money (Transfer)** — peer-to-peer transfers with atomic PostgreSQL transactions
- **Transaction History** — paginated history of all transactions
- **User Search** — find recipients by name or email
- **Race Condition Safe** — PostgreSQL row-level locking prevents double-spending

## 🏗 Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | Next.js 14 (App Router), React 18  |
| Backend    | Next.js API Routes (Node.js)       |
| Database   | PostgreSQL + Prisma ORM            |
| Cache      | Redis (ioredis)                    |
| Auth       | JWT in HttpOnly cookies            |
| Validation | Zod                                |
| Styling    | Tailwind CSS                       |

## 🚀 Setup Guide

### Prerequisites
- Node.js 18+
- PostgreSQL (running locally or remote)
- Redis (optional — app works without it, just slower)

### 1. Clone and install
```bash
git clone https://github.com/Kaushik363/paynest-wallet
cd paynest-wallet
npm install
```

### 2. Setup environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/paynest"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-long-random-secret-here"
```

### 3. Create the database
```bash
# In psql or pgAdmin, create the database:
createdb paynest
# OR in psql: CREATE DATABASE paynest;
```

### 4. Run Prisma migrations
```bash
npm run db:migrate
# This creates all tables: users, wallets, transactions
```

### 5. Start development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📁 Project Structure

```
paynest-wallet/
├── prisma/
│   └── schema.prisma          # DB schema (Users, Wallets, Transactions)
├── src/
│   ├── lib/
│   │   ├── prisma.ts          # Prisma singleton
│   │   ├── redis.ts           # Redis with graceful degradation
│   │   ├── jwt.ts             # JWT sign/verify
│   │   └── auth.ts            # Get current user from cookie
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── register/  # POST — create account
│   │   │   │   ├── login/     # POST — sign in
│   │   │   │   └── logout/    # POST — sign out
│   │   │   ├── wallet/
│   │   │   │   ├── balance/   # GET — Redis cached balance
│   │   │   │   ├── topup/     # POST — add money
│   │   │   │   └── transfer/  # POST — atomic P2P transfer
│   │   │   ├── transactions/  # GET — paginated history
│   │   │   └── users/search/  # GET — find users
│   │   ├── auth/
│   │   │   ├── login/         # Login UI
│   │   │   └── register/      # Register UI
│   │   ├── dashboard/         # Main wallet dashboard
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── TopupModal.tsx     # Add money modal
│   │   ├── TransferModal.tsx  # Send money modal with user search
│   │   └── TransactionList.tsx
│   └── middleware.ts          # Route protection
```

## 🔑 Key Technical Concepts

### Atomic Transfers
Money transfers wrap both debit + credit in a single PostgreSQL transaction:
```
BEGIN TRANSACTION
  → Lock sender's wallet row
  → Check balance ≥ amount
  → Debit sender
  → Credit receiver
  → Record transaction
COMMIT (or ROLLBACK if anything fails)
```

### Redis Cache-Aside
```
GET /api/wallet/balance
  → Check Redis: balance:{userId}
  → HIT? Return instantly
  → MISS? Query PostgreSQL → store in Redis (TTL 5 min) → return
On transfer/topup:
  → DEL balance:{senderId}, balance:{receiverId}
```

### JWT in HttpOnly Cookie
- Server sets `Set-Cookie: paynest_token=...; HttpOnly; SameSite=Strict`
- Browser sends cookie automatically on every request
- JavaScript **cannot read it** — prevents XSS token theft

## 📦 Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run db:migrate   # Run DB migrations
npm run db:generate  # Regenerate Prisma client
npm run db:studio    # Open Prisma Studio (DB GUI)
npm run db:push      # Push schema without migration (dev only)
```
