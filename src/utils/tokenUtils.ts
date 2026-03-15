/**
 * Utility functions for JWT token handling
 * Decodes access tokens to extract role_id and user information
 */

export interface TokenPayload {
  sub: string; // user_id
  role_id?: number | string;
  role?: string;
  iat: number;
  exp: number;
  jti: string;
  type: 'access' | 'refresh';
  [key: string]: any;
}

/**
 * Map role name (string) to role ID (number)
 * Handles cases where backend sends role as string instead of numeric ID
 */
const mapRoleNameToId = (role: string | number | undefined): number | null => {
  if (typeof role === 'number') {
    return role;
  }
  if (typeof role === 'string') {
    const lowerRole = role.toLowerCase().trim();
    if (lowerRole === 'admin') return 1;
    if (lowerRole === 'recruiter') return 2;
  }
  return null;
};

/**
 * Decode JWT token (works for HS256 tokens without verification on frontend)
 * Frontend decoding is safe for reading claims but should always verify on backend
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    if (!token) {
      console.error('Token is empty or undefined');
      return null;
    }

    // Split token and get payload
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format - expected 3 parts');
      return null;
    }

    // Decode payload (base64url to base64)
    const payload = parts[1];
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = atob(padded);
    const parsed = JSON.parse(decoded);

    console.log('Decoded token payload:', parsed);
    return parsed as TokenPayload;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

/**
 * Extract role_id from access token
 * Returns 1 for admin, 2 for recruiter, null for invalid tokens
 * Handles both numeric and string role values
 */
export const getRoleIdFromToken = (token: string): number | null => {
  const payload = decodeToken(token);
  if (!payload) {
    console.error('Failed to decode payload');
    return null;
  }

  // Try role_id field first (numeric)
  let roleId = payload.role_id;
  
  // If role_id is not a number, try mapping role name
  if (!roleId || typeof roleId !== 'number') {
    roleId = payload.role;
    console.log('role_id not numeric, attempting to map role:', roleId);
  }
  
  const numericRoleId = mapRoleNameToId(roleId);
  console.log('Extracted role_id from token:', numericRoleId, '(original:', roleId, ')');
  
  return numericRoleId;
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) {
    return true;
  }
  // exp is in seconds, current time in ms
  return payload.exp * 1000 < Date.now();
};

/**
 * Get user_id (sub) from token
 */
export const getUserIdFromToken = (token: string): string | null => {
  const payload = decodeToken(token);
  return payload?.sub || null;
};
