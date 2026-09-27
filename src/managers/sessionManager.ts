import { SessionContext } from '../types/session.ts';

export class SessionManager {
  private activeSessions = new Map<string, SessionContext>();
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes

  // Create a brand new isolated session with unique UUID + timestamp
  createSession(inputEmail: string, inputUrl: string): string {
    const sessionId = this.generateSessionId();
    
    // Invalidate any previous session associated with this email
    this.invalidateOldSession(inputEmail);
    
    const session: SessionContext = {
      sessionId,
      createdAt: Date.now(),
      inputEmail: inputEmail.trim(),
      inputUrl: inputUrl.trim(),
      targetDomain: this.extractDomain(inputUrl),
      results: [],
      metadata: {
        totalItemsExpected: 0,
        totalItemsFetched: 0,
        pagesExpected: 0,
        pagesFetched: [],
        errorLog: [],
        warnings: [],
        startTime: Date.now()
      },
      isActive: true,
      lastAccessed: Date.now()
    };

    this.activeSessions.set(sessionId, session);
    console.log(`[SessionManager] ✓ جلسة جديدة مستقلة: ${sessionId} للبريد: ${inputEmail}`);
    
    return sessionId;
  }

  // Remove and purge any previous session for the same email
  invalidateOldSession(email: string): void {
    if (!email) return;
    const normalized = email.toLowerCase().trim();
    for (const [id, session] of this.activeSessions) {
      if (session.inputEmail.toLowerCase().trim() === normalized) {
        session.isActive = false;
        this.activeSessions.delete(id);
        console.log(`[SessionManager] 🗑️ حذف وتصفير جلسة سابقة: ${id} للمستأجر: ${email}`);
      }
    }
  }

  generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  extractDomain(url: string): string {
    try {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  // Get active session if valid and not timed out
  getSession(sessionId: string): SessionContext | null {
    if (!sessionId) return null;
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;
    
    // Check timeout
    if (Date.now() - session.lastAccessed > this.sessionTimeout) {
      this.activeSessions.delete(sessionId);
      return null;
    }
    
    if (!session.isActive) return null;
    
    session.lastAccessed = Date.now();
    return session;
  }

  // Gracefully close session
  closeSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      session.metadata.endTime = Date.now();
      
      // Auto-prune after 5 minutes
      setTimeout(() => {
        this.activeSessions.delete(sessionId);
      }, 5 * 60 * 1000);
    }
  }

  // Clear all sessions
  clearAll(): void {
    this.activeSessions.clear();
  }
}
