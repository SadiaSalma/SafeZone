// routes/public.js: what everyone can see. Only approved reports, and never names or GD numbers.
// Step 5 of "Follow one report" (see README).
const express = require("express");
const Thana = require("../models/Thana");
const Report = require("../models/Report");
const Alert = require("../models/Alert");

const router = express.Router();
const ONE_DAY = 24 * 60 * 60 * 1000;

router.get("/api/thanas", async (req, res) => {
  const thanas = await Thana.find().sort({ nameEn: 1 });
  res.json(thanas);
});

// The latest alerts, for the whole city or one thana (?thana=ID).
router.get("/api/alerts", async (req, res) => {
  const filter = {};
  if (req.query.thana) {
    filter.thana = req.query.thana;
  }
  const alerts = await Alert.find(filter)
    .select("message theftType thana createdAt")
    .populate("thana", "nameEn nameBn")
    .sort({ createdAt: -1 })
    .limit(30);
  res.json(alerts);
});

// Points for the public map. Only publicPlace (moved about 150 m) is sent, never place.
router.get("/api/map", async (req, res) => {
  const days = Math.min(Number(req.query.days) || 30, 365);
  const filter = { status: "approved", happenedAt: { $gte: new Date(Date.now() - days * ONE_DAY) } };
  if (req.query.type) {
    filter.theftType = String(req.query.type);
  }
  const thefts = await Report.find(filter)
    .select("theftType happenedAt publicPlace thana")
    .populate("thana", "nameEn nameBn");
  res.json(thefts);
});

// Dhaka is 6 hours ahead of UTC all year (no daylight saving), and the server may run in UTC.
function dhakaHour(date) {
  return (date.getUTCHours() + 6) % 24;
}

// Numbers for one area: thefts in the last 30 days, by type and by hour of day.
router.get("/api/areas/:id", async (req, res) => {
  const thana = await Thana.findById(req.params.id);
  if (!thana) {
    return res.status(404).json({ error: "We could not find this area." });
  }

  const recent = await Report.find({
    thana: thana._id,
    status: "approved",
    happenedAt: { $gte: new Date(Date.now() - 30 * ONE_DAY) },
  }).select("theftType happenedAt");

  const byType = {};
  const byHour = new Array(24).fill(0);
  for (const report of recent) {
    byType[report.theftType] = (byType[report.theftType] || 0) + 1;
    byHour[dhakaHour(report.happenedAt)] += 1;
  }

  const alerts = await Alert.find({ thana: thana._id }).select("message createdAt").sort({ createdAt: -1 }).limit(5);
  res.json({ thana, total: recent.length, byType, byHour, alerts });
});

module.exports = router;
