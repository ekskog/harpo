import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health'; // assuming you have this route

const app = express();
const port = process.env.PORT || 3000;

// Enable JSON parsing
app.use(express.json());

// ✅ Add CORS middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-frontend-domain.com'], // allow dev and prod frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// Health route
app.use('/health', healthRouter);

// Start server
app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
  console.log(`DB host: ${process.env.DB_HOST || 'not-set'} (DB_ALLOW_DEFAULTS=${process.env.DB_ALLOW_DEFAULTS || 'false'})`);
});