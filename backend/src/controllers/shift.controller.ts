import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { logAudit } from '../utils/audit.js';

export async function listShifts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const shifts = await prisma.shift.findMany({
      where: { organizationId: orgId, isActive: true },
      include: {
        _count: { select: { assignments: true } }
      }
    });
    res.json({ success: true, data: shifts });
  } catch (err) {
    next(err);
  }
}

export async function createShift(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const {
      code,
      name,
      shiftType = 'FIXED',
      startTime,
      endTime,
      isOvernight = false,
      expectedMinutes = 480,
      breakMinutes = 60,
      isBreakPaid = false,
      graceMinutes = 15,
      lateThresholdMinutes = 30,
      colorTag = '#3b82f6'
    } = req.body;

    const shift = await prisma.shift.create({
      data: {
        organizationId: orgId,
        code,
        name,
        shiftType,
        startTime,
        endTime,
        isOvernight,
        expectedMinutes,
        breakMinutes,
        isBreakPaid,
        graceMinutes,
        lateThresholdMinutes,
        colorTag
      }
    });

    await logAudit({
      organizationId: orgId,
      userId: req.user?.id,
      module: 'SHIFTS',
      action: 'CREATE',
      entityName: 'Shift',
      entityId: shift.id,
      newValue: shift
    });

    res.status(201).json({ success: true, data: shift });
  } catch (err) {
    next(err);
  }
}

export async function getRoster(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const { startDate, endDate, departmentId } = req.query;

    const where: any = {
      employee: {
        organizationId: orgId
      }
    };

    if (departmentId) {
      where.employee.departmentId = String(departmentId);
    }

    const assignments = await prisma.shiftAssignment.findMany({
      where,
      include: {
        shift: true,
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } }
          }
        }
      },
      orderBy: { startDate: 'asc' }
    });

    res.json({ success: true, data: assignments });
  } catch (err) {
    next(err);
  }
}

export async function assignShift(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { employeeId, shiftId, startDate, endDate, notes } = req.body;

    // Check for existing overlapping assignment
    const overlap = await prisma.shiftAssignment.findFirst({
      where: {
        employeeId,
        startDate: { lte: new Date(endDate || startDate) },
        endDate: { gte: new Date(startDate) }
      }
    });

    if (overlap) {
      res.status(400).json({
        success: false,
        message: 'Conflict: Employee already has an active shift assignment during this date range.'
      });
      return;
    }

    const assignment = await prisma.shiftAssignment.create({
      data: {
        employeeId,
        shiftId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        notes
      },
      include: {
        shift: true,
        employee: { select: { firstName: true, lastName: true } }
      }
    });

    res.status(201).json({ success: true, data: assignment, message: 'Shift assigned successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function listSwapRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const swaps = await prisma.shiftSwapRequest.findMany({
      where: {
        requester: { organizationId: orgId }
      },
      include: {
        requester: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        targetEmployee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: swaps });
  } catch (err) {
    next(err);
  }
}

export async function actionSwapRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body; // APPROVED or REJECTED

    const updated = await prisma.shiftSwapRequest.update({
      where: { id },
      data: {
        status,
        approvedById: req.user?.employeeId || null,
        actionedAt: new Date()
      }
    });

    res.json({ success: true, data: updated, message: `Shift swap ${status.toLowerCase()} successfully.` });
  } catch (err) {
    next(err);
  }
}

