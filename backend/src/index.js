require("dotenv").config();
require("express-async-errors"); // lets errors thrown inside async routes reach the handler below
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const walletRoutes = require("./routes/wallet");
const userRoutes = require("./routes/users");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/users", userRoutes);

// anything that blows up ends here
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on our side" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`PayNest API running on http://localhost:${PORT}`));
