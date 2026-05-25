import { Router } from 'express';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary,
} from '../controllers/transaction.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken as any);

router.post('/', createTransaction);
router.get('/', getTransactions);
router.get('/summary', getTransactionSummary);
router.get('/:id', getTransactionById);
router.patch('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
