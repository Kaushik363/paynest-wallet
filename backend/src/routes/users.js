const express = require("express");
const prisma = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

// Search other users by name or email so you can pick who to send money to.
router.get("/search", auth, async (req, res) => {
  const q = (req.query.q || "").trim();

  if (q.length < 2) {
    return res.json({ users: [] });
  }

  const users = await prisma.user.findMany({
    where: {
      id: { not: req.userId },
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, email: true },
    take: 5,
  });

  res.json({ users });
});

module.exports = router;
