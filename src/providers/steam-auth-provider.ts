import type { SteamAuthConfiguration, SteamProfileData } from '../types';
import axios from 'axios';

const OPENID = {
    NS: 'http://specs.openid.net/auth/2.0',
    IDENTITY: 'http://specs.openid.net/auth/2.0/identifier_select',
    CLAIMED_ID_PREFIX: 'https://steamcommunity.com/openid/id/',
    OP_ENDPOINT: 'https://steamcommunity.com/openid/login'
} as const;

export class SteamAuthProvider {
    private readonly config: SteamAuthConfiguration;
    private readonly logger = console;

    constructor(config: SteamAuthConfiguration) {
        this.config = config;
    }

    getRedirectUrl(sessionKey: string): string {
        const returnUrl = `${this.config.returnUrl}?session_key=${encodeURIComponent(sessionKey)}`;
        const params = new URLSearchParams({
            'openid.ns': OPENID.NS,
            'openid.mode': 'checkid_setup',
            'openid.return_to': returnUrl,
            'openid.realm': this.config.realm,
            'openid.identity': OPENID.IDENTITY,
            'openid.claimed_id': OPENID.IDENTITY
        });

        return `${OPENID.OP_ENDPOINT}?${params.toString()}`;
    }

    async authenticate(requestUrl: string): Promise<SteamProfileData> {
        const url = new URL(requestUrl);
        const params = Object.fromEntries(url.searchParams.entries());

        const claimedId = params['openid.claimed_id'];
        const sessionKey = params['session_key'];

        if (!claimedId || !sessionKey) {
            throw new Error('Missing openid.claimed_id or session_key in callback.');
        }

        const returnUrl = `${this.config.returnUrl}?session_key=${sessionKey}`;
        params['openid.return_to'] = returnUrl;
        params['openid.mode'] = 'check_authentication';

        const formData = new URLSearchParams(params);

        try {
            const response = await axios.post(OPENID.OP_ENDPOINT, formData.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            if (!response.data.includes('is_valid:true')) {
                throw new Error('Invalid Steam OpenID response.');
            }

            if (!this.isValidClaimedId(claimedId)) {
                throw new Error('Invalid claimed_id format (not a valid SteamID).');
            }

            return this.fetchProfileData(claimedId);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error during authentication';
            this.logger.error('Steam authentication failed:', message);
            throw new Error(`Steam authentication failed: ${message}`);
        }
    }

    async getUserProfile(steamId: string): Promise<SteamProfileData> {
        return this.fetchProfileData(`https://steamcommunity.com/openid/id/${steamId}`);
    }
    

    private isValidClaimedId(claimedId: string): boolean {
        return claimedId.startsWith(OPENID.CLAIMED_ID_PREFIX) && /^\d+$/.test(claimedId.replace(OPENID.CLAIMED_ID_PREFIX, ''));
    }
    
    private async fetchProfileData(steamOpenId: string): Promise<any> {
        const steamId = steamOpenId.replace(OPENID.CLAIMED_ID_PREFIX, '');
        const apiKey = this.config.apiKey;
        const cdnBase = 'https://cdn.akamai.steamstatic.com/steamcommunity/public/images';
    
        try {
            const [playerSummary, profileItems] = await Promise.all([
                this.getPlayerSummary(steamId, apiKey),
                this.getProfileItems(steamId)
            ]);
    
            const player = playerSummary;
            const items = profileItems;
            
            // Flattened for Clerk
            const flatProfile = {
                steamId,
                sub: steamId,
                username: player.personaname,
                name: player.personaname,
                avatarSmall: player.avatar,
                avatarMedium: player.avatarmedium,
                avatarLarge: player.avatarfull,
                profileUrl: player.profileurl,
                backgroundStatic: items?.profile_background?.image_large ? `${cdnBase}/${items.profile_background.image_large}` : null,
                backgroundMovie: items?.profile_background?.movie_webm ? `${cdnBase}/${items.profile_background.movie_webm}` : null,
            };
    
            this.logger.info(`Fetched Steam profile for ${flatProfile.username}`);
            return flatProfile;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error fetching profile';
            throw new Error(`Steam profile fetch error: ${message}`);
        }
    }

    private async getPlayerSummary(steamId: string, apiKey: string) {
        const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`;
        const { data } = await axios.get(url);
        const players = data?.response?.players;
        if (!players || players.length === 0) {
            throw new Error('No player found for the given SteamID.');
        }
        return players[0];
    }

    private async getProfileItems(steamId: string) {
        const url = `https://api.steampowered.com/IPlayerService/GetProfileItemsEquipped/v1/?steamid=${steamId}`;
        const { data } = await axios.get(url);
        return data?.response || {};
    }
} 
