const express = require('express');
const router = express.Router();
const { listTrustees } = require('../controllers/trusteeController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/trustees:
 *   get:
 *     summary: Get all users who have the authenticated user as a trusted contact
 *     tags: [Trustee]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   givenName:
 *                     type: string
 *                   familyName:
 *                     type: string
 *                   picture:
 *                     type: string
 *                   emailVerified:
 *                     type: boolean
 *                   createdAt:
 *                     type: string
 *                   lastLogin:
 *                     type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/', authenticateToken, listTrustees);

module.exports = router; 