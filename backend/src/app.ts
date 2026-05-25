import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import groupRoutes from './routes/group.routes';
import expenseRoutes from './routes/expense.routes';
import paymentRoutes from './routes/payment.routes';
import analyticsRoutes from './routes/analytics.routes';
import transactionRoutes from './routes/transaction.routes';
import budgetRoutes from './routes/budget.routes';
import accountRoutes from './routes/account.routes';

// Load environmental variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware configuration
app.use(cors({
  origin: '*', // Allow all cross-origins for mobile access
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request log middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Primary REST resource endpoints
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/accounts', accountRoutes);

// General health check status endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    app: 'BillSplit Premium social fintech API',
    version: '1.0.0',
    time: new Date(),
  });
});

// Wildcard 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Cannot find path ${req.method} ${req.path}` });
});

// Unified express global error-catcher
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error. Something went wrong.',
  });
});

// Start the server
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 BillSplit Server running on port ${PORT}`);
  console.log(`👉 Health check: http://localhost:${PORT}/`);
});

export default app;
