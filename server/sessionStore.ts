export interface ServerSession {
  sessionId: string;
  email: string;
  url: string;
  tenantId: string;
  createdAt: number;
  lastAccessed: number;
  isActive: boolean;
  metadata: {
    totalItemsExpected: number;
    totalItemsFetched: number;
    pagesExpected: number;
    pagesFetched: number[];
    startTime: number;
    endTime?: number;
  };
}

class ServerSessionStore {
  private sessions = new Map<string, ServerSession>();

  createSession(email: string, url: string, customSessionId?: string, tenantId?: string): ServerSession {
    const sessionId = customSessionId || `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const session: ServerSession = {
      sessionId,
      email: (email || '').trim().toLowerCase(),
      url: (url || '').trim(),
      tenantId: tenantId || `tenant-${Date.now()}`,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      isActive: true,
      metadata: {
        totalItemsExpected: 0,
        totalItemsFetched: 0,
        pagesExpected: 0,
        pagesFetched: [],
        startTime: Date.now()
      }
    };

    // Invalidate prior session for same email if active
    for (const [id, s] of this.sessions) {
      if (s.email === session.email && s.isActive) {
        s.isActive = false;
        this.sessions.delete(id);
      }
    }

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): ServerSession | null {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) return null;
    session.lastAccessed = Date.now();
    return session;
  }

  updateSession(sessionId: string, updates: Partial<ServerSession['metadata']>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.metadata = { ...session.metadata, ...updates };
      session.lastAccessed = Date.now();
    }
  }

  closeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      session.metadata.endTime = Date.now();
      setTimeout(() => this.sessions.delete(sessionId), 5 * 60 * 1000);
    }
  }
}

export const serverSessionStore = new ServerSessionStore();
