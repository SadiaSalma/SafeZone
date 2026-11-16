// seed.js: load the 49 thanas and make the first admin. Safe to run more than once.
// Run: node seed.js
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectToDatabase = require("./database");
const Thana = require("./models/Thana");
const User = require("./models/User");
const thanas = require("./data/thanas.json");

async function loadThanas() {
  for (const thana of thanas) {
    // upsert: add the thana if it is new, update it if it is already there.
    await Thana.updateOne({ code: thana.code }, thana, { upsert: true });
  }
  console.log(`Loaded ${thanas.length} thanas`);
}

async function makeFirstAdmin() {
  const phone = process.env.ADMIN_PHONE;
  const password = process.env.ADMIN_PASSWORD;
  if (!phone || !password) {
    console.log("No ADMIN_PHONE / ADMIN_PASSWORD in .env, so no admin was made.");
    return;
  }
  if (await User.findOne({ phone })) {
    console.log("The admin already exists");
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ name: "Admin", phone, passwordHash, role: "admin" });
  console.log(`Made the admin account for ${phone}`);
}

async function seed() {
  await connectToDatabase();
  await loadThanas();
  await makeFirstAdmin();
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
