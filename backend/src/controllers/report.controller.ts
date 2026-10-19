import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';

export async function getDashboardMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const today = new Date();
    const todayDateOnly = new Date(today.toISOString().split('T')[0]);

    // Live counts
    const [
      totalHeadcount,
      activeEmployees,
      departmentStats,
      todayAttendance,
      pendingLeaves,
      recentAnnouncements,
      recentTickets
    ] = await Promise.all([
      prisma.employee.count({ where: { organizationId: orgId } }),
      prisma.employee.count({ where: { organizationId: orgId, status: 'ACTIVE' } }),
      prisma.department.findMany({
        where: { organizationId: orgId },
        select: {
          name: true,
          _count: { select: { employees: true } }
        }
      }),
      prisma.attendanceDailySummary.findMany({
        where: { date: todayDateOnly, employee: { organizationId: orgId } }
      }),
      prisma.leaveRequest.count({
        where: { employee: { organizationId: orgId }, status: 'PENDING' }
      }),
      prisma.announcement.findMany({
        where: { organizationId: orgId, isActive: true },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.helpdeskTicket.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const presentToday = todayAttendance.filter(a => a.status === 'PRESENT').length;
    const lateToday = todayAttendance.filter(a => a.lateMinutes > 0).length;
    const absentToday = Math.max(0, activeEmployees - presentToday);

    // Latest payroll run
    const latestPayroll = await prisma.payrollRun.findFirst({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      include: { period: true }
    });

    res.json({
      success: true,
      data: {
        headcount: {
          total: totalHeadcount,
          active: activeEmployees,
          resigned: totalHeadcount - activeEmployees
        },
        attendanceToday: {
          present: presentToday,
          late: lateToday,
          absent: absentToday,
          attendanceRate: activeEmployees > 0 ? ((presentToday / activeEmployees) * 100).toFixed(1) : '0'
        },
        departmentDistribution: departmentStats.map(d => ({
          name: d.name,
          count: d._count.employees
        })),
        pendingApprovals: {
          leaves: pendingLeaves
        },
        payrollSummary: latestPayroll ? {
          period: latestPayroll.period.name,
          gross: latestPayroll.totalGross,
          net: latestPayroll.totalNet,
          status: latestPayroll.status
        } : null,
        recentAnnouncements,
        recentTickets
      }
    });
  } catch (err) {
    next(err);
  }
}

import { purgeOldAuditLogs } from '../utils/audit.js';

export async function getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const { module, limit = '100' } = req.query;

    // Automatic 1-week retention cleanup: delete logs older than 7 days
    await purgeOldAuditLogs(orgId, 7);

    const where: any = { organizationId: orgId };
    if (module && module !== 'ALL') where.module = String(module);

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { email: true, employee: { select: { firstName: true, lastName: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    });

    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
}

export async function purgeAuditLogsEndpoint(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const purgedCount = await purgeOldAuditLogs(orgId, 7);
    res.json({
      success: true,
      message: `Successfully purged ${purgedCount} audit log entries older than 7 days.`,
      purgedCount
    });
  } catch (err) {
    next(err);
  }
}

