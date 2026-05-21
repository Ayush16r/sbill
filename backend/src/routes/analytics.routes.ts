import { Router } from 'express';
import { 
  getSummary, 
  getCategoryBreakdown, 
  getGroupComparison, 
  getInsights 
} from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all analytics routes
router.use(authenticateToken as any);

router.get('/summary', getSummary);
router.get('/categories', getCategoryBreakdown);
router.get('/groups', getGroupComparison);
router.get('/insights', getInsights);

export default router;
