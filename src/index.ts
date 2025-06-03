import express from "express";
import dotenv from "dotenv";
import { SteamAuthProvider } from "./providers/steam-auth-provider";
import { createSteamAuthRouter } from "./routes/steam-routes";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

const {
    STEAM_API_KEY,
    REALM,
    RETURN_URL,
    CLIENT_ID,
    CLIENT_SECRET,
    JWT_SECRET,
    PORT = 3000,
} = process.env;

app.get('/', (req, res) => res.send('Steam Auth API is running'));
app.get('/health', (req, res) => {
    const isHealthy = STEAM_API_KEY && REALM && RETURN_URL && CLIENT_ID && CLIENT_SECRET && JWT_SECRET;
    res.json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        config: {
            steamApiKey: STEAM_API_KEY ? 'configured' : 'missing',
            realm: REALM ? 'configured' : 'missing',
            returnUrl: RETURN_URL ? 'configured' : 'missing',
            clientId: CLIENT_ID ? 'configured' : 'missing',
            clientSecret: CLIENT_SECRET ? 'configured' : 'missing',
            jwtSecret: JWT_SECRET ? 'configured' : 'missing'
        }
    });
});

if (!STEAM_API_KEY || !REALM || !RETURN_URL || !CLIENT_ID || !CLIENT_SECRET || !JWT_SECRET) {
    console.error("Missing required environment variables.");
} else {
    const steamProvider = new SteamAuthProvider({
        apiKey: STEAM_API_KEY,
        realm: REALM,
        returnUrl: RETURN_URL,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET
    });
    app.use('/auth/steam', createSteamAuthRouter(steamProvider, { CLIENT_ID, CLIENT_SECRET, JWT_SECRET }));
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
