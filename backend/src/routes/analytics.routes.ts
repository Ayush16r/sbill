import { Router } from 'express';
import { 
  getSummary, 
  getCategoryBreakdown, 
  getGroupComparison, 
  getInsights,
  getCashflow,
} from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all analytics routes
router.use(authenticateToken as any);

router.get('/summary', getSummary);
router.get('/categories', getCategoryBreakdown);
router.get('/groups', getGroupComparison);
router.get('/insights', getInsights);
router.get('/cashflow', getCashflow);

export default router;
