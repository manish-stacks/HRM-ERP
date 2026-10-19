import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';

export async function listExpenseCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const categories = await prisma.expenseCategory.findMany({
      where: { organizationId: orgId, isActive: true }
    });
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

export async function listClaims(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const { status, employeeId } = req.query;

    const where: any = {
      employee: { organizationId: orgId }
    };

    if (status) where.status = String(status);
    if (employeeId) where.employeeId = String(employeeId);

    const claims = await prisma.expenseClaim.findMany({
      where,
      include: {
        category: true,
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: claims });
  } catch (err) {
    next(err);
  }
}

export async function submitClaim(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employeeId = req.user?.employeeId;
    const { categoryId, amount, claimDate, description, receiptUrl } = req.body;

    if (!employeeId) {
      res.status(400).json({ success: false, message: 'Employee profile required.' });
      return;
    }

    const claim = await prisma.expenseClaim.create({
      data: {
        employeeId,
        categoryId,
        amount: Number(amount),
        claimDate: new Date(claimDate || Date.now()),
        description,
        receiptUrl,
        status: 'PENDING'
      },
      include: { category: true }
    });

    res.status(201).json({ success: true, data: claim, message: 'Expense claim submitted.' });
  } catch (err) {
    next(err);
  }
}

export async function actionClaim(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body; // APPROVED, REJECTED, PAID
    const approverId = req.user?.employeeId;

    const updated = await prisma.expenseClaim.update({
      where: { id },
      data: {
        status,
        approvedById: approverId,
        approvedAt: new Date()
      }
    });

    res.json({ success: true, data: updated, message: `Claim marked as ${status.toLowerCase()}.` });
  } catch (err) {
    next(err);
  }
}

export async function listLoans(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const loans = await prisma.employeeLoan.findMany({
      where: { employee: { organizationId: orgId } },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        repayments: true
      }
    });
    res.json({ success: true, data: loans });
  } catch (err) {
    next(err);
  }
}

