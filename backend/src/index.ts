import express, { Request, Response } from 'express';
import { checkDbConnection } from './db';
import healthRouter from './routes/health';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json());
app.use('/health', healthRouter);
// hello route removed

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`);
  console.log(`DB host: ${process.env.DB_HOST || 'not-set'} (DB_ALLOW_DEFAULTS=${process.env.DB_ALLOW_DEFAULTS || 'false'})`);
});
