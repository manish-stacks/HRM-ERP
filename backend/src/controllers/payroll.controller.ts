import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { toDecimal, roundMoney, calculatePercentage } from '../utils/decimal.js';
import { logAudit } from '../utils/audit.js';

export async function listSalaryStructures(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const structures = await prisma.salaryStructure.findMany({
      where: { organizationId: orgId, isActive: true },
      include: {
        components: { orderBy: { displayOrder: 'asc' } },
        _count: { select: { assignments: true } }
      }
    });
    res.json({ success: true, data: structures });
  } catch (err) {
    next(err);
  }
}

export async function assignSalary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { employeeId, salaryStructureId, baseSalary, effectiveFrom } = req.body;

    // Deactivate previous active assignment
    await prisma.employeeSalaryAssignment.updateMany({
      where: { employeeId, isActive: true },
      data: { isActive: false, effectiveTo: new Date() }
    });

    const assignment = await prisma.employeeSalaryAssignment.create({
      data: {
        employeeId,
        salaryStructureId,
        baseSalary: toDecimal(baseSalary).toNumber(),
        effectiveFrom: new Date(effectiveFrom || Date.now()),
        isActive: true
      },
      include: {
        salaryStructure: { include: { components: true } }
      }
    });

    res.status(201).json({ success: true, data: assignment, message: 'Salary assigned successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function listPayrollPeriods(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const periods = await prisma.payrollPeriod.findMany({
      where: { organizationId: orgId },
      include: { payrollRuns: true },
      orderBy: { startDate: 'desc' }
    });
    res.json({ success: true, data: periods });
  } catch (err) {
    next(err);
  }
}

export async function createPayrollPeriod(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const { name, startDate, endDate, payDate } = req.body;

    const period = await prisma.payrollPeriod.create({
      data: {
        organizationId: orgId,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        payDate: new Date(payDate || endDate)
      }
    });

    res.status(201).json({ success: true, data: period });
  } catch (err) {
    next(err);
  }
}

export async function processPayrollRun(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const { periodId } = req.body;

    const period = await prisma.payrollPeriod.findUnique({
      where: { id: periodId }
    });

    if (!period) {
      res.status(404).json({ success: false, message: 'Payroll period not found.' });
      return;
    }

    // Check if run already exists for period
    const existingRun = await prisma.payrollRun.findFirst({
      where: { periodId, status: { in: ['APPROVED', 'LOCKED'] } }
    });

    if (existingRun) {
      res.status(400).json({
        success: false,
        message: 'A locked or approved payroll run already exists for this period.'
      });
      return;
    }

    // Fetch active employees with active salary assignments
    const employees = await prisma.employee.findMany({
      where: { organizationId: orgId, status: 'ACTIVE' },
      include: {
        salaryAssignments: {
          where: { isActive: true },
          include: { salaryStructure: { include: { components: true } } }
        }
      }
    });

    const runNumber = `RUN-${Date.now().toString().slice(-6)}`;
    let totalGrossDecimal = toDecimal(0);
    let totalDeductionsDecimal = toDecimal(0);
    let totalNetDecimal = toDecimal(0);

    const payrollItemsData: any[] = [];

    for (const emp of employees) {
      const assignment = emp.salaryAssignments[0];
      if (!assignment) continue; // Skip if no salary assigned

      const baseMonthly = toDecimal(assignment.baseSalary);
      const components = assignment.salaryStructure.components;

      let empGross = toDecimal(0);
      let empDeductions = toDecimal(0);
      const earnings: any[] = [];
      const deductions: any[] = [];

      for (const comp of components) {
        let compAmount = toDecimal(0);
        if (comp.fixedAmount) {
          compAmount = toDecimal(comp.fixedAmount);
        } else if (comp.percentageOfBasic) {
          compAmount = calculatePercentage(baseMonthly, comp.percentageOfBasic);
        }

        if (comp.type === 'EARNING') {
          empGross = empGross.plus(compAmount);
          earnings.push({ name: comp.name, amount: compAmount.toNumber() });
        } else {
          empDeductions = empDeductions.plus(compAmount);
          deductions.push({ name: comp.name, amount: compAmount.toNumber() });
        }
      }

      // Check unpaid leaves in period
      const unpaidDays = 0; // Configurable from attendance summaries
      const payableDays = 22; // Standard working days
      const empNet = roundMoney(empGross.minus(empDeductions));

      totalGrossDecimal = totalGrossDecimal.plus(empGross);
      totalDeductionsDecimal = totalDeductionsDecimal.plus(empDeductions);
      totalNetDecimal = totalNetDecimal.plus(empNet);

      payrollItemsData.push({
        employeeId: emp.id,
        payableDays,
        unpaidDays,
        grossPay: empGross.toNumber(),
        totalDeductions: empDeductions.toNumber(),
        netPay: empNet.toNumber(),
        earnings,
        deductions
      });
    }

    // Save run transactionally
    const payrollRun = await prisma.$transaction(async (tx) => {
      const run = await tx.payrollRun.create({
        data: {
          organizationId: orgId,
          periodId,
          runNumber,
          totalGross: totalGrossDecimal.toNumber(),
          totalDeductions: totalDeductionsDecimal.toNumber(),
          totalNet: totalNetDecimal.toNumber(),
          status: 'DRAFT'
        }
      });

      for (const item of payrollItemsData) {
        const pItem = await tx.payrollItem.create({
          data: {
            payrollRunId: run.id,
            employeeId: item.employeeId,
            payableDays: item.payableDays,
            unpaidDays: item.unpaidDays,
            grossPay: item.grossPay,
            totalDeductions: item.totalDeductions,
            netPay: item.netPay
          }
        });

        for (const e of item.earnings) {
          await tx.payrollEarning.create({
            data: { payrollItemId: pItem.id, name: e.name, amount: e.amount }
          });
        }

        for (const d of item.deductions) {
          await tx.payrollDeduction.create({
            data: { payrollItemId: pItem.id, name: d.name, amount: d.amount }
          });
        }
      }

      return run;
    });

    res.status(201).json({
      success: true,
      data: payrollRun,
      message: `Payroll run generated with ${payrollItemsData.length} eligible employee records.`
    });
  } catch (err) {
    next(err);
  }
}

export async function lockPayrollRun(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const approverId = req.user?.employeeId;

    const run = await prisma.payrollRun.findUnique({
      where: { id },
      include: {
        period: true,
        payrollItems: { include: { employee: true } }
      }
    });

    if (!run) {
      res.status(404).json({ success: false, message: 'Payroll run not found.' });
      return;
    }

    const lockedRun = await prisma.$transaction(async (tx) => {
      const updated = await tx.payrollRun.update({
        where: { id },
        data: {
          status: 'LOCKED',
          approvedById: approverId,
          approvedAt: new Date(),
          lockedAt: new Date()
        }
      });

      // Generate payslips
      const periodMonth = run.period.startDate.getMonth() + 1;
      const periodYear = run.period.startDate.getFullYear();

      for (const item of run.payrollItems) {
        const payslipNumber = `SLIP-${periodYear}${String(periodMonth).padStart(2, '0')}-${item.employee.employeeCode.slice(-4)}`;
        await tx.payslip.upsert({
          where: { payrollItemId: item.id },
          update: { isPublished: true },
          create: {
            payrollItemId: item.id,
            employeeId: item.employeeId,
            payslipNumber,
            month: periodMonth,
            year: periodYear,
            isPublished: true
          }
        });
      }

      return updated;
    });

    res.json({
      success: true,
      data: lockedRun,
      message: 'Payroll locked and employee payslips published successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function getPayslip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const payslip = await prisma.payslip.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
            organization: true
          }
        },
        payrollItem: {
          include: {
            earnings: true,
            deductions: true,
            payrollRun: { include: { period: true } }
          }
        }
      }
    });

    if (!payslip) {
      res.status(404).json({ success: false, message: 'Payslip not found.' });
      return;
    }

    // Permission check: Employee can only view own payslip unless HR / Super Admin
    const isSelf = payslip.employeeId === req.user?.employeeId;
    const canViewAll = req.user?.permissions.includes('payroll:read') || req.user?.roles.includes('Super Admin');

    if (!isSelf && !canViewAll) {
      res.status(403).json({ success: false, message: 'Forbidden: You can only view your own payslips.' });
      return;
    }

    res.json({ success: true, data: payslip });
  } catch (err) {
    next(err);
  }
}

export async function listMyPayslips(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      res.status(400).json({ success: false, message: 'Employee profile required.' });
      return;
    }

    const payslips = await prisma.payslip.findMany({
      where: { employeeId, isPublished: true },
      include: {
        payrollItem: {
          include: {
            earnings: true,
            deductions: true,
            payrollRun: { include: { period: true } }
          }
        }
      },
      orderBy: { year: 'desc' }
    });

    res.json({ success: true, data: payslips });
  } catch (err) {
    next(err);
  }
}

