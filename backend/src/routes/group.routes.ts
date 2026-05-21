import { Router } from 'express';
import { 
  createGroup, 
  getGroups, 
  getGroupDetails, 
  joinGroupByCode, 
  getGroupBalances,
  settleAllGroupDebts
} from '../controllers/group.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all group endpoints
router.use(authenticateToken as any);

router.post('/', createGroup);
router.get('/', getGroups);
router.post('/join', joinGroupByCode);
router.get('/:id', getGroupDetails);
router.get('/:id/balances', getGroupBalances);
router.post('/:id/settle', settleAllGroupDebts);

export default router;
