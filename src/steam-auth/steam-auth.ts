import openid from "openid";
import { URL, URLSearchParams } from "url";

interface SteamAuthOptions {
    realm: string;
    returnUrl: string;
    apiKey: string;
}

interface SteamUserProfile {
    _json: any;
    steamid: string;
    username: string;
    name: string;
    profile: {
        url: string;
        background: {
            static: string | null;
            movie: string | null;
        };
        background_mini: {
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

const OPENID_CHECK = {
    ns: "http://specs.openid.net/auth/2.0",
    op_endpoint: "https://steamcommunity.com/openid/login",
    claimed_id: "https://steamcommunity.com/openid/id/",
    identity: "https://steamcommunity.com/openid/id/",
};

export class SteamAuth {
    private realm: string;
    private returnUrl: string;
    private apiKey: string;
    private relyingParty: any;

    constructor({ realm, returnUrl, apiKey }: SteamAuthOptions) {
        if (!realm || !returnUrl || !apiKey) {
            throw new Error(
                "Missing realm, returnURL, or apiKey parameter(s). These are required."
            );
        }

        this.realm = realm;
        this.returnUrl = returnUrl;
        this.apiKey = apiKey;
        this.relyingParty = new openid.RelyingParty(
            returnUrl,
            realm,
            true,
            true,
            []
        );
    }

    // Get redirect URL for Steam
    async getRedirectUrl(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.relyingParty.authenticate(
                "https://steamcommunity.com/openid",
                false,
                (error, authUrl) => {
                    if (error) return reject("Authentication failed: " + error);
                    if (!authUrl) return reject("Authentication failed.");

                    resolve(authUrl);
                }
            );
        });
    }

    // Fetch user information from Steam API
    async fetchIdentifier(steamOpenId: string): Promise<SteamUserProfile> {
        const steamId = steamOpenId.replace(OPENID_CHECK.claimed_id, "");
        const cdnUrl =
            "https://cdn.akamai.steamstatic.com/steamcommunity/public/images";

        try {
            const playerResponse = await fetch(
                `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${this.apiKey}&steamids=${steamId}`
            );

            const playerData = await playerResponse.json();
            const players = playerData?.response?.players;

            if (players?.length > 0) {
                const player = players[0];

                const profileItemsResponse = await fetch(
                    `https://api.steampowered.com/IPlayerService/GetProfileItemsEquipped/v1/?steamid=${steamId}`
                );

                const profileItems = await profileItemsResponse.json();
                const {
                    avatar_frame,
                    animated_avatar,
                    profile_background,
                    mini_profile_background,
                } = profileItems?.response ?? {};

                return {
                    _json: player,
                    steamid: steamId,
                    username: player.personaname,
                    name: player.realname,
                    profile: {
                        url: player.profileurl,
                        background: {
                            static: profile_background?.image_large
                                ? `${cdnUrl}/${profile_background.image_large}`
                                : null,
                            movie: profile_background?.movie_webm
                                ? `${cdnUrl}/${profile_background.movie_webm}`
                                : null,
                        },
                        background_mini: {
                            static: mini_profile_background?.image_large
                                ? `${cdnUrl}/${mini_profile_background.image_large}`
                                : null,
                            movie: mini_profile_background?.movie_webm
                                ? `${cdnUrl}/${mini_profile_background.movie_webm}`
                                : null,
                        },
                    },
                    avatar: {
                        small: player.avatar,
                        medium: player.avatarmedium,
                        large: player.avatarfull,
                        animated: {
                            static: animated_avatar?.image_large
                                ? `${cdnUrl}/${animated_avatar.image_large}`
                                : player.avatarfull,
                            movie: animated_avatar?.image_small
                                ? `${cdnUrl}/${animated_avatar.image_small}`
                                : player.avatarfull,
                        },
                        frame: {
                            static: avatar_frame?.image_large
                                ? `${cdnUrl}/${avatar_frame.image_large}`
                                : null,
                            movie: avatar_frame?.image_small
                                ? `${cdnUrl}/${avatar_frame.image_small}`
                                : null,
                        },
                    },
                };
            } else {
                throw new Error("No players found for the given SteamID.");
            }
        } catch (error: any) {
            throw new Error("Steam server error: " + error.message);
        }
    }

    // Authenticate user
    async authenticate(requestUrl: string): Promise<SteamUserProfile> {
        return new Promise((resolve, reject) => {
            // The openid library expects a raw HTTP request-like object
            const fakeRequest = {
                method: "GET",
                url: requestUrl,
                headers: {},
            };

            this.relyingParty.verifyAssertion(
                fakeRequest,
                async (error: any, result: any) => {
                    if (error) return reject(error.message);
                    if (!result || !result.authenticated)
                        return reject("Failed to authenticate user.");
                    if (
                        !/^https?:\/\/steamcommunity\.com\/openid\/id\/\d+$/.test(
                            result.claimedIdentifier
                        )
                    ) {
                        return reject("Claimed identity is not valid.");
                    }

                    try {
                        const user = await this.fetchIdentifier(
                            result.claimedIdentifier
                        );
                        resolve(user);
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });
    }
}
