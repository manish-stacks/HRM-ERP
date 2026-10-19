import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';

export async function listCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const courses = await prisma.trainingCourse.findMany({
      where: { organizationId: orgId },
      include: {
        _count: { select: { assignments: true } }
      }
    });
    res.json({ success: true, data: courses });
  } catch (err) {
    next(err);
  }
}

export async function listAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employeeId = req.query.employeeId ? String(req.query.employeeId) : req.user?.employeeId;
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;

    const assignments = await prisma.trainingAssignment.findMany({
      where,
      include: {
        course: true,
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } }
      }
    });

    res.json({ success: true, data: assignments });
  } catch (err) {
    next(err);
  }
}

export async function completeCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const updated = await prisma.trainingAssignment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      },
      include: { course: true }
    });

    res.json({ success: true, data: updated, message: 'Training course completed.' });
  } catch (err) {
    next(err);
  }
}

