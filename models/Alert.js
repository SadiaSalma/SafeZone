const mongoose = require("mongoose");

// Made when a verifier approves a report. Shown on the home page and the area page.
const alertSchema = new mongoose.Schema({
  report: { type: mongoose.Schema.Types.ObjectId, ref: "Report", required: true },
  thana: { type: mongoose.Schema.Types.ObjectId, ref: "Thana", required: true },
  theftType: { type: String, required: true },
  message: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Alert", alertSchema);
