const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../db");

const router = express.Router();

function makeToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const cleanEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existing) {
    return res.status(409).json({ error: "That email is already registered" });
  }

  const hashed = await bcrypt.hash(password, 10);

  // create the user and their empty wallet in one go
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: cleanEmail,
      password: hashed,
      wallet: { create: {} },
    },
  });

  res.status(201).json({
    token: makeToken(user.id),
    user: { id: user.id, name: user.name, email: user.email },
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  const passwordOk = user && (await bcrypt.compare(password, user.password));

  if (!passwordOk) {
    return res.status(400).json({ error: "Wrong email or password" });
  }

  res.json({
    token: makeToken(user.id),
    user: { id: user.id, name: user.name, email: user.email },
  });
});

module.exports = router;
