import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';

export interface TokenPayload {
  userId: string;
  organizationId: string;
  email: string;
}

export interface AuthenticatedUser {
  id: string;
  organizationId: string;
  email: string;
  roles: string[];
  permissions: string[];
  employeeId?: string | null;
  departmentId?: string | null;
  branchId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      organizationId?: string;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      res.status(401).json({ success: false, message: 'Authentication required. No valid token found.' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'enterprise-hrm-super-secret-jwt-key-minimum-32-bytes';
    const decoded = jwt.verify(token, secret) as TokenPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
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
        employee: {
          select: {
            id: true,
            departmentId: true,
            branchId: true
          }
        }
      }
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'User account not found or deactivated.' });
      return;
    }

    const roles: string[] = [];
    const permissionsSet = new Set<string>();

    for (const ur of user.userRoles) {
      roles.push(ur.role.name);
      for (const rp of ur.role.rolePermissions) {
        permissionsSet.add(rp.permission.code);
      }
    }

    req.user = {
      id: user.id,
      organizationId: user.organizationId,
      email: user.email,
      roles,
      permissions: Array.from(permissionsSet),
      employeeId: user.employee?.id || null,
      departmentId: user.employee?.departmentId || null,
      branchId: user.employee?.branchId || null
    };

    req.organizationId = user.organizationId;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
}

