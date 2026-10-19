import { prisma } from '../config/prisma.js';

interface AuditParams {
  organizationId: string;
  userId?: string | null;
  module: string;
  action: string;
  entityName: string;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId || null,
        module: params.module,
        action: params.action,
        entityName: params.entityName,
        entityId: params.entityId || null,
        oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
        newValue: params.newValue ? JSON.stringify(params.newValue) : null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

export async function purgeOldAuditLogs(organizationId?: string, retentionDays = 7): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const where: any = { createdAt: { lt: cutoffDate } };
    if (organizationId) where.organizationId = organizationId;

    const res = await prisma.auditLog.deleteMany({ where });
    if (res.count > 0) {
      console.log(`[AuditRetention] Automatically purged ${res.count} audit logs older than ${retentionDays} days.`);
    }
    return res.count;
  } catch (error) {
    console.error('Failed to purge old audit logs:', error);
    return 0;
  }
}

