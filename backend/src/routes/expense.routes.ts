import { Router } from 'express';
import { 
  createExpense, 
  getExpenses, 
  getExpenseDetails, 
  deleteExpense 
} from '../controllers/expense.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all expense endpoints
router.use(authenticateToken as any);

router.post('/', createExpense);
router.get('/', getExpenses);
router.get('/:id', getExpenseDetails);
router.delete('/:id', deleteExpense);

export default router;
