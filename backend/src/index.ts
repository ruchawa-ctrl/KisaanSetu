import 'dotenv/config';
import express from 'express'; import cors from 'cors';
import authRoutes from './routes/auth'; import lotRoutes from './routes/lots'; import fpoRoutes from './routes/fpo'; import demandRoutes from './routes/demands'; import transactionRoutes from './routes/transactions'; import dashboardRoutes from './routes/dashboard'; import assistantRoutes from './routes/assistant'; import aiSaathiRoutes from './routes/aiSaathi';
const app = express(); app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || true })); app.use(express.json());
app.get('/health', (_req, res) => res.json({ service: 'kisaan-setu-api', status: 'ok' }));
app.use('/api/v1/auth', authRoutes); app.use('/api/v1/lots', lotRoutes); app.use('/api/v1/fpo', fpoRoutes); app.use('/api/v1/demands', demandRoutes); app.use('/api/v1/transactions', transactionRoutes); app.use('/api/v1/dashboard', dashboardRoutes); app.use('/api/v1', assistantRoutes); app.use('/api/v1/ai-saathi', aiSaathiRoutes);
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => res.status(500).json({ error: err.message || 'Internal server error' }));
app.listen(Number(process.env.PORT || 4000), () => console.log(`Kisaan Setu API listening on ${process.env.PORT || 4000}`));
