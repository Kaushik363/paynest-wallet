# PayNest — Digital Wallet System

A secure, full-stack digital wallet application built with Next.js, PostgreSQL, and Redis.

## Features
- JWT authentication stored in HttpOnly cookies (XSS-safe)
- Atomic peer-to-peer money transfers using PostgreSQL transactions
- Redis caching for sessions and balance data
- Transaction history with real-time balance updates
- Input validation using Zod

## Tech Stack
- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS
- **Backend:** Next.js API Routes, Node.js
- **Database:** PostgreSQL, Prisma ORM
- **Cache:** Redis
- **Auth:** JWT, HttpOnly Cookies

## Getting Started

1. Clone the repo
2. Install dependencies
```bash
   npm install
```
3. Set up environment variables — copy `.env.example` to `.env` and fill in your values
4. Run Prisma migrations
```bash
   npx prisma migrate dev
```
5. Start the development server
```bash
   npm run dev
```

## Environment Variables
```env
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
```

## Screenshots
_Coming soon_