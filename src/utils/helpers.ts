import express from 'express';

const extractClientCredentials = (req: express.Request): { clientId?: string; clientSecret?: string } => {
    let clientId: string | undefined;
    let clientSecret: string | undefined;

    if (req.headers.authorization?.startsWith('Basic ')) {
        const base64 = req.headers.authorization.split(' ')[1];
        if (base64) {
            const [id, secret] = Buffer.from(base64, 'base64').toString().split(':');
            clientId = id;
            clientSecret = secret;
        }
    }

    const { client_id, client_secret } = req.body || {};
    clientId = clientId || client_id;
    clientSecret = clientSecret || client_secret;

    return { clientId, clientSecret };
}

const errorResponse = (res: express.Response, status: number, message: string) => {
    return res.status(status).json({ error: message });
}

const getFullUrl = (req: express.Request): string => {
    return `${req.protocol}://${req.get('host')}${req.originalUrl}`;
}

export { extractClientCredentials, errorResponse, getFullUrl };