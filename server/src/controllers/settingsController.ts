import { Request, Response } from 'express';
import { config } from '../config/index.js';
import { prisma } from '../database/db.js';
import { AuditService } from '../services/auditService.js';
import { seedDatabase } from '../database/seeder.js';

export class SettingsController {
  static async getSettings(req: Request, res: Response) {
    const isLiveAiConfigured = Boolean(config.geminiApiKey && config.geminiApiKey.trim() !== '');
    const supabaseProject = process.env.SUPABASE_URL ? 'bbwkxypbomsajgxlckfr.supabase.co' : null;

    return res.json({
      environment: config.env,
      aiProvider: config.aiProvider,
      aiModel: config.aiModel,
      isLiveAiConfigured,
      demoModeActive: config.enableDemoMode || !isLiveAiConfigured,
      supabase: {
        configured: Boolean(process.env.SUPABASE_URL),
        project: supabaseProject,
        url: process.env.SUPABASE_URL || null,
      },
      features: {
        approvalGateEnabled: true,
        transientRecoveryEnabled: true,
        independentVerificationEnabled: true,
        auditTrailEnabled: true,
      },
    });
  }

  static async resetDemoData(req: Request, res: Response) {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can reset demo data.' });
    }

    try {
      await seedDatabase();

      await AuditService.log({
        eventType: 'DEMO_DATA_RESET',
        actorId: req.user.id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        details: { action: 'Database reseeded to default demonstration state' },
      });

      return res.json({ message: 'Demonstration dataset reseeded successfully.' });
    } catch (err: any) {
      console.error('[Reset Demo Data Error]', err);
      return res.status(500).json({ error: `Failed to reset demo data: ${err.message}` });
    }
  }
}
