/**
 * API Security Middleware
 * Protects against common security vulnerabilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Rate limiting store (in production, use Redis)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiter middleware
 */
export function rateLimitMiddleware(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  return (req: NextRequest) => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    
    const limitData = rateLimitStore.get(ip) || { count: 0, resetTime: now + windowMs };
    
    if (now > limitData.resetTime) {
      limitData.count = 0;
      limitData.resetTime = now + windowMs;
    }
    
    limitData.count++;
    rateLimitStore.set(ip, limitData);
    
    if (limitData.count > maxRequests) {
      return NextResponse.json(
        { error: 'Trop de requêtes, veuillez réessayer plus tard.' },
        { status: 429 }
      );
    }
    
    return null;
  };
}

/**
 * Authentication middleware
 */
export async function authMiddleware(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Non authentifié' },
      { status: 401 }
    );
  }
  
  return null;
}

/**
 * CORS middleware
 */
export function corsMiddleware(req: NextRequest, allowedOrigins: string[] = []) {
  const origin = req.headers.get('origin');
  
  const defaultOrigins = process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com']
    : ['http://localhost:3000'];
    
  const allowedSet = new Set([...defaultOrigins, ...allowedOrigins]);
  
  if (origin && !allowedSet.has(origin)) {
    return NextResponse.json(
      { error: 'CORS non autorisé' },
      { status: 403 }
    );
  }
  
  return null;
}

/**
 * Input validation middleware
 */
export function validateInput(data: Record<string, any>, schema: Record<string, any>) {
  const errors: Record<string, string> = {};
  
  for (const [key, validator] of Object.entries(schema)) {
    const value = data[key];
    
    if (validator.required && (!value || value.toString().trim() === '')) {
      errors[key] = `${key} est requis`;
      continue;
    }
    
    if (validator.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        errors[key] = 'Email invalide';
      }
    }
    
    if (validator.type === 'string' && validator.minLength) {
      if (value && value.length < validator.minLength) {
        errors[key] = `La longueur minimale est ${validator.minLength}`;
      }
    }
    
    if (validator.type === 'string' && validator.maxLength) {
      if (value && value.length > validator.maxLength) {
        errors[key] = `La longueur maximale est ${validator.maxLength}`;
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  return response;
}

/**
 * Request ID tracking
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
