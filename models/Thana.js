const mongoose = require("mongoose");

// One of the 49 DMP police stations. Loaded by seed.js from data/thanas.json.
const thanaSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  nameEn: { type: String, required: true },
  nameBn: { type: String, required: true },
  stationEn: String,
  stationBn: String,
  // A GeoJSON point [lng, lat] where the station is.
  location: { type: { type: String, default: "Point" }, coordinates: [Number] },
  address: String,
  phone: String,
});

// Lets $near find the thana closest to a point.
thanaSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Thana", thanaSchema);
