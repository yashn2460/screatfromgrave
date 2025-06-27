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
 *                   deathVerification:
 *                     type: object
 *                     nullable: true
 *                     properties:
 *                       id:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [pending, waiting_for_release, verified]
 *                       deathDate:
 *                         type: string
 *                         format: date
 *                       verificationDate:
 *                         type: string
 *                         format: date
 *                       verifiedTrustees:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             trustee_id:
 *                               type: object
 *                               properties:
 *                                 full_name:
 *                                   type: string
 *                                 email:
 *                                   type: string
 *                             verification_date:
 *                               type: string
 *                               format: date
 *                             verification_notes:
 *                               type: string
 *                             verification_method:
 *                               type: string
 *                             place_of_death:
 *                               type: string
 *                       requiredTrustees:
 *                         type: number
 *                       verificationMethod:
 *                         type: string
 *                       placeOfDeath:
 *                         type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/', authenticateToken, listTrustees);

module.exports = router; 