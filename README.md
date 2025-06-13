# Superset Guest Token Generator API

This Node.js application provides a simple API endpoint to generate JWT (JSON Web Tokens) suitable for authenticating guest users with the Apache Superset Embedded SDK.

## Features

- Generates JWTs compatible with Superset's guest token authentication.
- Configurable secret key and token expiry.
- Expects user, resource, and RLS (Row Level Security) information in the request payload.

## Prerequisites

- Node.js (v14.x or later recommended)
- npm (Node Package Manager)

## Setup and Installation

1.  **Clone the repository (if applicable) or download the files.**

2.  **Navigate to the project directory:**
    \`\`\`bash
    cd path/to/your/project
    \`\`\`

3.  **Install dependencies:**
    \`\`\`bash
    npm install
    \`\`\`

4.  **Configuration:**
    The application uses a `config.js` file for its core configuration. However, it's **highly recommended** to manage your `SUPERSET_SECRET_KEY` via environment variables for security.

    *   **`SUPERSET_SECRET_KEY` (Required):** This is the most critical setting. It **must** be the same secret key that your Superset instance is configured to use for guest token authentication. In Superset's `superset_config.py`, this is typically set via `GUEST_TOKEN_JWT_SECRET`.
        *   You can set this as an environment variable:
            \`\`\`bash
            export SUPERSET_SECRET_KEY="your_actual_superset_secret_key"
            \`\`\`
        *   Alternatively, you can modify `config.js` directly, but this is less secure for production:
            \`\`\`javascript
            // config.js
            module.exports = {
              SUPERSET_SECRET_KEY: 'your_actual_superset_secret_key',
              // ... other settings
            };
            \`\`\`
            **Warning:** If `SUPERSET_SECRET_KEY` is not set or remains the default placeholder in `config.js`, the API will return a 500 error.

    *   **`JWT_EXPIRY` (Optional):** Defines how long the generated JWTs are valid. Defaults to `'1h'` (1 hour) if not set in `config.js`.
        *   Examples: `'5m'` (5 minutes), `'2h'` (2 hours), `'1d'` (1 day).
        *   Modify in `config.js`:
            \`\`\`javascript
            // config.js
            module.exports = {
              // ...
              JWT_EXPIRY: '30m', // Set token expiry to 30 minutes
              // ...
            };
            \`\`\`

    *   **`SUPERSET_URL` (Optional):** Your Superset instance URL. This is included in `config.js` primarily for reference or if you plan to extend the application to use it (e.g., in the `aud` claim of the JWT). It's not strictly used by the current token generation logic beyond that.

## Running the Server

Once dependencies are installed and configuration is set up (especially `SUPERSET_SECRET_KEY`):

\`\`\`bash
npm start
\`\`\`

The server will typically start on port 3000, unless the `PORT` environment variable is set.
You should see output similar to:
\`\`\`
Server running on port 3000
Configuration loaded:
SUPERSET_SECRET_KEY: Set (masked)
JWT_EXPIRY: 1h
SUPERSET_URL: http://localhost:8088
\`\`\`

## API Endpoint: `/api/superset-guest-token`

-   **Method:** `POST`
-   **Content-Type:** `application/json`
-   **Description:** Generates a Superset guest token.

### Request Body Structure

The endpoint expects a JSON payload with the following structure:

\`\`\`json
{
  "user": {
    "username": "guest_user_example",
    "first_name": "Guest",        // Optional
    "last_name": "User Example"   // Optional
  },
  "resources": [
    {"type": "dashboard", "id": "your_dashboard_uuid_1"},
    // You can add more resources, e.g., another dashboard or a chart
    // {"type": "chart", "id": "your_chart_id"}
  ],
  "rls_rules": [                  // Optional
    {"clause": "region = 'APAC'"},
    // Example specifying a dataset for the RLS rule:
    // {"dataset": 123, "clause": "company_id = 456"}
  ]
}
\`\`\`

-   **`user` (object, required):**
    -   `username` (string, required): The username for the guest session.
    -   `first_name` (string, optional): First name of the guest user.
    -   `last_name` (string, optional): Last name of the guest user.
-   **`resources` (array, required):** An array of objects defining the Superset resources the guest user can access.
    -   `type` (string, required): The type of resource (e.g., "dashboard", "chart").
    -   `id` (string, required): The UUID or ID of the resource.
-   **`rls_rules` (array, optional):** An array of Row Level Security rules to apply for this guest session.
    -   `clause` (string, required): The RLS filter condition (e.g., `status = 'active'`, `user_group = 'Finance'`).
    -   `dataset` (integer, optional): The ID of the dataset the RLS rule applies to. If omitted, the rule might be applied globally or to all resources where applicable by Superset.

### Example `curl` Request

\`\`\`bash
curl -X POST \
  http://localhost:3000/api/superset-guest-token \
  -H 'Content-Type: application/json' \
  -d '{
    "user": {
      "username": "embedded_guest_1",
      "first_name": "Embedded",
      "last_name": "Guest"
    },
    "resources": [
      {"type": "dashboard", "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef"}
    ],
    "rls_rules": [
      {"clause": "customer_id = 1001"}
    ]
  }'
\`\`\`

### Successful Response (200 OK)

\`\`\`json
{
  "token": "your.generated.jwt.here"
}
\`\`\`

### Error Responses

-   **400 Bad Request:** If the request body is missing required fields or is malformed.
    \`\`\`json
    {
      "message": "Invalid request: \"user\" object with \"username\" is required."
    }
    \`\`\`
-   **500 Internal Server Error:** If the `SUPERSET_SECRET_KEY` is not configured or if there's an issue during token generation.
    \`\`\`json
    {
      "message": "Server configuration error: Secret key not set."
    }
    \`\`\`
    or
    \`\`\`json
    {
      "message": "Failed to generate token."
    }
    \`\`\`

## Superset Configuration (Brief)

To use guest tokens generated by this API, you need to configure your Superset instance:

1.  **Enable Embedded Dashboards:** Ensure the `EMBEDDED_SUPERSET` feature flag is enabled in `superset_config.py`.
2.  **Configure Guest Token Authentication:**
    In `superset_config.py`, set `GUEST_TOKEN_JWT_SECRET` to the **exact same secret key** you are using in this application's `SUPERSET_SECRET_KEY`.
    \`\`\`python
    # superset_config.py
    GUEST_TOKEN_JWT_SECRET = "your_actual_superset_secret_key" # Must match this app's config
    FEATURE_FLAGS = {
        "EMBEDDED_SUPERSET": True,
        "ENABLE_EXPLORE_JSON_CSRF_PROTECTION": False, # May be needed depending on Superset version and setup for embedded
    }

    # Define a function that Superset will call to fetch the guest token.
    # This function would typically make a request to this Node.js service.
    # For example (conceptual):
    #
    # import requests
    # def my_guest_token_provider(user_identifier, resources, rls_rules):
    #     payload = {
    #         "user": {"username": user_identifier},
    #         "resources": resources,
    #         "rls_rules": rls_rules
    #     }
    #     response = requests.post("http://localhost:3000/api/superset-guest-token", json=payload)
    #     response.raise_for_status() # Raise an exception for bad status codes
    #     return response.json()["token"]
    #
    # GUEST_TOKEN_JWT_PROVIDERS = {
    #    "my_async_guest_token": my_guest_token_provider # Your custom provider
    # }
    #
    # Then, when embedding, you specify this provider.
    \`\`\`
    Refer to the official [Superset Embedded SDK documentation](https://superset.apache.org/docs/embedded-sdk) for detailed instructions on configuring the guest token, the `guest_token` function, and embedding dashboards. The exact mechanism for how Superset calls out to get the token (the `guest_token_provider` function) needs to be implemented within your Superset environment or a proxy layer. This Node.js app *provides* the token endpoint that such a function would call.

## Development

(Optional: Add any development-specific notes here if needed, e.g., linting, testing commands)
