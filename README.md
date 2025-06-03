# Express Steam Provider

A Simple Node.js Express application that provides Steam authentication and API integration services. This middleware implements OAuth 2.0-like flow for Steam authentication, allowing applications to authenticate users through their Steam accounts.

## Prerequisites

- Node.js 20.x or later
- Docker and Docker Compose (optional)
- Steam API Key (obtain from [Steam Web API](https://steamcommunity.com/dev/apikey))

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Port number for the server | 3000 |
| STEAM_API_KEY | Your Steam Web API Key | XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX |
| REALM | Base URL of your application | http://localhost:3000 |
| RETURN_URL | OAuth return URL | http://localhost:3000/auth/steam/authenticate |
| JWT_SECRET | The Secret used when creating JWTs | JwtSecret |
| CLIENT_ID | The ID used for authenticating into the Middleware | ClientId |
| CLIENT_SECRET | The Secret used for authenticating into the Middleware | ClientSecret |

## API Endpoints

### Base Endpoints

#### GET /
- Description: Health check endpoint
- Response: Simple text indicating the API is running
- Example Response: `Steam Auth API is running`

#### GET /health
- Description: Detailed health check endpoint
- Response: JSON object with configuration status
- Example Response:
  ```json
  {
    "status": "healthy",
    "timestamp": "2024-02-20T12:00:00Z",
    "config": {
      "steamApiKey": "configured",
      "realm": "configured",
      "returnUrl": "configured",
      "clientId": "configured",
      "clientSecret": "configured",
      "jwtSecret": "configured"
    }
  }
  ```

### Authentication Endpoints

All authentication endpoints are prefixed with `/auth/steam`

#### 1. GET /auth/steam/authorize
- Description: Initiates the Steam authentication flow
- Query Parameters:
  - `state`: (Required) Random string to prevent CSRF
  - `redirect_uri`: (Required) Where to redirect after authentication
- Response: Redirects to Steam login page

#### 2. GET /auth/steam/callback
- Description: Handles the Steam authentication callback
- Query Parameters:
  - `session_key`: (Required) Session identifier
- Response: Redirects to the original redirect_uri with:
  - Success: `?code={auth_code}&state={original_state}`
  - Error: `?error=authentication_failed&error_description={message}&state={original_state}`

#### 3. POST /auth/steam/token
- Description: Exchanges authorization code for access token
- Authentication: Basic Auth or Body Parameters with client credentials
- Request Body:
  ```json
  {
    "code": "authorization_code",
    "client_id": "your_client_id",     // Optional if using Basic Auth
    "client_secret": "your_client_secret" // Optional if using Basic Auth
  }
  ```
- Response:
  ```json
  {
    "access_token": "jwt_token",
    "token_type": "Bearer",
    "expires_in": 3600
  }
  ```

#### 4. GET /auth/steam/userinfo
- Description: Retrieves authenticated user's Steam profile
- Authentication: Bearer token required
- Headers:
  - `Authorization: Bearer {access_token}`
- Response: Steam user profile information

## Installation

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the required environment variables
4. Build the TypeScript code:
   ```bash
   npm run build
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

### Docker Development

1. Clone the repository
2. Create a `.env` file with the required environment variables or add them to the Environment section in the compose.
3. Build and run using Docker Compose:
   ```bash
   docker-compose up --build
   ```

## Project Structure

```
.
├── src/
│   ├── utils/
│   │   └── helpers.ts
│   ├── providers/
│   │   └── steam-auth-provider.ts
│   ├── routes/
│   │   └── steam-routes.ts
│   └── index.ts
├── dist/           # Compiled JavaScript files
├── Dockerfile
├── docker-compose.yml
├── tsconfig.json
└── package.json
```

## Scripts

- `npm run build`: Compile TypeScript to JavaScript
- `npm run start`: Start the production server
- `npm run dev`: Start the development server with hot-reload

## Docker Configuration

The application uses a multi-stage Docker build process for optimal production images:

### Development Mode
- Uses Node.js 20 Alpine base image
- Hot-reload enabled with volume mounts
- All dependencies installed for development
- Source code mounted for live updates

### Production Mode
- Minimal production image
- Only production dependencies included
- Built TypeScript code only
- Non-root user for security
- Health check monitoring
- Resource limits available

### Environment Configuration
- All environment variables configurable via docker-compose
- Default values provided for development
- Secure secrets management
- Health monitoring included

## TypeScript Configuration

The project uses a comprehensive TypeScript configuration with the following features:

### Compilation Settings
- Target: ES2020
- Module: CommonJS
- Source Maps enabled
- Declaration files generated
- Line endings normalized (LF)

### Type Checking
- Strict mode enabled
- Unused code checking
- Implicit returns checked
- Switch case fallthrough prevention
- Index access checking
- Unreachable code detection

### Module Resolution
- Node.js resolution strategy
- JSON module support
- ES Module interop enabled
- Consistent casing enforced
- Base URL configured

### Development Experience
- Source maps for debugging
- Declaration files for better IDE support
- Strict null checks
- Unused code detection
- Comprehensive error checking

## Security Considerations

- Uses JWT for secure token generation
- Implements state parameter to prevent CSRF attacks
- Validates client credentials
- Supports both Basic Auth and form-based authentication
- Session management for authentication flow
- HTTPS recommended for production use
- Docker security features:
  - Non-root user
  - No privilege escalation
  - Resource limits
  - Health monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License