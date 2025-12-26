// backend/middleware/adminAuth.js
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const logger = require('../utils/logger');

const adminAuth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access denied. No token provided.' 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        
        // Check if user exists and is admin
        const userQuery = `
            SELECT ID, EMRI, SURNAME, EMAILI, ROLI, IS_VERIFIED, LAST_ACTIVE
            FROM USERS 
            WHERE ID = ? AND ROLI = 'admin' AND IS_VERIFIED = 1
        `;
        
        const result = await db.query(userQuery, [decoded.userId]);
        
        if (result.rows.length === 0) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. Admin privileges required.' 
            });
        }

        const user = result.rows[0];
        
        // Update last active timestamp
        await db.query(
            'UPDATE USERS SET LAST_ACTIVE = SYSTIMESTAMP WHERE ID = ?',
            [user.ID]
        );

        // Add user to request object
        req.user = {
            id: user.ID,
            name: user.EMRI,
            surname: user.SURNAME,
            email: user.EMAILI,
            role: user.ROLI
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token.' 
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expired.' 
            });
        }

        logger.error('Admin auth middleware error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during authentication.' 
        });
    }
};

module.exports = adminAuth;