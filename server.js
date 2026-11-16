// server.js: start Express, connect to MongoDB, and plug in the routes.
require("dotenv").config({ quiet: true });
const path = require("path");
const express = require("express");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const connectToDatabase = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;
const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

// Render sits in front of the app, so trust it when it says the visit used https.
app.set("trust proxy", 1);
app.use(express.json());

// The login cookie. Sessions are saved in MongoDB, so logins survive a server restart.
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: ONE_WEEK },
}));

app.use(express.static(path.join(__dirname, "public")));
app.use(require("./routes/auth").router);
app.use(require("./routes/reports"));
app.use(require("./routes/review"));
app.use(require("./routes/public"));
app.use(require("./routes/admin"));

// Any /api address we do not know.
app.use("/api", (req, res) => res.status(404).json({ error: "Unknown address." }));

// Express 5 sends every error from an async route here. The person gets a plain sentence.
app.use((error, req, res, next) => {
  // A CastError means an id in the address is not a real MongoDB id, for example /api/areas/abc.
  if (error.name === "CastError") {
    return res.status(404).json({ error: "We could not find this." });
  }
  console.error(error);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

connectToDatabase().then(() => {
  app.listen(PORT, () => console.log(`SafeZone running at http://localhost:${PORT}`));
});
