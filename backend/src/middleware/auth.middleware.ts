import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'billsplit_super_secret_key_123!';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  // Expect format: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Access denied. Authorization token required.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
    };

    req.user = {
      id: decoded.id,
      email: decoded.email,
    };
    
    next();
  } catch (error) {
    return res.status(403).json({
      error: 'Invalid or expired authorization token.',
    });
  }
}
