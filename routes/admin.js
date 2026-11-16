// routes/admin.js: staff accounts, every report, and thana addresses and phones.
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Report = require("../models/Report");
const Thana = require("../models/Thana");
const { PHONE_PATTERN, publicUser } = require("./auth");
const { mustBeLoggedIn, mustBeAdmin } = require("../middleware/auth");

const router = express.Router();

// Every route in this file is for admins only.
router.use("/api/admin", mustBeLoggedIn, mustBeAdmin);

router.get("/api/admin/staff", async (req, res) => {
  const staff = await User.find({ role: { $in: ["verifier", "admin"] } }).sort({ createdAt: 1 });
  res.json(staff.map(publicUser));
});

router.post("/api/admin/staff", async (req, res) => {
  const name = (req.body.name || "").trim();
  const phone = (req.body.phone || "").trim();
  const password = req.body.password || "";

  if (!name || !PHONE_PATTERN.test(phone) || password.length < 8) {
    return res.status(400).json({ error: "Please enter a name, an 11-digit mobile number and a password of 8 or more characters." });
  }
  if (await User.exists({ phone })) {
    return res.status(400).json({ error: "This mobile number already has an account." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ name, phone, passwordHash, role: "verifier" });
  res.status(201).json({ ok: true });
});

router.get("/api/admin/reports", async (req, res) => {
  const reports = await Report.find()
    .select("-checks")
    .populate("thana", "nameEn nameBn")
    .sort({ createdAt: -1 });
  res.json(reports);
});

// Addresses and phones go out of date, so admins can fix them here.
router.put("/api/admin/thanas/:id", async (req, res) => {
  const thana = await Thana.findById(req.params.id);
  if (!thana) {
    return res.status(404).json({ error: "We could not find this thana." });
  }
  thana.address = (req.body.address || "").trim();
  thana.phone = (req.body.phone || "").trim();
  await thana.save();
  res.json(thana);
});

module.exports = router;
