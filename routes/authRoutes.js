const express = require('express');
const router = express.Router();
const { handleGoogleLogin, getCurrentUser } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * 
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Authenticate user with Google
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credential
 *               - clientId
 *             properties:
 *               credential:
 *                 type: string
 *                 description: Google JWT token
 *               clientId:
 *                 type: string
 *                 description: Google Client ID
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     picture:
 *                       type: string
 *                 token:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.post('/google', handleGoogleLogin);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     picture:
 *                       type: string
 *                     givenName:
 *                       type: string
 *                     familyName:
 *                       type: string
 *                     emailVerified:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     lastLogin:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/me', authenticateToken, getCurrentUser);

module.exports = router; 