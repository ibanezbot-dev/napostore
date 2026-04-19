import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'napostore-fallback-secret';
const secret = new TextEncoder().encode(JWT_SECRET);

/**
 * Signs a JWT token with the given payload.
 * @param {object} payload
 * @param {string} expiresIn - e.g. '8h'
 * @returns {Promise<string>}
 */
export async function signToken(payload, expiresIn = '8h') {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

/**
 * Verifies a JWT token and returns the payload.
 * @param {string} token
 * @returns {Promise<object>}
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the JWT from a request's cookie.
 * @param {Request} request
 * @returns {Promise<object|null>}
 */
export async function getAuthFromRequest(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [key, ...val] = c.trim().split('=');
      return [key, decodeURIComponent(val.join('='))];
    })
  );
  const token = cookies['napostore_token'];
  if (!token) return null;
  return verifyToken(token);
}
