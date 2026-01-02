import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'default-dev-secret-do-not-use-in-prod';
const JWT_ALG = 'HS256'; // Using HMAC for simplicity, can upgrade to RS256 if needed

// Password Management
export async function hashPassword(password) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
}

export async function verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
}

// Token Management
export async function createSessionToken(payload) {
    const secret = new TextEncoder().encode(JWT_SECRET);
    return new SignJWT(payload)
        .setProtectedHeader({ alg: JWT_ALG })
        .setIssuedAt()
        .setExpirationTime('8h')
        .sign(secret);
}

export async function verifySessionToken(token) {
    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (error) {
        return null;
    }
}

// Cookie Management
export async function setSessionCookie(token) {
    cookies().set('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60, // 8 hours
        path: '/',
    });
}

export async function clearSessionCookie() {
    cookies().delete('session_token');
}

export async function getSession() {
    const token = cookies().get('session_token')?.value;
    if (!token) return null;
    return verifySessionToken(token);
}

// Password Validation
export function validatePasswordStrength(password) {
    const minLength = 12;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) return { valid: false, message: 'Password must be at least 12 characters long' };
    if (!hasUpperCase) return { valid: false, message: 'Password must contain at least one uppercase letter' };
    if (!hasLowerCase) return { valid: false, message: 'Password must contain at least one lowercase letter' };
    if (!hasNumbers) return { valid: false, message: 'Password must contain at least one number' };
    if (!hasSpecialChar) return { valid: false, message: 'Password must contain at least one special character' };

    return { valid: true };
}
