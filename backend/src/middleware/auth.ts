import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
export type AuthRequest = Request & { user?: { id: string; role: string } };
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) { const token = req.headers.authorization?.replace('Bearer ', ''); if (!token) return res.status(401).json({ error: 'Authentication required' }); try { req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as { id: string; role: string }; next(); } catch { return res.status(401).json({ error: 'Invalid token' }); } }
