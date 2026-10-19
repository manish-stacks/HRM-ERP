import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';

export async function listCycles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const cycles = await prisma.performanceCycle.findMany({
      where: { organizationId: orgId },
      include: {
        _count: { select: { goals: true, reviews: true } }
      },
      orderBy: { startDate: 'desc' }
    });
    res.json({ success: true, data: cycles });
  } catch (err) {
    next(err);
  }
}

export async function listGoals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cycleId, employeeId } = req.query;
    const targetEmployeeId = employeeId ? String(employeeId) : req.user?.employeeId;

    const where: any = {};
    if (cycleId) where.cycleId = String(cycleId);
    if (targetEmployeeId) where.employeeId = targetEmployeeId;

    const goals = await prisma.performanceGoal.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } }
      }
    });

    res.json({ success: true, data: goals });
  } catch (err) {
    next(err);
  }
}

export async function updateGoalProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { progress, status } = req.body;

    const updated = await prisma.performanceGoal.update({
      where: { id },
      data: {
        progress: Number(progress),
        status: status ?? (Number(progress) >= 100 ? 'COMPLETED' : 'IN_PROGRESS')
      }
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function submitReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cycleId, employeeId, selfScore, managerScore, selfRemarks, managerRemarks } = req.body;
    const reviewerId = req.user?.employeeId;

    const review = await prisma.performanceReview.create({
      data: {
        cycleId,
        employeeId,
        reviewerId: reviewerId || employeeId,
        selfScore: selfScore ? Number(selfScore) : undefined,
        managerScore: managerScore ? Number(managerScore) : undefined,
        selfRemarks,
        managerRemarks,
        status: 'SUBMITTED'
      }
    });

    res.status(201).json({ success: true, data: review, message: 'Performance appraisal submitted.' });
  } catch (err) {
    next(err);
  }
}

