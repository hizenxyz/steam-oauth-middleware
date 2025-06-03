# Express Steam Provider

A Node.js Express application that provides Steam authentication and API integration services.

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
| JWT_SECRET | The Secret when creating JWTs | JWT_SECRET |
| CLIENT_ID | The ID used for authenticating into the Middleware | ClientId |
| CLIENT_SECRET | The Secret used for authenticating into the Middleware | ClientSecret |

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
2. Create a `.env` file with the required environment variables
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
│   └── ...
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
- `npm run test`: Run tests (if configured)

## Docker Configuration

The application includes Docker support with the following features:
- Node.js 20 Alpine-based image for minimal size
- Development mode with hot-reload
- Volume mounts for local development
- Exposed port 3000

## TypeScript Configuration

The project uses TypeScript with the following key configurations:
- Target: ES2020
- Module: CommonJS
- Strict type checking enabled
- ESM interop enabled
- Declaration files generated
- Source directory: ./src
- Output directory: ./dist

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request