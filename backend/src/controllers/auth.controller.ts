import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { logAudit } from '../utils/audit.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        },
        employee: true
      }
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Invalid credentials or inactive account.' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'enterprise-hrm-super-secret-jwt-key-minimum-32-bytes';
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'enterprise-hrm-super-secret-refresh-key-minimum-32';

    const token = jwt.sign(
      { userId: user.id, organizationId: user.organizationId, email: user.email },
      secret,
      { expiresIn: '1d' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, organizationId: user.organizationId },
      refreshSecret,
      { expiresIn: '7d' }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        refreshToken
      }
    });

    await logAudit({
      organizationId: user.organizationId,
      userId: user.id,
      module: 'AUTH',
      action: 'LOGIN',
      entityName: 'User',
      entityId: user.id,
      ipAddress: req.ip
    });

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = Array.from(
      new Set(user.userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.code)))
    );

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          organizationId: user.organizationId,
          organizationName: user.organization.name,
          roles,
          permissions,
          employee: user.employee ? {
            id: user.employee.id,
            employeeCode: user.employee.employeeCode,
            firstName: user.employee.firstName,
            lastName: user.employee.lastName,
            workEmail: user.employee.workEmail,
            departmentId: user.employee.departmentId,
            designationId: user.employee.designationId
          } : null
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        organization: {
          include: {
            settings: true
          }
        },
        employee: {
          include: {
            department: true,
            designation: true,
            branch: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        organizationId: user.organizationId,
        organization: user.organization,
        roles: req.user.roles,
        permissions: req.user.permissions,
        employee: user.employee
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { refreshToken: null }
      });

      await logAudit({
        organizationId: req.user.organizationId,
        userId: req.user.id,
        module: 'AUTH',
        action: 'LOGOUT',
        entityName: 'User',
        entityId: req.user.id,
        ipAddress: req.ip
      });
    }

    res.clearCookie('access_token');
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
}

