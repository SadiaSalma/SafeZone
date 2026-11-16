const mongoose = require("mongoose");

// Connect once when the server starts. The address comes from the .env file.
async function connectToDatabase() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");
}

module.exports = connectToDatabase;
