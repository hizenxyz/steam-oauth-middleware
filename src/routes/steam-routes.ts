import express, { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { sessionStore } from '../store/session-store';
import { SteamAuthProvider } from '../providers/steam-auth-provider';
import type { SteamCallbackSession, SteamAuthSession, TokenResponse } from '../types';
import { errorResponse, extractClientCredentials, getFullUrl } from '../utils/helpers';

interface SteamAuthConfig {
    CLIENT_ID: string;
    CLIENT_SECRET: string;
    JWT_SECRET: string;
}

export const createSteamAuthRouter = (steamProvider: SteamAuthProvider, config: SteamAuthConfig): Router => {
    const router = express.Router();
    const { CLIENT_ID, CLIENT_SECRET, JWT_SECRET } = config;

    // 1. /authorize
    router.get('/authorize', (req, res): void | express.Response => {
        const { state, redirect_uri } = req.query;
        if (!state || !redirect_uri) {
            console.warn('Missing state or redirect_uri');
            return errorResponse(res, 400, 'Missing state or redirect_uri');
        }

        const sessionId = uuidv4();
        const steamCallbackData: SteamCallbackSession = {
            type: 'callback',
            redirectUrl: redirect_uri as string,
            state: state as string
        };

        if (!sessionStore.set(sessionId, steamCallbackData)) {
            console.error('Failed to store session');
            return errorResponse(res, 400, 'Failed to store session');
        }

        const redirectUrl = steamProvider.getRedirectUrl(sessionId);
        console.info('Redirecting to Steam:', redirectUrl);
        res.redirect(redirectUrl);
    });

    // 2. /callback
    router.get('/callback', async (req, res): Promise<void | express.Response> => {
        const { session_key } = req.query;
        if (!session_key || typeof session_key !== 'string') {
            return errorResponse(res, 400, 'Missing session_key');
        }

        const session = sessionStore.getAndRemove<SteamCallbackSession>(session_key);
        if (!session) {
            console.warn('Invalid session_key:', session_key);
            return errorResponse(res, 400, 'Invalid session_key');
        }

        try {
            const user = await steamProvider.authenticate(getFullUrl(req));
            const code = uuidv4();
            const steamAuthData: SteamAuthSession = {
                type: 'auth',
                steamId: user.steamId,
                state: session.state
            };

            if (!sessionStore.set(code, steamAuthData)) {
                console.error('Failed to store auth session');
                return errorResponse(res, 400, 'Failed to store auth session');
            }

            const finalRedirect = `${session.redirectUrl}?${new URLSearchParams({ code, state: session.state }).toString()}`;
            console.info('Redirecting to:', finalRedirect);
            res.redirect(finalRedirect);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('Steam authentication failed:', message);
            const errorParams = new URLSearchParams({
                error: 'authentication_failed',
                error_description: message,
                state: session.state
            });
            res.redirect(`${session.redirectUrl}?${errorParams.toString()}`);
        }
    });

    // 3. /token
    router.post('/token', async (req, res): Promise<express.Response> => {
        try {
            const { clientId, clientSecret } = extractClientCredentials(req);
            const code = req.body?.code;

            if (clientId !== CLIENT_ID || clientSecret !== CLIENT_SECRET) {
                console.warn('Invalid client credentials:', clientId);
                return errorResponse(res, 401, 'Invalid client credentials');
            }

            if (typeof code !== 'string' || !code.trim()) {
                return errorResponse(res, 400, 'Invalid code');
            }

            const session = sessionStore.getAndRemove<SteamAuthSession>(code);
            if (!session) {
                console.warn('Invalid or expired code:', code);
                return errorResponse(res, 400, 'Invalid or expired code');
            }

            const token = jwt.sign({ steamId: session.steamId }, JWT_SECRET, { expiresIn: '1h' });
            const response: TokenResponse = {
                access_token: token,
                token_type: 'Bearer',
                expires_in: 3600
            };

            console.info(`Token issued for Steam ID: ${session.steamId}`);
            return res.json(response);
        } catch (err: unknown) {
            console.error('Token endpoint error:', err);
            return errorResponse(res, 500, 'Internal server error');
        }
    });

    // 4. /userinfo
    router.get('/userinfo', async (req, res): Promise<express.Response> => {
        const auth = req.headers.authorization;
        if (!auth?.startsWith('Bearer ')) {
            return errorResponse(res, 401, 'Missing or invalid token');
        }

        const token = auth.slice(7);
        try {
            const payload = jwt.verify(token, JWT_SECRET) as { steamId: string };
            const user = await steamProvider.getUserProfile(payload.steamId);
            return res.json(user);
        } catch (err) {
            console.error('JWT verification failed:', err);
            return errorResponse(res, 401, 'Invalid token');
        }
    });

    return router;
}; 