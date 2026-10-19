import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';

export async function listRequisitions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const requisitions = await prisma.jobRequisition.findMany({
      where: { organizationId: orgId },
      include: {
        department: true,
        designation: true,
        _count: { select: { candidates: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: requisitions });
  } catch (err) {
    next(err);
  }
}

export async function createRequisition(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const { title, departmentId, designationId, openings, experienceYears, description } = req.body;

    const reqRecord = await prisma.jobRequisition.create({
      data: {
        organizationId: orgId,
        title,
        departmentId,
        designationId,
        openings: Number(openings) || 1,
        experienceYears: Number(experienceYears) || 0,
        description,
        status: 'OPEN'
      }
    });

    res.status(201).json({ success: true, data: reqRecord });
  } catch (err) {
    next(err);
  }
}

export async function listCandidates(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const { stage, requisitionId } = req.query;

    const where: any = {
      requisition: { organizationId: orgId }
    };

    if (stage) where.stage = String(stage);
    if (requisitionId) where.requisitionId = String(requisitionId);

    const candidates = await prisma.candidate.findMany({
      where,
      include: {
        requisition: { select: { title: true, department: { select: { name: true } } } },
        interviews: { include: { interviewer: { select: { firstName: true, lastName: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: candidates });
  } catch (err) {
    next(err);
  }
}

export async function createCandidate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { requisitionId, firstName, lastName, email, phone, source = 'PORTAL' } = req.body;

    const candidate = await prisma.candidate.create({
      data: {
        requisitionId,
        firstName,
        lastName,
        email,
        phone,
        source,
        stage: 'APPLIED'
      }
    });

    res.status(201).json({ success: true, data: candidate });
  } catch (err) {
    next(err);
  }
}

export async function updateCandidateStage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    const candidate = await prisma.candidate.update({
      where: { id },
      data: { stage }
    });

    res.json({ success: true, data: candidate, message: `Candidate moved to ${stage}.` });
  } catch (err) {
    next(err);
  }
}

