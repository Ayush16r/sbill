import { Router } from 'express';
import {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
} from '../controllers/budget.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken as any);

router.post('/', createBudget);
router.get('/', getBudgets);
router.get('/:id', getBudgetById);
router.patch('/:id', updateBudget);
router.delete('/:id', deleteBudget);

export default router;
