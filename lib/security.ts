/**
 * Security utilities for input validation and sanitization
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remove any HTML tags
  const sanitized = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [] 
  });
  
  return sanitized.trim();
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une lettre majuscule');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une lettre minuscule');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate username format
 */
export function validateUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_.-]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * Prevent SQL injection by validating input
 */
export function sanitizeSQL(input: string): string {
  if (!input) return '';
  
  // Remove potentially dangerous characters
  return input
    .replace(/[;\'"\\]/g, '')
    .trim();
}

/**
 * Validate and sanitize URLs
 */
export function sanitizeURL(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }
    
    return urlObj.toString();
  } catch {
    return null;
  }
}

/**
 * Rate limiting helper
 */
export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, number[]>();
  
  return (identifier: string): boolean => {
    const now = Date.now();
    const timestamps = requests.get(identifier) || [];
    
    // Remove old timestamps outside the window
    const recentTimestamps = timestamps.filter(ts => now - ts < windowMs);
    
    if (recentTimestamps.length < maxRequests) {
      recentTimestamps.push(now);
      requests.set(identifier, recentTimestamps);
      return true;
    }
    
    return false;
  };
};

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  allowedTypes: string[],
  maxSize: number
): { isValid: boolean; error?: string } {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: `Type de fichier non autorisé. Acceptés: ${allowedTypes.join(', ')}` 
    };
  }
  
  // Check file size
  if (file.size > maxSize) {
    return { 
      isValid: false, 
      error: `Taille du fichier trop grande. Maximum: ${maxSize / 1024 / 1024}MB` 
    };
  }
  
  // Check filename for suspicious patterns
  const filename = sanitizeInput(file.name);
  if (filename !== file.name) {
    return { 
      isValid: false, 
      error: 'Le nom du fichier contient des caractères non autorisés' 
    };
  }
  
  return { isValid: true };
}
