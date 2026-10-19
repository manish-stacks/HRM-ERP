import { Request, Response, NextFunction } from 'express';

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Super Admin has all privileges
    if (req.user.roles.includes('Super Admin')) {
      return next();
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient role permissions for this operation.'
      });
      return;
    }

    next();
  };
}

export function requirePermission(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Super Admin has all privileges
    if (req.user.roles.includes('Super Admin')) {
      return next();
    }

    const hasAll = requiredPermissions.every((perm) => req.user?.permissions.includes(perm));
    if (!hasAll) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Missing required permission [${requiredPermissions.join(', ')}]`
      });
      return;
    }

    next();
  };
}

