import { Router } from 'express';
import {
  createAccount,
  getAccounts,
  updateAccount,
  deleteAccount,
} from '../controllers/account.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken as any);

router.post('/', createAccount);
router.get('/', getAccounts);
router.patch('/:id', updateAccount);
router.delete('/:id', deleteAccount);

export default router;
