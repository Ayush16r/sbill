import { Router } from 'express';
import { 
  sendPayment, 
  getPaymentHistory, 
  getPaymentMethods, 
  addPaymentMethod, 
  removePaymentMethod 
} from '../controllers/payment.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all payment endpoints
router.use(authenticateToken as any);

router.post('/', sendPayment);
router.get('/', getPaymentHistory);
router.get('/methods', getPaymentMethods);
router.post('/methods', addPaymentMethod);
router.delete('/methods/:id', removePaymentMethod);

export default router;
