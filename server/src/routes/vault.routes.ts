import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import * as db from '../db/store.js';

const router = Router();

// All vault routes require authentication
router.use(authMiddleware);

// ─── Validation ─────────────────────────────────────────────────

const createItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  username: z.string().optional(),
  password: z.string().optional(),
  type: z.string(),
  favorite: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().optional()
});

const updateItemSchema = z.object({
  title: z.string().min(1),
  username: z.string().optional(),
  password: z.string().optional(),
  type: z.string(),
  favorite: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),
  version: z.number().int().positive(),
});

// ─── GET /api/vault/items ───────────────────────────────────────

router.get('/items', async (req: Request, res: Response): Promise<void> => {
  try {
    const items = await db.getVaultItems(req.user!.userId);

    await db.createAuditLog(req.user!.userId, 'vault_access', { action: 'list' }, req.ip || '', req.headers['user-agent'] as string || '');

    res.json({
      success: true,
      data: items.map(item => ({
        id: item.id,
        title: item.title,
        username: item.username,
        password: item.password,
        type: item.type,
        favorite: item.favorite,
        tags: item.tags,
        notes: item.notes,
        version: item.version,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })),
    });
  } catch (error) {
    console.error('[Vault] List error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── POST /api/vault/items ──────────────────────────────────────

router.post('/items', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = createItemSchema.parse(req.body);

    const item = await db.createVaultItem(
      req.user!.userId,
      body.id,
      body.title,
      body.username,
      body.password,
      body.type,
      body.favorite,
      body.tags,
      body.notes
    );

    await db.createAuditLog(req.user!.userId, 'vault_create', { itemType: body.type }, req.ip || '', req.headers['user-agent'] as string || '');

    res.status(201).json({
      success: true,
      data: {
        id: item.id,
        version: item.version,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Invalid input', details: error.errors });
      return;
    }
    console.error('[Vault] Create error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── PUT /api/vault/items/:id ───────────────────────────────────

router.put('/items/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = updateItemSchema.parse(req.body);

    const result = await db.updateVaultItem(
      req.user!.userId,
      req.params.id,
      body.title,
      body.username,
      body.password,
      body.type,
      body.favorite,
      body.tags,
      body.notes,
      body.version
    );

    if (!result) {
      res.status(404).json({ success: false, error: 'Item not found' });
      return;
    }

    if ('conflict' in result) {
      res.status(409).json({
        success: false,
        error: 'Version conflict',
        serverVersion: result.serverVersion,
      });
      return;
    }

    await db.createAuditLog(req.user!.userId, 'vault_update', { itemId: req.params.id }, req.ip || '', req.headers['user-agent'] as string || '');

    res.json({
      success: true,
      data: { id: result.id, version: result.version, updatedAt: result.updated_at },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Invalid input' });
      return;
    }
    console.error('[Vault] Update error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── DELETE /api/vault/items/:id ────────────────────────────────

router.delete('/items/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await db.deleteVaultItem(req.user!.userId, req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Item not found' });
      return;
    }

    await db.createAuditLog(req.user!.userId, 'vault_delete', { itemId: req.params.id }, req.ip || '', req.headers['user-agent'] as string || '');

    res.json({ success: true });
  } catch (error) {
    console.error('[Vault] Delete error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── POST /api/vault/sync ───────────────────────────────────────

router.post('/sync', async (req: Request, res: Response): Promise<void> => {
  try {
    const items = await db.getVaultItems(req.user!.userId);

    res.json({
      success: true,
      data: {
        items: items.map(item => ({
          id: item.id,
          title: item.title,
          username: item.username,
          password: item.password,
          type: item.type,
          favorite: item.favorite,
          tags: item.tags,
          notes: item.notes,
          version: item.version,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        })),
        syncTimestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Vault] Sync error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
