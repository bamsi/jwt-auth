const request = require('supertest');
const jwt = require('jsonwebtoken'); // To decode the token for verification
const app = require('./server'); // Assuming server.js exports the app for testing
const config = require('../config');

// Store original config values to restore after tests
const originalSupersetSecretKey = config.SUPERSET_SECRET_KEY;
const originalJwtExpiry = config.JWT_EXPIRY;

describe('Superset Guest Token API (/api/superset-guest-token)', () => {
  let server;

  beforeAll((done) => {
    // It's better if server.js exports the app instance directly
    // and we start/stop the server here.
    // For now, let's assume server.js starts listening.
    // If app is not exported from server.js, this test structure needs adjustment.
    // Let's modify server.js to export app for testing purposes if not already done.
    // This subtask will assume 'app' is the express app instance from server.js.
    // If server.js directly calls app.listen, supertest can often still attach to it.
    // server = app.listen(3001, done); // Use a different port for testing
    // For this example, we'll try to require the app directly.
    // The server.js provided in previous steps directly calls app.listen().
    // Supertest can take the 'app' instance before listen is called, or a path to the file.
    // Let's ensure server.js exports 'app' for clarity.
    done();
  });

  afterAll((done) => {
    // if (server) {
    //   server.close(done);
    // } else {
    //   done();
    // }
    // Restore original config
    config.SUPERSET_SECRET_KEY = originalSupersetSecretKey;
    config.JWT_EXPIRY = originalJwtExpiry;
    done();
  });

  beforeEach(() => {
    // Reset config to a known state before each test
    config.SUPERSET_SECRET_KEY = 'test-secret-key'; // Use a consistent test key
    config.JWT_EXPIRY = '5m';
  });

  it('should return a JWT token for a valid request', async () => {
    const requestBody = {
      user: { username: 'testguest', first_name: 'Test', last_name: 'Guest' },
      resources: [{ type: 'dashboard', id: 'dashboard-123' }],
      rls_rules: [{ clause: "region = 'test'" }],
    };

    const response = await request(app) // 'app' should be the express app from server.js
      .post('/api/superset-guest-token')
      .send(requestBody)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('token');
    expect(typeof response.body.token).toBe('string');

    // Decode token to verify payload (without signature verification)
    const decodedToken = jwt.decode(response.body.token);
    expect(decodedToken).toHaveProperty('user');
    expect(decodedToken.user.username).toBe('testguest');
    expect(decodedToken.resources[0].id).toBe('dashboard-123');
    expect(decodedToken.rls_rules[0].clause).toBe("region = 'test'");
    expect(decodedToken).toHaveProperty('iat');
    expect(decodedToken).toHaveProperty('exp');
  });

  it('should return 400 if user field is missing', async () => {
    const requestBody = {
      // user: { username: 'testguest' }, // Missing user
      resources: [{ type: 'dashboard', id: 'dashboard-123' }],
    };

    const response = await request(app)
      .post('/api/superset-guest-token')
      .send(requestBody)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('message', 'Invalid request: "user" object with "username" is required.');
  });

  it('should return 400 if resources field is missing', async () => {
    const requestBody = {
      user: { username: 'testguest' },
      // resources: [{ type: 'dashboard', id: 'dashboard-123' }], // Missing resources
    };

    const response = await request(app)
      .post('/api/superset-guest-token')
      .send(requestBody)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('message', 'Invalid request: "resources" array is required.');
  });

  it('should return 500 if SUPERSET_SECRET_KEY is not configured (is placeholder)', async () => {
    config.SUPERSET_SECRET_KEY = 'YOUR_SUPERSET_GUEST_TOKEN_SECRET_KEY_GOES_HERE'; // Simulate placeholder
    const requestBody = {
      user: { username: 'testguest' },
      resources: [{ type: 'dashboard', id: 'dashboard-123' }],
    };

    const response = await request(app)
      .post('/api/superset-guest-token')
      .send(requestBody)
      .expect('Content-Type', /json/)
      .expect(500);

    expect(response.body).toHaveProperty('message', 'Server configuration error: Secret key not set.');
  });

  it('should return 500 if SUPERSET_SECRET_KEY is null or empty', async () => {
    config.SUPERSET_SECRET_KEY = null; // Simulate missing key
    const requestBody = {
      user: { username: 'testguest' },
      resources: [{ type: 'dashboard', id: 'dashboard-123' }],
    };

    const response = await request(app)
      .post('/api/superset-guest-token')
      .send(requestBody)
      .expect('Content-Type', /json/)
      .expect(500);

    expect(response.body).toHaveProperty('message', 'Server configuration error: Secret key not set.');
  });
});
