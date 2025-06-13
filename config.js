module.exports = {
  SUPERSET_SECRET_KEY:
    "akuX6dAE/GwyiLHviFtz5JH28+c2zU/P0m1TvNLYeOIfC9LOO6/U5+tx", // IMPORTANT: Replace with your actual secret key
  JWT_EXPIRY: "1h", // Token expiry (e.g., 1h, 5m, 24h)
  SUPERSET_URL: "http://102.223.7.208:8090", // Your Superset instance URL
  // Define default user and resource structures for the guest token if needed,
  // or these can be fully dynamic based on request body.
  // Example structure for a guest user:
  // DEFAULT_GUEST_USER: {
  //   username: 'guest',
  //   first_name: 'Guest',
  //   last_name: 'User',
  // },
  // Example resource access (e.g., specific dashboard):
  // DEFAULT_RESOURCES: [
  //   { type: 'dashboard', id: 'your_dashboard_id' }
  // ],
  // Example RLS rules:
  // DEFAULT_RLS_RULES: [
  //   { clause: "region = 'APAC'" }
  // ]
};
