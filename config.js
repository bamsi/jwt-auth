module.exports = {
  SUPERSET_SECRET_KEY: 'YOUR_SUPERSET_GUEST_TOKEN_SECRET_KEY_GOES_HERE', // IMPORTANT: Replace with your actual secret key
  JWT_EXPIRY: '1h', // Token expiry (e.g., 1h, 5m, 24h)
  SUPERSET_URL: 'http://localhost:8088', // Your Superset instance URL
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
