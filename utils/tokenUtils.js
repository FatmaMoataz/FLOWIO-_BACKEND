import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// ── Token lifetimes ────────────────────────────────────────────────────────────
const ACCESS_TOKEN_EXPIRY  = '15m';   // short-lived  — expires in 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';    // long-lived   — expires in 7 days
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms for MongoDB

// ── Generate Access Token ──────────────────────────────────────────────────────
// Short-lived JWT. Contains user info so middleware doesn't need a DB call.

const generateAccessToken = (user) => {
    return jwt.sign(
        {
            _id:  user._id,
            role: user.role,
            email: user.email
        },
        process.env.JWT_PRIVATE_KEY,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
};

// ── Generate Refresh Token ─────────────────────────────────────────────────────
// Random 64-byte hex string — NOT a JWT.
// Stored hashed in DB. Sent to client as raw value.

const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString('hex');
};

// ── Hash a refresh token before storing ───────────────────────────────────────
// Never store raw tokens in DB — if DB is breached, tokens are useless.

const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

// ── Verify Access Token ────────────────────────────────────────────────────────

const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_PRIVATE_KEY);
};

// ── Get expiry Date object for refresh token ───────────────────────────────────

const getRefreshTokenExpiry = () => {
    return new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
};

export {
    generateAccessToken,
    generateRefreshToken,
    hashToken,
    verifyAccessToken,
    getRefreshTokenExpiry,
    REFRESH_TOKEN_EXPIRY_MS
};