// routes/auth.js: sign up, log in, log out, and "who am I?".
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

// Bangladeshi mobile numbers: 11 digits starting with 013 to 019.
const PHONE_PATTERN = /^01[3-9]\d{8}$/;

// Only these fields ever leave the server. Never the password hash.
function publicUser(user) {
  return { _id: user._id, name: user.name, phone: user.phone, role: user.role, createdAt: user.createdAt };
}

// Remember the person in the session cookie. The session is saved in MongoDB.
function logIn(req, user) {
  req.session.userId = user._id.toString();
  req.session.role = user.role;
}

router.post("/api/register", async (req, res) => {
  const name = (req.body.name || "").trim();
  const phone = (req.body.phone || "").trim();
  const password = req.body.password || "";

  if (!name || !PHONE_PATTERN.test(phone)) {
    return res.status(400).json({ error: "Please enter your name and an 11-digit mobile number." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "The password needs at least 8 characters." });
  }
  if (await User.exists({ phone })) {
    return res.status(400).json({ error: "This mobile number already has an account. Please log in." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, phone, passwordHash, role: "victim" });
  logIn(req, user);
  res.status(201).json({ user: publicUser(user) });
});

router.post("/api/login", async (req, res) => {
  const phone = (req.body.phone || "").trim();
  const user = await User.findOne({ phone });
  const passwordIsRight = user && (await bcrypt.compare(req.body.password || "", user.passwordHash));

  // Same message for both mistakes, so nobody can find out which numbers have accounts.
  if (!passwordIsRight) {
    return res.status(401).json({ error: "Phone number or password is wrong." });
  }
  logIn(req, user);
  res.json({ user: publicUser(user) });
});

router.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// The navbar asks this on every page to know which links to show.
// Nobody logged in is normal here, so the answer is { user: null }, not an error.
router.get("/api/me", async (req, res) => {
  if (!req.session.userId) {
    return res.json({ user: null });
  }
  const user = await User.findById(req.session.userId);
  if (!user) {
    return res.json({ user: null });
  }
  res.json({ user: publicUser(user) });
});

module.exports = { router, PHONE_PATTERN, publicUser };
