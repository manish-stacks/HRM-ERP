import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { logAudit } from '../utils/audit.js';

export async function listEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const { departmentId, branchId, status, search, page = '1', limit = '50' } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = { organizationId: orgId };

    if (departmentId) where.departmentId = String(departmentId);
    if (branchId) where.branchId = String(branchId);
    if (status) where.status = String(status);
    if (search) {
      where.OR = [
        { firstName: { contains: String(search) } },
        { lastName: { contains: String(search) } },
        { employeeCode: { contains: String(search) } },
        { workEmail: { contains: String(search) } }
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take,
        include: {
          department: { select: { id: true, name: true, code: true } },
          designation: { select: { id: true, title: true, code: true } },
          branch: { select: { id: true, name: true } },
          manager: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.employee.count({ where })
    ]);

    // Check if requester has salary permission
    const canViewSalary = req.user?.permissions.includes('payroll:read') || req.user?.roles.includes('Super Admin');

    const sanitized = employees.map((emp) => ({
      ...emp,
      personalEmail: canViewSalary || emp.id === req.user?.employeeId ? emp.personalEmail : undefined,
      dateOfBirth: canViewSalary || emp.id === req.user?.employeeId ? emp.dateOfBirth : undefined,
    }));

    res.json({
      success: true,
      data: sanitized,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const { id } = req.params;

    const employee = await prisma.employee.findFirst({
      where: { id, organizationId: orgId },
      include: {
        department: true,
        designation: true,
        branch: true,
        workLocation: true,
        team: true,
        costCenter: true,
        manager: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, workEmail: true }
        },
        directReports: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, designation: true }
        },
        emergencyContacts: true,
        documents: true,
        employmentHistories: { orderBy: { effectiveDate: 'desc' } },
        salaryAssignments: {
          where: { isActive: true },
          include: { salaryStructure: { include: { components: true } } }
        },
        shiftAssignments: {
          include: { shift: true },
          orderBy: { startDate: 'desc' },
          take: 5
        },
        biometricConsent: true,
        biometricTemplates: { where: { isActive: true }, select: { id: true, modelVersion: true, isActive: true, enrolledAt: true } }
      }
    });

    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found.' });
      return;
    }

    const isSelf = employee.id === req.user?.employeeId;
    const canViewSalary = req.user?.permissions.includes('payroll:read') || req.user?.roles.includes('Super Admin');

    const sanitized = {
      ...employee,
      personalEmail: isSelf || canViewSalary ? employee.personalEmail : null,
      dateOfBirth: isSelf || canViewSalary ? employee.dateOfBirth : null,
      salaryAssignments: canViewSalary ? employee.salaryAssignments : undefined
    };

    res.json({ success: true, data: sanitized });
  } catch (err) {
    next(err);
  }
}

export async function createEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const {
      firstName,
      lastName,
      workEmail,
      phone,
      departmentId,
      designationId,
      branchId,
      managerId,
      employmentType,
      joiningDate,
      initialPassword = 'ChangeMe@123'
    } = req.body;

    // Generate unique employee code
    const count = await prisma.employee.count({ where: { organizationId: orgId } });
    const employeeCode = `EMP-${String(count + 1).padStart(4, '0')}`;

    // Create user login account for employee
    const passwordHash = await bcrypt.hash(initialPassword, 10);
    const user = await prisma.user.create({
      data: {
        organizationId: orgId,
        email: workEmail,
        passwordHash,
        isActive: true
      }
    });

    // Assign default Employee role
    const employeeRole = await prisma.role.findFirst({
      where: { organizationId: orgId, name: 'Employee' }
    });
    if (employeeRole) {
      await prisma.userRole.create({
        data: { userId: user.id, roleId: employeeRole.id }
      });
    }

    const employee = await prisma.employee.create({
      data: {
        organizationId: orgId,
        userId: user.id,
        employeeCode,
        firstName,
        lastName,
        workEmail,
        phone,
        departmentId: departmentId || null,
        designationId: designationId || null,
        branchId: branchId || null,
        managerId: managerId || null,
        employmentType: employmentType || 'FULL_TIME',
        status: 'ACTIVE',
        joiningDate: new Date(joiningDate || Date.now())
      },
      include: {
        department: true,
        designation: true,
        branch: true
      }
    });

    // Record initial employment history
    await prisma.employmentHistory.create({
      data: {
        employeeId: employee.id,
        effectiveDate: employee.joiningDate,
        changeReason: 'NEW_HIRE',
        departmentName: employee.department?.name,
        designation: employee.designation?.title,
        notes: 'Initial employee onboarded.'
      }
    });

    await logAudit({
      organizationId: orgId,
      userId: req.user?.id,
      module: 'EMPLOYEE',
      action: 'CREATE',
      entityName: 'Employee',
      entityId: employee.id,
      newValue: { employeeCode, firstName, lastName, workEmail }
    });

    res.status(201).json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
}

export async function updateEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const { id } = req.params;
    const body = req.body;

    const existing = await prisma.employee.findFirst({
      where: { id, organizationId: orgId }
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Employee not found.' });
      return;
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        firstName: body.firstName ?? undefined,
        lastName: body.lastName ?? undefined,
        phone: body.phone ?? undefined,
        personalEmail: body.personalEmail ?? undefined,
        addressLine1: body.addressLine1 ?? undefined,
        city: body.city ?? undefined,
        state: body.state ?? undefined,
        postalCode: body.postalCode ?? undefined,
        country: body.country ?? undefined,
        departmentId: body.departmentId ?? undefined,
        designationId: body.designationId ?? undefined,
        branchId: body.branchId ?? undefined,
        managerId: body.managerId ?? undefined,
        status: body.status ?? undefined
      }
    });

    await logAudit({
      organizationId: orgId,
      userId: req.user?.id,
      module: 'EMPLOYEE',
      action: 'UPDATE',
      entityName: 'Employee',
      entityId: id,
      oldValue: existing,
      newValue: updated
    });

    res.json({ success: true, data: updated, message: 'Profile updated successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function recordLifecycleEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const { id } = req.params;
    const { eventType, effectiveDate, departmentId, designationId, notes, newStatus } = req.body;

    const employee = await prisma.employee.findFirst({
      where: { id, organizationId: orgId }
    });

    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found.' });
      return;
    }

    // Update employee status or department/designation
    const updateData: any = {};
    if (departmentId) updateData.departmentId = departmentId;
    if (designationId) updateData.designationId = designationId;
    if (newStatus) updateData.status = newStatus;
    if (eventType === 'RESIGNATION' || eventType === 'EXIT') {
      updateData.exitDate = new Date(effectiveDate);
      updateData.status = 'RESIGNED';
    }

    await prisma.employee.update({
      where: { id },
      data: updateData
    });

    const history = await prisma.employmentHistory.create({
      data: {
        employeeId: id,
        effectiveDate: new Date(effectiveDate),
        changeReason: eventType,
        notes: notes || `Employee lifecycle event: ${eventType}`
      }
    });

    res.status(201).json({ success: true, data: history, message: 'Lifecycle change recorded.' });
  } catch (err) {
    next(err);
  }
}

