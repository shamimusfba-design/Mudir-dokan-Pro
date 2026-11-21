import type { Request, Response, NextFunction } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import crypto from 'crypto';
import { adminAuth } from '../lib/firebase-admin.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  storeId?: number;
  staffRole?: 'OWNER' | 'MANAGER' | 'CASHIER';
}

export interface PortalRequest extends Request {
  portalCustomer?: {
    customerId: number;
    storeId: number;
    phone: string;
  };
}

const PORTAL_TOKEN_SECRET =
  process.env.PORTAL_SESSION_SECRET ||
  crypto.createHash('sha256').update(`${process.env.SQL_DB_NAME || 'mudirdokan'}-portal-hmac-v1`).digest('hex');

export function signPortalToken(payload: { customerId: number; storeId: number; phone: string }): string {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', PORTAL_TOKEN_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyPortalToken(token: string): { customerId: number; storeId: number; phone: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [body, sig] = parts;
    const expected = crypto.createHmac('sha256', PORTAL_TOKEN_SECRET).update(body).digest('base64url');
    if (sig.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!decoded.exp || decoded.exp < Date.now()) return null;
    if (!decoded.customerId || !decoded.storeId) return null;
    return {
      customerId: Number(decoded.customerId),
      storeId: Number(decoded.storeId),
      phone: String(decoded.phone || ''),
    };
  } catch {
    return null;
  }
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const requirePortalAuth = (req: PortalRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Portal session required' });
  }
  const token = authHeader.split('Bearer ')[1];
  const payload = verifyPortalToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired portal session' });
  }
  req.portalCustomer = payload;
  next();
};
