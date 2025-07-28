const express = require('express');
const router = express.Router();
const { 
  createRecipient, 
  getRecipients, 
  getRecipient, 
  updateRecipient, 
  deleteRecipient,
  updateVerificationStatus,
  getRecipientPaymentStatus
} = require('../controllers/recipientController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Recipient:
 *       type: object
 *       required:
 *         - full_name
 *         - email
 *         - relationship
 *       properties:
 *         full_name:
 *           type: string
 *           description: Full name of the recipient
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the recipient
 *         phone:
 *           type: string
 *           description: Phone number of the recipient
 *         relationship:
 *           type: string
 *           description: Relationship with the recipient
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             zip_code:
 *               type: string
 *             country:
 *               type: string
 *         notification_preferences:
 *           type: object
 *           properties:
 *             email:
 *               type: boolean
 *             sms:
 *               type: boolean
 *             postal_mail:
 *               type: boolean
 *         verification_status:
 *           type: string
 *           enum: [pending, verified, failed]
 *         notes:
 *           type: string
 */

/**
 * @swagger
 * /api/recipients:
 *   post:
 *     summary: Create a new recipient
 *     tags: [Recipients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Recipient'
 *     responses:
 *       201:
 *         description: Recipient created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get all recipients for the authenticated user
 *     tags: [Recipients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recipients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Recipient'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/recipients/{id}:
 *   get:
 *     summary: Get a specific recipient
 *     tags: [Recipients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recipient details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipient'
 *       404:
 *         description: Recipient not found
 *       401:
 *         description: Unauthorized
 *   put:
 *     summary: Update a recipient
 *     tags: [Recipients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Recipient'
 *     responses:
 *       200:
 *         description: Recipient updated successfully
 *       404:
 *         description: Recipient not found
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Delete a recipient
 *     tags: [Recipients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recipient deleted successfully
 *       404:
 *         description: Recipient not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/recipients/{id}/verify:
 *   patch:
 *     summary: Update recipient verification status
 *     tags: [Recipients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, verified, failed]
 *     responses:
 *       200:
 *         description: Verification status updated successfully
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Recipient not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/recipients/{id}/payment-status:
 *   get:
 *     summary: Get recipient payment status
 *     tags: [Recipients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recipient payment status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [paid, unpaid, overdue]
 *                 last_payment_date:
 *                   type: string
 *                   format: date-time
 *                 next_payment_date:
 *                   type: string
 *                   format: date-time
 *                 amount_due:
 *                   type: number
 *                 currency:
 *                   type: string
 *                 notes:
 *                   type: string
 *       404:
 *         description: Recipient not found
 *       401:
 *         description: Unauthorized
 */

// Create a new recipient
router.post('/', authenticateToken, createRecipient);

// Get all recipients
router.get('/', authenticateToken, getRecipients);

// Get a specific recipient
router.get('/:id', authenticateToken, getRecipient);

// Update a recipient
router.put('/:id', authenticateToken, updateRecipient);

// Delete a recipient
router.delete('/:id', authenticateToken, deleteRecipient);

// Update verification status
router.patch('/:id/verify', authenticateToken, updateVerificationStatus);

// Get recipient payment status
router.get('/:id/payment-status', authenticateToken, getRecipientPaymentStatus);

module.exports = router; 