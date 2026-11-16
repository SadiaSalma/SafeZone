// Put these in front of a route to say who may use it.
// req.session.userId and req.session.role are set by routes/auth.js when someone logs in.

function mustBeLoggedIn(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Please log in first." });
  }
  next();
}

function mustBeStaff(req, res, next) {
  if (req.session.role !== "verifier" && req.session.role !== "admin") {
    return res.status(403).json({ error: "Only verifiers can do this." });
  }
  next();
}

function mustBeAdmin(req, res, next) {
  if (req.session.role !== "admin") {
    return res.status(403).json({ error: "Only admins can do this." });
  }
  next();
}

module.exports = { mustBeLoggedIn, mustBeStaff, mustBeAdmin };
