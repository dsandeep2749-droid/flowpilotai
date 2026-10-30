import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../database/db.js';
import { config } from '../config/index.js';
import { AuditService } from '../services/auditService.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'MANAGER', 'OPERATOR']).default('OPERATOR'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export class AuthController {
  static async register(req: Request, res: Response) {
    const validated = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validated.password, salt);

    const user = await prisma.user.create({
      data: {
        email: validated.email,
        passwordHash,
        name: validated.name,
        role: validated.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.cookie('flowpilot_token', token, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await AuditService.log({
      eventType: 'USER_REGISTERED',
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      details: { name: user.name },
      ipAddress: req.ip,
    });

    return res.status(201).json({ user, token });
  }

  static async login(req: Request, res: Response) {
    const validated = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isMatch) {
      await AuditService.log({
        eventType: 'USER_LOGIN_FAILED',
        actorEmail: validated.email,
        outcome: 'FAILURE',
        details: { reason: 'Incorrect password' },
        ipAddress: req.ip,
      });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.cookie('flowpilot_token', token, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await AuditService.log({
      eventType: 'USER_LOGIN',
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      ipAddress: req.ip,
    });

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    });
  }

  static async logout(req: Request, res: Response) {
    if (req.user) {
      await AuditService.log({
        eventType: 'USER_LOGOUT',
        actorId: req.user.id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        ipAddress: req.ip,
      });
    }

    res.clearCookie('flowpilot_token');
    return res.json({ message: 'Successfully logged out' });
  }

  static async me(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.json({ user: req.user });
  }
}

