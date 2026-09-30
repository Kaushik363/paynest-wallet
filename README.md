# PayNest

Simple digital wallet. Next.js + Node/Express + Prisma + PostgreSQL (local) + Redis (Docker).

## What you need
- Node.js 18+
- PostgreSQL running on your machine
- Docker Desktop (only for Redis)

## 1. Create the database
Open psql or pgAdmin and run:

    CREATE DATABASE paynest;

## 2. Start Redis
From the project root:

    docker compose up -d

## 3. Backend

    cd backend
    npm install
    cp .env.example .env        (Windows: copy .env.example .env)

Open `.env` and put your real postgres password in `DATABASE_URL`. Then:

    npx prisma migrate dev --name init
    npm run dev

You should see "Redis connected" and "PayNest API running on http://localhost:4000".

## 4. Frontend (new terminal)

    cd frontend
    npm install
    cp .env.example .env.local  (Windows: copy .env.example .env.local)
    npm run dev

Open http://localhost:3000

## How to check it works
1. Register two users (use two browsers or one normal + one incognito window).
2. User A: add Rs 500. Balance updates.
3. User A: search user B by name, send Rs 200. B's dashboard updates within 5 seconds.
4. Try sending more than you have. You get "Not enough balance".
5. Redis cache: `docker exec -it paynest-redis redis-cli keys "*"` shows `balance:1`, `history:1:1:8` etc.
6. Race condition test (backend running): `cd backend && npm run race-test`
   Expected: 1 of 5 transfers goes through, Alice 40, Bob 60.
7. Look at the data: `cd backend && npx prisma studio`

## API
| Method | Path | Auth |
|---|---|---|
| POST | /api/auth/register | no |
| POST | /api/auth/login | no |
| GET | /api/wallet/balance | yes |
| POST | /api/wallet/topup | yes |
| POST | /api/wallet/transfer | yes |
| GET | /api/wallet/transactions?page=1&limit=10 | yes |
| GET | /api/users/search?q=name | yes |
