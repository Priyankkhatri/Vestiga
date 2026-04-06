import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import type { Request, Response, NextFunction } from 'express';
import * as db from '../db/store.js';

// Initialize Supabase client for the backend (server-side configuration)
const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

export interface AuthPayload {
  userId: string;
  email: string;
  tier: string;
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/** 
 * Verify Supabase JWT and attach user to request
 * This replaces the legacy custom jsonwebtoken verification
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    // We verify the token directly with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('[Auth Middleware] Supabase getUser failed:', error?.message || 'No user returned');
      res.status(401).json({ success: false, error: 'Invalid or expired session', detail: error?.message });
      return;
    }

    // Ensure user exists in our local DB and get their tier
    let localUser = await db.findUserById(user.id);
    
    if (!localUser) {
      // Auto-sync: Create local user record if it doesn't exist
      // Since it's a Supabase user, we don't need auth_hash/salt for local auth
      // but we need the record for items/tiers
      localUser = await db.createUser(
        user.email || '',
        'supabase_managed', 
        'not_applicable',
        { iterations: 0 },
        user.id
      );
    }

    req.user = {
      userId: user.id,
      email: user.email || '',
      tier: localUser.tier || 'free',
    };
    
    next();
  } catch (error) {
    console.error('[Auth Middleware] Verification failed:', error);
    res.status(401).json({ success: false, error: 'Authentication failed' });
  }
}

// Legacy helpers kept for compatibility if needed elsewhere, but marked as deprecated
/** @deprecated Use Supabase Auth on frontend */
export function generateAccessToken(payload: AuthPayload): string { return ''; }
/** @deprecated Use Supabase Auth on frontend */
export function generateRefreshToken(payload: AuthPayload): string { return ''; }
