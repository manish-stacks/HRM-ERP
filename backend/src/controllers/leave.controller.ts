import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { logAudit } from '../utils/audit.js';

export async function listLeaveTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const types = await prisma.leaveType.findMany({
      where: { organizationId: orgId, isActive: true }
    });
    res.json({ success: true, data: types });
  } catch (err) {
    next(err);
  }
}

export async function getLeaveBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employeeId = req.query.employeeId ? String(req.query.employeeId) : req.user?.employeeId;
    const year = Number(req.query.year) || new Date().getFullYear();

    if (!employeeId) {
      res.status(400).json({ success: false, message: 'Employee ID required.' });
      return;
    }

    const balances = await prisma.leaveBalance.findMany({
      where: { employeeId, year },
      include: { leaveType: true }
    });

    res.json({ success: true, data: balances });
  } catch (err) {
    next(err);
  }
}

export async function listLeaveRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const { status, employeeId } = req.query;

    const where: any = {
      employee: { organizationId: orgId }
    };

    if (status) where.status = String(status);
    if (employeeId) where.employeeId = String(employeeId);

    const requests = await prisma.leaveRequest.findMany({
      where,
      include: {
        leaveType: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, department: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
}

export async function applyLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employeeId = req.user?.employeeId;
    const { leaveTypeId, startDate, endDate, daysCount, reason, isHalfDay } = req.body;

    if (!employeeId) {
      res.status(400).json({ success: false, message: 'Employee profile required.' });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Overlap validation
    const overlap = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: ['PENDING', 'APPROVED'] },
        startDate: { lte: end },
        endDate: { gte: start }
      }
    });

    if (overlap) {
      res.status(400).json({
        success: false,
        message: 'You already have a pending or approved leave request during this date range.'
      });
      return;
    }

    const count = Number(daysCount) || 1;

    // Balance check
    const currentYear = start.getFullYear();
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId,
          leaveTypeId,
          year: currentYear
        }
      }
    });

    if (balance && Number(balance.balance) < count) {
      res.status(400).json({
        success: false,
        message: `Insufficient leave balance. Remaining: ${balance.balance}, requested: ${count}`
      });
      return;
    }

    const request = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId,
        startDate: start,
        endDate: end,
        daysCount: count,
        isHalfDay: isHalfDay || false,
        reason,
        status: 'PENDING'
      },
      include: { leaveType: true }
    });

    res.status(201).json({
      success: true,
      data: request,
      message: 'Leave application submitted successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function actionLeaveRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body; // APPROVED or REJECTED
    const approverId = req.user?.employeeId;

    const request = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { leaveType: true }
    });

    if (!request) {
      res.status(404).json({ success: false, message: 'Leave request not found.' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.leaveRequest.update({
        where: { id },
        data: {
          status,
          approvedById: approverId,
          approvedAt: new Date(),
          rejectionReason: status === 'REJECTED' ? rejectionReason : null
        }
      });

      if (status === 'APPROVED') {
        const year = request.startDate.getFullYear();
        // Deduct from balance
        const balance = await tx.leaveBalance.findUnique({
          where: {
            employeeId_leaveTypeId_year: {
              employeeId: request.employeeId,
              leaveTypeId: request.leaveTypeId,
              year
            }
          }
        });

        if (balance) {
          const taken = Number(balance.taken) + Number(request.daysCount);
          const rem = Math.max(0, Number(balance.balance) - Number(request.daysCount));
          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: { taken, balance: rem }
          });
        }

        // Record transaction
        await tx.leaveTransaction.create({
          data: {
            employeeId: request.employeeId,
            requestId: request.id,
            txnType: 'USAGE',
            days: request.daysCount,
            notes: `Approved leave: ${request.reason}`
          }
        });
      }

      return updated;
    });

    res.json({ success: true, data: result, message: `Leave request ${status.toLowerCase()} successfully.` });
  } catch (err) {
    next(err);
  }
}

