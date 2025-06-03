import { SteamSession } from '../types';

class SessionStore {
    private sessions = new Map<string, SteamSession>();

    set<T extends SteamSession>(sessionId: string, data: T): boolean {
        if (this.sessions.has(sessionId)) {
            return false;
        }
        this.sessions.set(sessionId, data);
        return true;
    }

    get<T extends SteamSession>(sessionId: string): T | undefined {
        return this.sessions.get(sessionId) as T | undefined;
    }

    getAndRemove<T extends SteamSession>(sessionId: string): T | undefined {
        const session = this.get<T>(sessionId);
        if (session) {
            this.sessions.delete(sessionId);
        }
        return session;
    }

    remove(sessionId: string): boolean {
        return this.sessions.delete(sessionId);
    }

    has(sessionId: string): boolean {
        return this.sessions.has(sessionId);
    }

    clear(): void {
        this.sessions.clear();
    }
}

export const sessionStore = new SessionStore(); 