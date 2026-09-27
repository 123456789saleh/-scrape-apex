import { TenantDataContainer } from '../types/session.ts';
import { ExtractedEmail, ExtractedProduct } from '../types/scraper.ts';

export class MultiTenantStore {
  private containers = new Map<string, TenantDataContainer>();
  private tenantMap = new Map<string, string>();

  // Create or refresh an isolated tenant container
  createTenant(email: string): string {
    const normalizedEmail = (email || '').toLowerCase().trim();
    
    // Purge old data container for this email
    const existingId = this.tenantMap.get(normalizedEmail);
    if (existingId) {
      this.containers.delete(existingId);
      console.log(`[MultiTenantStore] 🗑️ تم تصفير بيانات المستأجر السابقة للبريد: ${normalizedEmail}`);
    }

    const tenantId = this.generateTenantId(normalizedEmail);
    const domain = normalizedEmail.includes('@') ? normalizedEmail.split('@')[1] : 'custom';

    const container: TenantDataContainer = {
      tenantId,
      email: normalizedEmail,
      domain,
      emailData: [],
      siteData: [],
      attachments: [],
      metadata: {
        totalCount: 0,
        unreadCount: 0,
        archivedCount: 0,
        fetchedAt: Date.now(),
        lastModified: Date.now()
      },
      history: []
    };

    this.containers.set(tenantId, container);
    this.tenantMap.set(normalizedEmail, tenantId);

    console.log(`[MultiTenantStore] ✓ تم إنشاء حاوية بيانات معزولة جديدة للمستأجر: ${tenantId}`);
    return tenantId;
  }

  // Get tenant data safely - returns null if not found
  getTenantData(tenantId: string): TenantDataContainer | null {
    if (!tenantId) return null;
    const container = this.containers.get(tenantId);
    if (!container) {
      console.warn(`[MultiTenantStore] بيانات غير موجودة للحاوية: ${tenantId}`);
      return null;
    }
    return container;
  }

  // Get tenant ID by email
  getTenantIdByEmail(email: string): string | null {
    return this.tenantMap.get((email || '').toLowerCase().trim()) || null;
  }

  // Add data safely to the specific tenant
  addData(tenantId: string, items: any[], type: 'email' | 'site'): boolean {
    const container = this.getTenantData(tenantId);
    if (!container || !Array.isArray(items)) return false;

    if (type === 'email') {
      container.emailData.push(...(items as ExtractedEmail[]));
      // Deduplicate by ID
      const seen = new Set<string>();
      container.emailData = container.emailData.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    } else {
      container.siteData.push(...(items as ExtractedProduct[]));
      const seen = new Set<string>();
      container.siteData = container.siteData.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    }

    container.metadata.totalCount = container.emailData.length + container.siteData.length;
    container.metadata.lastModified = Date.now();

    return true;
  }

  // Purge a tenant completely
  purgeTenant(tenantId: string): void {
    const container = this.containers.get(tenantId);
    if (container) {
      this.tenantMap.delete(container.email);
      this.containers.delete(tenantId);
    }
  }

  private generateTenantId(email: string): string {
    const safeEmailPrefix = email.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 15);
    return `tenant-${safeEmailPrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }
}
