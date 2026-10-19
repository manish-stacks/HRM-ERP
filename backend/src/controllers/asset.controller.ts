import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';

export async function listAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const assets = await prisma.asset.findMany({
      where: { organizationId: orgId },
      include: {
        assignments: {
          where: { returnedAt: null },
          include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } } }
        }
      }
    });
    res.json({ success: true, data: assets });
  } catch (err) {
    next(err);
  }
}

export async function createAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const { assetTag, name, category, serialNumber, cost } = req.body;

    const asset = await prisma.asset.create({
      data: {
        organizationId: orgId,
        assetTag,
        name,
        category,
        serialNumber,
        cost: cost ? Number(cost) : undefined,
        status: 'AVAILABLE'
      }
    });

    res.status(201).json({ success: true, data: asset });
  } catch (err) {
    next(err);
  }
}

export async function allocateAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { assetId, employeeId, condition, notes } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const assignment = await tx.assetAssignment.create({
        data: {
          assetId,
          employeeId,
          condition: condition || 'GOOD',
          notes
        }
      });

      await tx.asset.update({
        where: { id: assetId },
        data: { status: 'ALLOCATED' }
      });

      return assignment;
    });

    res.json({ success: true, data: result, message: 'Asset allocated to employee.' });
  } catch (err) {
    next(err);
  }
}

export async function returnAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { assignmentId } = req.params;

    const assignment = await prisma.assetAssignment.findUnique({
      where: { id: assignmentId }
    });

    if (!assignment) {
      res.status(404).json({ success: false, message: 'Assignment record not found.' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.assetAssignment.update({
        where: { id: assignmentId },
        data: { returnedAt: new Date() }
      });

      await tx.asset.update({
        where: { id: assignment.assetId },
        data: { status: 'AVAILABLE' }
      });
    });

    res.json({ success: true, message: 'Asset returned and marked available.' });
  } catch (err) {
    next(err);
  }
}

