export interface SteamAuthConfiguration {
    apiKey: string;
    realm: string;
    returnUrl: string;
    clientId: string;
    clientSecret: string;
}

export interface SteamSession {
    type: string;
}

export interface SteamCallbackSession extends SteamSession {
    type: 'callback';
    redirectUrl: string;
    state: string;
}

export interface SteamAuthSession extends SteamSession {
    type: 'auth';
    steamId: string;
    state: string;
}

export interface SteamProfileData {
    _json: any;
    steamId: string;
    username: string;
    name: string;
    profile: {
        url: string;
        background: {
            static: string | null;
            movie: string | null;
        };
        backgroundMini: {
            static: string | null;
            movie: string | null;
        };
    };
    avatar: {
        small: string;
        medium: string;
        large: string;
        animated: {
            static: string;
            movie: string;
        };
        frame: {
            static: string | null;
            movie: string | null;
        };
    };
}

export interface SteamResponse {
    playerSummary: {
        players: SteamPlayerInfo[];
    };
}

export interface SteamPlayerInfo {
    steamId: string;
    personaName: string;
    profileUrl: string;
    avatar: string;
    avatarMedium: string;
    avatarFull: string;
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
} 