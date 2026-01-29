/**
 * [SWARM COMPONENT] - Token Intelligence Cache
 * Prevents redundant authentication calls to Hacienda IDP.
 */

interface CachedToken {
    token: string;
    expiresAt: number;
}

const GLOBAL_TOKEN_CACHE: Record<string, CachedToken> = {};

export class TokenCache {
    /**
     * Retrieves a valid token from memory or returns null if expired/missing.
     */
    static get(username: string): string | null {
        const cached = GLOBAL_TOKEN_CACHE[username];
        if (!cached) return null;

        // Buffer of 30 seconds to be safe
        if (Date.now() > cached.expiresAt - 30000) {
            delete GLOBAL_TOKEN_CACHE[username];
            return null;
        }

        return cached.token;
    }

    /**
     * Saves a token with its specific expiration time.
     */
    static set(username: string, token: string, expiresIn: number) {
        GLOBAL_TOKEN_CACHE[username] = {
            token,
            expiresAt: Date.now() + (expiresIn * 1000)
        };
    }
}
