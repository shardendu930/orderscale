const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

// @route   POST /api/auth/login
// Single hardcoded admin account (env-configured) — this is an internal admin
// tool, not a public product, so there's no registration flow.
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  res.json({ token, admin: { email } });
});

module.exports = router;
