import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';

export async function listTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, category } = req.query;
    const where: any = {};
    if (status) where.status = String(status);
    if (category) where.category = String(category);

    const tickets = await prisma.helpdeskTicket.findMany({
      where,
      include: {
        createdBy: { select: { id: true, email: true, employee: { select: { firstName: true, lastName: true } } } },
        assignedTo: { select: { id: true, email: true } },
        comments: { include: { user: { select: { email: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: tickets });
  } catch (err) {
    next(err);
  }
}

export async function createTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id!;
    const { category, priority = 'MEDIUM', subject, description } = req.body;

    const count = await prisma.helpdeskTicket.count();
    const ticketNumber = `TICK-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const ticket = await prisma.helpdeskTicket.create({
      data: {
        ticketNumber,
        category,
        priority,
        subject,
        description,
        createdById: userId,
        status: 'OPEN'
      }
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
}

export async function addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id!;
    const { comment } = req.body;

    const newComment = await prisma.ticketComment.create({
      data: {
        ticketId: id,
        userId,
        comment
      },
      include: { user: { select: { email: true } } }
    });

    res.status(201).json({ success: true, data: newComment });
  } catch (err) {
    next(err);
  }
}

export async function updateTicketStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await prisma.helpdeskTicket.update({
      where: { id },
      data: { status }
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

