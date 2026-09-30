const express = require("express");
const { Prisma } = require("@prisma/client");
const prisma = require("../db");
const auth = require("../middleware/auth");
const { getCache, setCache, clearUserCache } = require("../redis");

const router = express.Router();
router.use(auth);

const MAX_AMOUNT_PAISE = 100000 * 100; // Rs 1,00,000 per operation

// The API talks in rupees, the database stores paise.
const toRupees = (paise) => paise / 100;

// Turns "250.50" into 25050. Returns null if the amount makes no sense.
function toPaise(input) {
  const rupees = Number(input);
  if (!Number.isFinite(rupees) || rupees <= 0) return null;
  const paise = Math.round(rupees * 100);
  if (paise < 1 || paise > MAX_AMOUNT_PAISE) return null;
  return paise;
}

// ---------- balance (cache-aside with Redis) ----------
router.get("/balance", async (req, res) => {
  const key = `balance:${req.userId}`;

  const cached = await getCache(key);
  if (cached) {
    return res.json(cached);
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId: req.userId } });
  const data = { balance: toRupees(wallet.balance) };

  await setCache(key, data);
  res.json(data);
});

// ---------- top up ----------
router.post("/topup", async (req, res) => {
  const paise = toPaise(req.body.amount);
  if (!paise) {
    return res.status(400).json({ error: "Enter an amount between Rs 0.01 and Rs 1,00,000" });
  }

  // both writes succeed together or not at all
  const [wallet] = await prisma.$transaction([
    prisma.wallet.update({
      where: { userId: req.userId },
      data: { balance: { increment: paise } },
    }),
    prisma.transaction.create({
      data: { type: "TOPUP", amount: paise, receiverId: req.userId },
    }),
  ]);

  await clearUserCache(req.userId);
  res.json({ message: "Wallet topped up", balance: toRupees(wallet.balance) });
});

// ---------- transfer ----------
router.post("/transfer", async (req, res) => {
  const paise = toPaise(req.body.amount);
  if (!paise) {
    return res.status(400).json({ error: "Enter an amount between Rs 0.01 and Rs 1,00,000" });
  }

  const toEmail = (req.body.toEmail || "").trim().toLowerCase();
  const receiver = await prisma.user.findUnique({ where: { email: toEmail } });

  if (!receiver) {
    return res.status(404).json({ error: "No user found with that email" });
  }
  if (receiver.id === req.userId) {
    return res.status(400).json({ error: "You can't send money to yourself" });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Lock both wallets until this transaction finishes.
      // If two transfers hit the same wallet at the same time, the second one
      // waits here, then reads the updated balance. That's what stops overspending.
      // Locking in id order keeps two opposite transfers (A->B and B->A) from deadlocking.
      await tx.$queryRaw`
        SELECT id FROM "Wallet"
        WHERE "userId" IN (${Prisma.join([req.userId, receiver.id])})
        ORDER BY id
        FOR UPDATE
      `;

      const senderWallet = await tx.wallet.findUnique({ where: { userId: req.userId } });
      if (senderWallet.balance < paise) {
        throw new Error("NOT_ENOUGH_BALANCE");
      }

      await tx.wallet.update({
        where: { userId: req.userId },
        data: { balance: { decrement: paise } },
      });
      await tx.wallet.update({
        where: { userId: receiver.id },
        data: { balance: { increment: paise } },
      });
      await tx.transaction.create({
        data: { type: "TRANSFER", amount: paise, senderId: req.userId, receiverId: receiver.id },
      });
    });
  } catch (err) {
    if (err.message === "NOT_ENOUGH_BALANCE") {
      return res.status(400).json({ error: "Not enough balance" });
    }
    throw err;
  }

  await Promise.all([clearUserCache(req.userId), clearUserCache(receiver.id)]);
  res.json({ message: `Sent to ${receiver.name}` });
});

// ---------- history (paginated + cached) ----------
router.get("/transactions", async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

  const key = `history:${req.userId}:${page}:${limit}`;
  const cached = await getCache(key);
  if (cached) {
    return res.json(cached);
  }

  const where = { OR: [{ senderId: req.userId }, { receiverId: req.userId }] };

  const [rows, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        sender: { select: { name: true } },
        receiver: { select: { name: true } },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  const transactions = rows.map((t) => {
    const isDebit = t.senderId === req.userId;
    let title = "Wallet top-up";
    if (t.type === "TRANSFER") {
      title = isDebit ? `Sent to ${t.receiver.name}` : `Received from ${t.sender.name}`;
    }
    return {
      id: t.id,
      title,
      direction: isDebit ? "debit" : "credit",
      amount: toRupees(t.amount),
      createdAt: t.createdAt,
    };
  });

  const data = { transactions, page, total, totalPages: Math.max(Math.ceil(total / limit), 1) };
  await setCache(key, data);
  res.json(data);
});

module.exports = router;
