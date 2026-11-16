const mongoose = require("mongoose");

// A person who can log in. Victims sign up themselves; verifiers are added by an admin.
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["victim", "verifier", "admin"], default: "victim" },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
