const mongoose = require('mongoose');

/**
 * RefreshToken Model
 *
 * Stores long-lived refresh tokens in MongoDB.
 * Each login creates one record here.
 * When the user logs out or the token is rotated, the record is deleted.
 *
 * Why store in DB instead of just signing a JWT?
 * → So we can REVOKE tokens instantly (logout, ban, password change)
 *   without waiting for expiry. A signed-only JWT can't be revoked.
 */
const refreshTokenSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        // The actual refresh token string (hashed for security)
        token: {
            type: String,
            required: true,
            unique: true
        },
        // Hard expiry — TTL index auto-deletes the document from MongoDB
        // after this date so the DB never fills with stale tokens
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 } // MongoDB TTL index — auto-deletes at expiresAt
        },
        // Track where the token was issued from (useful for security audits)
        userAgent: {
            type: String,
            default: ''
        },
        ipAddress: {
            type: String,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = { RefreshToken };