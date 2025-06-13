const express = require("express");
const jwt = require("jsonwebtoken");
const config = require("../config"); // Import configuration

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

app.post("/api/superset-guest-token", (req, res) => {
  // Destructure the required parts from the request body
  const { user, resources, rls_rules: rlsRules } = req.body;

  // Validate required fields from request body
  if (!user || typeof user !== "object" || !user.username) {
    return res
      .status(400)
      .json({
        message: 'Invalid request: "user" object with "username" is required.',
      });
  }
  if (!resources || !Array.isArray(resources)) {
    return res
      .status(400)
      .json({ message: 'Invalid request: "resources" array is required.' });
  }
  // rls_rules is optional, but if provided, should be an array
  if (rlsRules && !Array.isArray(rlsRules)) {
    return res
      .status(400)
      .json({
        message: 'Invalid request: "rls_rules" if provided, must be an array.',
      });
  }

  // Check if SUPERSET_SECRET_KEY is configured
  if (
    !config.SUPERSET_SECRET_KEY ||
    config.SUPERSET_SECRET_KEY ===
      "YOUR_SUPERSET_GUEST_TOKEN_SECRET_KEY_GOES_HERE"
  ) {
    console.error(
      "JWT generation failed: SUPERSET_SECRET_KEY is not configured or is still set to the placeholder."
    );
    return res
      .status(500)
      .json({ message: "Server configuration error: Secret key not set." });
  }

  const now = Math.floor(Date.now() / 1000);
  const expiry = config.JWT_EXPIRY || "1h"; // Default to 1 hour if not set in config

  const payload = {
    user: {
      username: user.username,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      // Superset might expect other user fields, this is a basic set
    },
    resources: resources, // e.g., [{ type: "dashboard", id: "uuid-of-dashboard" }]
    rls_rules: rlsRules || [], // e.g., [{ clause: "client_id = 123" }] or [{ type: "filter", dataset_id: 1, clause: "region = 'US'"}]
    iat: now,
    exp: now + parseExpiry(expiry), // Calculate expiry time in seconds
    // aud: config.SUPERSET_URL, // Optional: Audience claim, might be useful
    // iss: 'your-app-name',     // Optional: Issuer claim
  };

  try {
    const token = jwt.sign(payload, config.SUPERSET_SECRET_KEY, {
      algorithm: "HS256",
    });
    res.json({ token });
  } catch (error) {
    console.error("JWT signing error:", error);
    res.status(500).json({ message: "Failed to generate token." });
  }
});

// Helper function to parse expiry string (e.g., '1h', '5m') to seconds
function parseExpiry(expiryString) {
  const unit = expiryString.charAt(expiryString.length - 1);
  const value = parseInt(expiryString.slice(0, -1), 10);
  if (isNaN(value)) return 3600; // Default to 1 hour if parsing fails

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 60 * 60 * 24;
    default:
      return 3600; // Default to 1 hour
  }
}

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port \${port}`);
  console.log("Configuration loaded:");
  console.log(
    "SUPERSET_SECRET_KEY:",
    config.SUPERSET_SECRET_KEY &&
      config.SUPERSET_SECRET_KEY !==
        "YOUR_SUPERSET_GUEST_TOKEN_SECRET_KEY_GOES_HERE"
      ? "Set (masked)"
      : "Not Set or Placeholder"
  );
  console.log("JWT_EXPIRY:", config.JWT_EXPIRY);
  console.log("SUPERSET_URL:", config.SUPERSET_URL);
});

module.exports = app; // Export app for testing
