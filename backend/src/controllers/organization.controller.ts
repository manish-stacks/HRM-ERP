import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { logAudit } from '../utils/audit.js';

export async function getOrganizationDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        settings: true,
        branches: true,
        departments: {
          include: {
            headEmployee: {
              select: { id: true, firstName: true, lastName: true, employeeCode: true }
            },
            _count: { select: { employees: true } }
          }
        },
        designations: {
          include: {
            _count: { select: { employees: true } }
          }
        }
      }
    });

    res.json({ success: true, data: org });
  } catch (err) {
    next(err);
  }
}

export async function updateOrganizationSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const {
      enableFaceBiometrics,
      biometricThreshold,
      requireLivenessCheck,
      allowManualAttendance,
      autoApproveOvertime,
      overtimeGraceMinutes,
      maxCarryForwardDays,
      brandingPrimaryColor
    } = req.body;

    const updated = await prisma.organizationSettings.upsert({
      where: { organizationId: orgId },
      update: {
        enableFaceBiometrics: enableFaceBiometrics ?? undefined,
        biometricThreshold: biometricThreshold ?? undefined,
        requireLivenessCheck: requireLivenessCheck ?? undefined,
        allowManualAttendance: allowManualAttendance ?? undefined,
        autoApproveOvertime: autoApproveOvertime ?? undefined,
        overtimeGraceMinutes: overtimeGraceMinutes ?? undefined,
        maxCarryForwardDays: maxCarryForwardDays ?? undefined,
        brandingPrimaryColor: brandingPrimaryColor ?? undefined,
      },
      create: {
        organizationId: orgId,
        enableFaceBiometrics: enableFaceBiometrics ?? true,
        biometricThreshold: biometricThreshold ?? 0.60,
        requireLivenessCheck: requireLivenessCheck ?? false,
        allowManualAttendance: allowManualAttendance ?? true,
        autoApproveOvertime: autoApproveOvertime ?? false,
        overtimeGraceMinutes: overtimeGraceMinutes ?? 15,
        maxCarryForwardDays: maxCarryForwardDays ?? 10,
        brandingPrimaryColor: brandingPrimaryColor ?? '#2563eb',
      }
    });

    await logAudit({
      organizationId: orgId,
      userId: req.user?.id,
      module: 'ORGANIZATION',
      action: 'UPDATE_SETTINGS',
      entityName: 'OrganizationSettings',
      entityId: updated.id,
      newValue: req.body
    });

    res.json({ success: true, data: updated, message: 'Settings saved successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function getBranches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const branches = await prisma.branch.findMany({
      where: { organizationId: orgId },
      include: {
        workLocations: true,
        _count: { select: { employees: true } }
      }
    });
    res.json({ success: true, data: branches });
  } catch (err) {
    next(err);
  }
}

export async function createBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const { code, name, address, city, state, country, timezone } = req.body;

    const branch = await prisma.branch.create({
      data: {
        organizationId: orgId,
        code,
        name,
        address,
        city,
        state,
        country,
        timezone
      }
    });

    await logAudit({
      organizationId: orgId,
      userId: req.user?.id,
      module: 'ORGANIZATION',
      action: 'CREATE_BRANCH',
      entityName: 'Branch',
      entityId: branch.id,
      newValue: branch
    });

    res.status(201).json({ success: true, data: branch });
  } catch (err) {
    next(err);
  }
}

export async function getDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const departments = await prisma.department.findMany({
      where: { organizationId: orgId },
      include: {
        parentDept: true,
        headEmployee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, workEmail: true }
        },
        _count: { select: { employees: true } }
      }
    });
    res.json({ success: true, data: departments });
  } catch (err) {
    next(err);
  }
}

export async function createDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const { code, name, description, parentDeptId, headEmployeeId, costCenterId } = req.body;

    const dept = await prisma.department.create({
      data: {
        organizationId: orgId,
        code,
        name,
        description,
        parentDeptId: parentDeptId || null,
        headEmployeeId: headEmployeeId || null,
        costCenterId: costCenterId || null
      }
    });

    res.status(201).json({ success: true, data: dept });
  } catch (err) {
    next(err);
  }
}

export async function getDesignations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const designations = await prisma.designation.findMany({
      where: { organizationId: orgId },
      include: {
        _count: { select: { employees: true } }
      },
      orderBy: { level: 'desc' }
    });
    res.json({ success: true, data: designations });
  } catch (err) {
    next(err);
  }
}

export async function createDesignation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const { code, title, level, description } = req.body;

    const desig = await prisma.designation.create({
      data: {
        organizationId: orgId,
        code,
        title,
        level: Number(level) || 1,
        description
      }
    });

    res.status(201).json({ success: true, data: desig });
  } catch (err) {
    next(err);
  }
}

export async function getOrganizationHierarchy(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    // Build tree: Get all managers and employees
    const employees = await prisma.employee.findMany({
      where: { organizationId: orgId, status: 'ACTIVE' },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        workEmail: true,
        profilePicture: true,
        managerId: true,
        designation: { select: { title: true } },
        department: { select: { name: true } }
      }
    });

    res.json({ success: true, data: employees });
  } catch (err) {
    next(err);
  }
}

export async function updateOrganizationDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const { name, legalName, taxId, contactEmail, contactPhone, address, city, state, country, timezone, currency } = req.body;

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: {
        name: name ?? undefined,
        legalName: legalName ?? undefined,
        taxId: taxId ?? undefined,
        contactEmail: contactEmail ?? undefined,
        contactPhone: contactPhone ?? undefined,
        address: address ?? undefined,
        city: city ?? undefined,
        state: state ?? undefined,
        country: country ?? undefined,
        timezone: timezone ?? undefined,
        currency: currency ?? undefined,
      }
    });

    await logAudit({
      organizationId: orgId,
      userId: req.user?.id,
      module: 'ORGANIZATION',
      action: 'UPDATE_DETAILS',
      entityName: 'Organization',
      entityId: orgId,
      newValue: updated
    });

    res.json({ success: true, data: updated, message: 'Organization details updated successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function updateBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const { id } = req.params;
    const { name, code, address, city, state, country, timezone } = req.body;

    const updated = await prisma.branch.update({
      where: { id },
      data: {
        name: name ?? undefined,
        code: code ?? undefined,
        address: address ?? undefined,
        city: city ?? undefined,
        state: state ?? undefined,
        country: country ?? undefined,
        timezone: timezone ?? undefined,
      }
    });

    res.json({ success: true, data: updated, message: 'Branch updated successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function deleteBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const employeeCount = await prisma.employee.count({ where: { branchId: id } });
    if (employeeCount > 0) {
      res.status(400).json({ success: false, message: `Cannot delete branch with ${employeeCount} active assigned employees.` });
      return;
    }

    await prisma.branch.delete({ where: { id } });
    res.json({ success: true, message: 'Branch deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function updateDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { name, code, description, headEmployeeId } = req.body;

    const updated = await prisma.department.update({
      where: { id },
      data: {
        name: name ?? undefined,
        code: code ?? undefined,
        description: description ?? undefined,
        headEmployeeId: headEmployeeId === '' ? null : (headEmployeeId ?? undefined),
      }
    });

    res.json({ success: true, data: updated, message: 'Department updated successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function deleteDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const employeeCount = await prisma.employee.count({ where: { departmentId: id } });
    if (employeeCount > 0) {
      res.status(400).json({ success: false, message: `Cannot delete department with ${employeeCount} assigned employees.` });
      return;
    }

    await prisma.department.delete({ where: { id } });
    res.json({ success: true, message: 'Department deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function updateDesignation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { title, code, level, description } = req.body;

    const updated = await prisma.designation.update({
      where: { id },
      data: {
        title: title ?? undefined,
        code: code ?? undefined,
        level: level ? Number(level) : undefined,
        description: description ?? undefined,
      }
    });

    res.json({ success: true, data: updated, message: 'Designation updated successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function deleteDesignation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const employeeCount = await prisma.employee.count({ where: { designationId: id } });
    if (employeeCount > 0) {
      res.status(400).json({ success: false, message: `Cannot delete designation with ${employeeCount} assigned employees.` });
      return;
    }

    await prisma.designation.delete({ where: { id } });
    res.json({ success: true, message: 'Designation deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

