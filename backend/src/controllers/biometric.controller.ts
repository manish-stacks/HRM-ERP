import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import {
  encryptBiometricDescriptor,
  decryptBiometricDescriptor,
  calculateCosineSimilarity
} from '../services/biometric.service.js';
import { logAudit } from '../utils/audit.js';

export async function submitConsent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { employeeId, consentText } = req.body;
    const targetEmployeeId = employeeId || req.user?.employeeId;

    if (!targetEmployeeId) {
      res.status(400).json({ success: false, message: 'Employee ID required.' });
      return;
    }

    const consent = await prisma.biometricConsentRecord.upsert({
      where: { employeeId: targetEmployeeId },
      update: {
        hasConsented: true,
        consentText: consentText || 'I explicitly consent to facial biometric capture for enterprise attendance verification.',
        ipAddress: req.ip,
        consentedAt: new Date(),
        revokedAt: null
      },
      create: {
        employeeId: targetEmployeeId,
        hasConsented: true,
        consentText: consentText || 'I explicitly consent to facial biometric capture for enterprise attendance verification.',
        ipAddress: req.ip
      }
    });

    res.json({ success: true, data: consent, message: 'Biometric consent registered successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function listEmployeesForEnrollment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let orgId = req.organizationId;
    if (!orgId) {
      const defaultOrg = await prisma.organization.findFirst();
      orgId = defaultOrg?.id;
    }
    const employees = await prisma.employee.findMany({
      where: { organizationId: orgId, status: 'ACTIVE' },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        workEmail: true,
        department: { select: { name: true } },
        biometricTemplates: {
          where: { isActive: true },
          select: { id: true, enrolledAt: true }
        }
      },
      orderBy: { firstName: 'asc' }
    });
    res.json({ success: true, data: employees });
  } catch (err) {
    next(err);
  }
}

export async function enrollFaceTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { employeeId, descriptor, modelVersion = 'ssd_mobilenet_v1_128d' } = req.body;
    const targetEmployeeId = employeeId || req.user?.employeeId;

    if (!targetEmployeeId || !Array.isArray(descriptor) || descriptor.length < 64) {
      res.status(400).json({
        success: false,
        message: 'Invalid biometric payload. 128-dimensional float descriptor array required.'
      });
      return;
    }

    let orgId = req.organizationId;
    const emp = await prisma.employee.findUnique({ where: { id: targetEmployeeId } });
    if (emp) orgId = emp.organizationId;
    if (!orgId) {
      const defaultOrg = await prisma.organization.findFirst();
      orgId = defaultOrg?.id;
    }

    const isAuthorizedAdmin = req.user?.roles.some((r: string) =>
      ['Super Admin', 'Org Admin', 'HR Admin', 'HR Manager'].includes(r)
    );

    // Anti-Fraud Rule 1: Employees cannot enroll for other employees
    if (!isAuthorizedAdmin && employeeId && employeeId !== req.user?.employeeId) {
      res.status(403).json({
        success: false,
        message: 'Security Violation: Employees are not permitted to register biometric profiles on behalf of other staff members.'
      });
      return;
    }

    // Anti-Fraud Rule 2: Once registered, biometric template is locked and cannot be overwritten by the employee
    const existingActiveTemplate = await prisma.biometricTemplate.findFirst({
      where: { employeeId: targetEmployeeId, isActive: true }
    });

    if (existingActiveTemplate && !isAuthorizedAdmin) {
      res.status(403).json({
        success: false,
        message: 'Biometric profile is locked for anti-fraud security. Once registered, only an authorized HR Administrator can reset or approve a face template re-enrollment.'
      });
      return;
    }

    // Auto-record consent if not already present
    await prisma.biometricConsentRecord.upsert({
      where: { employeeId: targetEmployeeId },
      update: { hasConsented: true, consentedAt: new Date() },
      create: {
        employeeId: targetEmployeeId,
        hasConsented: true,
        consentText: 'I explicitly consent to facial biometric capture for enterprise attendance verification.',
        ipAddress: req.ip
      }
    });

    // Encrypt the descriptor vector
    const encryptedData = encryptBiometricDescriptor(descriptor);

    // Deactivate previous templates for this employee
    await prisma.biometricTemplate.updateMany({
      where: { employeeId: targetEmployeeId },
      data: { isActive: false }
    });

    const template = await prisma.biometricTemplate.create({
      data: {
        employeeId: targetEmployeeId,
        modelVersion,
        embeddingData: encryptedData,
        isActive: true
      }
    });

    if (orgId) {
      await logAudit({
        organizationId: orgId,
        userId: req.user?.id || null,
        module: 'BIOMETRIC',
        action: 'ENROLL_TEMPLATE',
        entityName: 'BiometricTemplate',
        entityId: template.id,
        ipAddress: req.ip
      });
    }

    res.status(201).json({
      success: true,
      data: {
        id: template.id,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : undefined,
        modelVersion: template.modelVersion,
        enrolledAt: template.enrolledAt,
        isActive: true
      },
      message: 'Facial biometric template enrolled and saved successfully. The employee can now punch in directly via facial recognition without login credentials.'
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyFaceAndPunch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let orgId = req.organizationId;
    if (!orgId && req.body.orgId) {
      orgId = req.body.orgId;
    }
    if (!orgId) {
      const defaultOrg = await prisma.organization.findFirst();
      orgId = defaultOrg?.id;
    }

    if (!orgId) {
      res.status(400).json({ success: false, message: 'Organization not found.' });
      return;
    }

    const {
      descriptor,
      employeeId,
      punchType = 'CHECK_IN',
      livenessPassed = true,
      antiSpoofConfidence = 0.98
    } = req.body;

    if (!Array.isArray(descriptor) || descriptor.length < 64) {
      res.status(400).json({ success: false, message: 'Valid face descriptor required.' });
      return;
    }

    // Org settings threshold check
    const orgSettings = await prisma.organizationSettings.findUnique({
      where: { organizationId: orgId }
    });
    const threshold = Number(orgSettings?.biometricThreshold || 0.50);
    const requireLiveness = orgSettings?.requireLivenessCheck || false;

    if (requireLiveness && (!livenessPassed || antiSpoofConfidence < 0.85)) {
      res.status(422).json({
        success: false,
        message: 'Liveness / anti-spoofing check failed. Please ensure natural blinking and direct camera lighting.'
      });
      return;
    }

    // If specific employee provided, compare with their template; otherwise search all active templates in org
    let matchedEmployee: any = null;
    let highestSimilarity = 0;

    if (employeeId) {
      const template = await prisma.biometricTemplate.findFirst({
        where: { employeeId, isActive: true }
      });
      if (template) {
        const storedVector = decryptBiometricDescriptor(template.embeddingData);
        const similarity = calculateCosineSimilarity(descriptor, storedVector);
        if (similarity >= threshold) {
          highestSimilarity = similarity;
          matchedEmployee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: { department: true }
          });
        }
      }
    } else {
      // 1:N Identification across organization
      const activeTemplates = await prisma.biometricTemplate.findMany({
        where: {
          isActive: true,
          employee: { organizationId: orgId, status: 'ACTIVE' }
        },
        include: {
          employee: { include: { department: true } }
        }
      });

      for (const t of activeTemplates) {
        try {
          const storedVector = decryptBiometricDescriptor(t.embeddingData);
          const sim = calculateCosineSimilarity(descriptor, storedVector);
          if (sim > highestSimilarity) {
            highestSimilarity = sim;
            matchedEmployee = t.employee;
          }
        } catch (e) {
          continue;
        }
      }
    }

    if (!matchedEmployee || highestSimilarity < threshold) {
      res.status(401).json({
        success: false,
        message: `Face verification failed. Highest confidence (${(highestSimilarity * 100).toFixed(1)}%) was below required threshold (${(threshold * 100).toFixed(1)}%).`
      });
      return;
    }

    // Prevent duplicate punch within 2 minutes
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
    const recentPunch = await prisma.attendanceEvent.findFirst({
      where: {
        employeeId: matchedEmployee.id,
        timestamp: { gte: twoMinutesAgo }
      }
    });

    if (recentPunch) {
      res.status(429).json({
        success: false,
        message: `Duplicate punch detected. You already punched at ${recentPunch.timestamp.toLocaleTimeString()}.`
      });
      return;
    }

    // Record verified attendance event transactionally
    const todayDateOnly = new Date(now.toISOString().split('T')[0]);

    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.attendanceEvent.create({
        data: {
          employeeId: matchedEmployee.id,
          timestamp: now,
          eventType: punchType,
          source: 'FACIAL_RECOGNITION',
          biometricMatch: true,
          similarityScore: highestSimilarity,
          ipAddress: req.ip,
          notes: `Face verified with ${(highestSimilarity * 100).toFixed(1)}% match`
        }
      });

      let summary = await tx.attendanceDailySummary.findUnique({
        where: {
          employeeId_date: {
            employeeId: matchedEmployee.id,
            date: todayDateOnly
          }
        }
      });

      if (!summary) {
        summary = await tx.attendanceDailySummary.create({
          data: {
            employeeId: matchedEmployee.id,
            date: todayDateOnly,
            status: 'PRESENT',
            firstCheckIn: now,
            scheduledMinutes: 480,
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
      message: `Face identified! ${punchType === 'CHECK_IN' ? 'Check-in' : 'Check-out'} recorded for ${matchedEmployee.firstName} ${matchedEmployee.lastName}.`,
      data: {
        employee: {
          id: matchedEmployee.id,
          name: `${matchedEmployee.firstName} ${matchedEmployee.lastName}`,
          code: matchedEmployee.employeeCode,
          department: matchedEmployee.department?.name
        },
        similarityScore: (highestSimilarity * 100).toFixed(1) + '%',
        punchTime: now.toISOString(),
        punchType
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function revokeBiometricTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const isAuthorizedAdmin = req.user?.roles.some((r: string) =>
      ['Super Admin', 'Org Admin', 'HR Admin', 'HR Manager'].includes(r)
    );

    if (!isAuthorizedAdmin) {
      res.status(403).json({
        success: false,
        message: 'Security Violation: Only HR Administrators have permission to revoke or reset employee biometric templates.'
      });
      return;
    }

    const { employeeId } = req.body;
    const targetEmployeeId = employeeId || req.user?.employeeId;

    await prisma.biometricTemplate.updateMany({
      where: { employeeId: targetEmployeeId },
      data: { isActive: false, revokedAt: new Date() }
    });

    await prisma.biometricConsentRecord.updateMany({
      where: { employeeId: targetEmployeeId },
      data: { hasConsented: false, revokedAt: new Date() }
    });

    const orgId = req.user?.organizationId;
    if (orgId) {
      await logAudit({
        organizationId: orgId,
        userId: req.user?.id || null,
        module: 'BIOMETRIC',
        action: 'REVOKE_TEMPLATE',
        entityName: 'BiometricTemplate',
        entityId: targetEmployeeId,
        ipAddress: req.ip
      });
    }

    res.json({ success: true, message: 'Biometric template revoked and unlocked successfully. The employee can now re-enroll.' });
  } catch (err) {
    next(err);
  }
}

