import { Router } from 'express';
import { signup, login, searchUsers } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/search', authenticateToken as any, searchUsers);

export default router;
