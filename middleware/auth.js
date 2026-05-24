import { verifyAccessToken } from '../utils/tokenUtils.js';

/**
 * Auth Middleware — updated for Access Token / Refresh Token system
 *
 * Reads the Authorization header:
 *   Authorization: Bearer <accessToken>
 *
 * Falls back to x-auth-token header for backward compatibility
 * with your existing Thunder Client tests.
 */
export default function auth(req, res, next) {
    // Support both Authorization: Bearer <token> and legacy x-auth-token header
    let token = null;

    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.headers['x-auth-token']) {
        token = req.headers['x-auth-token'];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }

    try {
        const decoded = verifyAccessToken(token);
        req.user = decoded; // { _id, role, email, iat, exp }
        next();
    } catch (err) {
        // Distinguish between expired and invalid for better frontend UX
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Access token expired. Please refresh.',
                code: 'TOKEN_EXPIRED' // frontend checks this to trigger /refresh
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};