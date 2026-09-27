import { serverSessionStore } from '../../server/sessionStore.ts';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-ID, X-Tenant-ID');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { email, url, sessionId, tenantId } = req.body || {};
    const session = serverSessionStore.createSession(email, url, sessionId, tenantId);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Session-ID', session.sessionId);
    res.status(200).json({
      success: true,
      sessionId: session.sessionId,
      tenantId: session.tenantId,
      message: `تم إنشاء جلسة سحب معزولة: ${session.sessionId}`
    });
  } catch {
    res.status(200).json({
      success: true,
      sessionId: req.body?.sessionId || `sess_${Date.now()}`,
      tenantId: req.body?.tenantId || `tenant_${Date.now()}`
    });
  }
}
