import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { logAudit } from '../utils/audit.js';

export async function recordPunch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { punchType = 'CHECK_IN', source = 'WEB', notes, latitude, longitude } = req.body;
    const employeeId = req.user?.employeeId;

    if (!employeeId) {
      res.status(400).json({ success: false, message: 'Current user has no associated employee profile.' });
      return;
    }

    const now = new Date();
    const todayDateOnly = new Date(now.toISOString().split('T')[0]);

    // Check employee shift
    const shiftAssign = await prisma.shiftAssignment.findFirst({
      where: {
        employeeId,
        startDate: { lte: todayDateOnly },
        OR: [{ endDate: null }, { endDate: { gte: todayDateOnly } }]
      },
      include: { shift: true }
    });

    const shift = shiftAssign?.shift;
    const scheduledMins = shift?.expectedMinutes || 480;

    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.attendanceEvent.create({
        data: {
          employeeId,
          timestamp: now,
          eventType: punchType,
          source,
          notes,
          latitude: latitude ? Number(latitude) : undefined,
          longitude: longitude ? Number(longitude) : undefined,
          ipAddress: req.ip
        }
      });

      let summary = await tx.attendanceDailySummary.findUnique({
        where: {
          employeeId_date: {
            employeeId,
            date: todayDateOnly
          }
        }
      });

      if (!summary) {
        // Calculate late minutes if shift start time available
        let lateMins = 0;
        if (shift) {
          const [sHour, sMin] = shift.startTime.split(':').map(Number);
          const shiftStart = new Date(todayDateOnly);
          shiftStart.setHours(sHour, sMin, 0, 0);

          const diffMins = Math.floor((now.getTime() - shiftStart.getTime()) / (60 * 1000));
          if (diffMins > shift.graceMinutes) {
            lateMins = diffMins;
          }
        }

        summary = await tx.attendanceDailySummary.create({
          data: {
            employeeId,
            date: todayDateOnly,
            status: 'PRESENT',
            firstCheckIn: now,
            scheduledMinutes: scheduledMins,
            lateMinutes: lateMins,
            actualMinutes: 0,
            paidMinutes: 0
          }
        });
      } else {
        const checkIn = summary.firstCheckIn || now;
        const actualMins = Math.max(0, Math.floor((now.getTime() - checkIn.getTime()) / (1000 * 60)));
        summary = await tx.attendanceDailySummary.update({
          where: { id: summary.id },
          data: {
            lastCheckOut: punchType === 'CHECK_OUT' ? now : summary.lastCheckOut,
            actualMinutes: actualMins,
            paidMinutes: actualMins,
            status: 'PRESENT'
          }
        });
      }

      return { event, summary };
    });

    res.json({
      success: true,
      message: `${punchType} punch recorded successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

export async function getTodayLiveAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const today = new Date();
    const todayDateOnly = new Date(today.toISOString().split('T')[0]);

    const summaries = await prisma.attendanceDailySummary.findMany({
      where: {
        date: todayDateOnly,
        employee: { organizationId: orgId }
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
            designation: { select: { title: true } }
          }
        }
      }
    });

    const totalActiveEmployees = await prisma.employee.count({
      where: { organizationId: orgId, status: 'ACTIVE' }
    });

    const presentCount = summaries.filter(s => s.status === 'PRESENT').length;
    const lateCount = summaries.filter(s => s.lateMinutes > 0).length;
    const missingCheckOutCount = summaries.filter(s => s.firstCheckIn && !s.lastCheckOut).length;
    const absentCount = Math.max(0, totalActiveEmployees - presentCount);

    res.json({
      success: true,
      data: {
        metrics: {
          totalActiveEmployees,
          presentCount,
          lateCount,
          absentCount,
          missingCheckOutCount
        },
        records: summaries
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getAttendanceHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const { employeeId, departmentId, month, year } = req.query;

    const where: any = {
      employee: { organizationId: orgId }
    };

    if (employeeId) where.employeeId = String(employeeId);
    if (departmentId) where.employee.departmentId = String(departmentId);

    const targetYear = Number(year) || new Date().getFullYear();
    const targetMonth = Number(month) ? Number(month) - 1 : new Date().getMonth();

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0);

    where.date = {
      gte: startOfMonth,
      lte: endOfMonth
    };

    const records = await prisma.attendanceDailySummary.findMany({
      where,
      include: {
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
      orderBy: { date: 'desc' }
    });

    res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
}

export async function requestAttendanceCorrection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employeeId = req.user?.employeeId;
    const { date, requestedIn, requestedOut, reason } = req.body;

    if (!employeeId) {
      res.status(400).json({ success: false, message: 'Employee profile required.' });
      return;
    }

    const correction = await prisma.attendanceCorrectionRequest.create({
      data: {
        employeeId,
        date: new Date(date),
        requestedIn: requestedIn ? new Date(requestedIn) : null,
        requestedOut: requestedOut ? new Date(requestedOut) : null,
        reason,
        status: 'PENDING'
      }
    });

    res.status(201).json({
      success: true,
      data: correction,
      message: 'Correction request submitted to manager.'
    });
  } catch (err) {
    next(err);
  }
}

export async function listCorrections(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const corrections = await prisma.attendanceCorrectionRequest.findMany({
      where: {
        employee: { organizationId: orgId }
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, department: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: corrections });
  } catch (err) {
    next(err);
  }
}

export async function approveCorrection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { status, reviewerNotes } = req.body; // APPROVED or REJECTED
    const reviewerId = req.user?.employeeId;

    const request = await prisma.attendanceCorrectionRequest.findUnique({
      where: { id }
    });

    if (!request) {
      res.status(404).json({ success: false, message: 'Correction request not found.' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedReq = await tx.attendanceCorrectionRequest.update({
        where: { id },
        data: {
          status,
          approvedById: reviewerId,
          approvedAt: new Date(),
          reviewerNotes
        }
      });

      if (status === 'APPROVED') {
        const dateOnly = new Date(request.date.toISOString().split('T')[0]);
        const checkIn = request.requestedIn;
        const checkOut = request.requestedOut;
        let actualMins = 480;
        if (checkIn && checkOut) {
          actualMins = Math.max(0, Math.floor((checkOut.getTime() - checkIn.getTime()) / (60 * 1000)));
        }

        await tx.attendanceDailySummary.upsert({
          where: {
            employeeId_date: {
              employeeId: request.employeeId,
              date: dateOnly
            }
          },
          update: {
            firstCheckIn: checkIn,
            lastCheckOut: checkOut,
            actualMinutes: actualMins,
            paidMinutes: actualMins,
            status: 'PRESENT',
            isManualOverride: true,
            notes: `Approved correction: ${request.reason}`
          },
          create: {
            employeeId: request.employeeId,
            date: dateOnly,
            firstCheckIn: checkIn,
            lastCheckOut: checkOut,
            actualMinutes: actualMins,
            paidMinutes: actualMins,
            status: 'PRESENT',
            isManualOverride: true,
            notes: `Approved correction: ${request.reason}`
          }
        });
      }

      return updatedReq;
    });

    res.json({ success: true, data: result, message: `Attendance correction ${status.toLowerCase()} successfully.` });
  } catch (err) {
    next(err);
  }
}

