import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';

export async function listAnnouncements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const announcements = await prisma.announcement.findMany({
      where: { organizationId: orgId, isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: announcements });
  } catch (err) {
    next(err);
  }
}

export async function createAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const { title, content, priority = 'NORMAL', targetAudience = 'ALL' } = req.body;

    const announcement = await prisma.announcement.create({
      data: {
        organizationId: orgId,
        title,
        content,
        priority,
        targetAudience
      }
    });

    res.status(201).json({ success: true, data: announcement });
  } catch (err) {
    next(err);
  }
}

export async function listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id!;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
}

export async function markNotificationAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    next(err);
  }
}

