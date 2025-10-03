import { Router, Request, Response } from 'express';
import { syncController } from './controller';
import { pullValidators, pushValidators } from './validators';

/**
 * Sync Routes
 * API routes for offline synchronization
 */

const router = Router();

/**
 * POST /sync/pull
 * Pull server changes since last sync timestamp
 */
router.post('/pull', pullValidators, (req: Request, res: Response) => {
  void syncController.pull(req, res);
});

/**
 * POST /sync/push
 * Push local changes to server with conflict detection
 */
router.post('/push', pushValidators, (req: Request, res: Response) => {
  void syncController.push(req, res);
});

export default router;
