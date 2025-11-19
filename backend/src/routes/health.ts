import { Router, Request, Response } from 'express';
import { checkDbConnection } from '../db';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const ok = await checkDbConnection();
  if (ok) return res.json({ status: 'ok' });
  return res.status(503).json({ status: 'unhealthy', reason: 'db-unreachable' });
});

export default router;
