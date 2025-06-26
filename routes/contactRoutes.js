const express = require('express');
const router = express.Router();
const { submitContact, getUserContactSubmissions, getAllContactSubmissions, updateContactStatus } = require('../controllers/contactController');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Contact:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         subject:
 *           type: string
 *         message:
 *           type: string
 *         phone:
 *           type: string
 *         category:
 *           type: string
 *           enum: [general, support, technical, billing, partnership, other]
 *         status:
 *           type: string
 *           enum: [new, in_progress, responded, closed]
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 */

/**
 * @swagger
 * /api/contact/submit:
 *   post:
 *     summary: Submit a contact form
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - subject
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *               phone:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [general, support, technical, billing, partnership, other]
 *     responses:
 *       201:
 *         description: Contact form submitted successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/submit', submitContact);

/**
 * @swagger
 * /api/contact/user-submissions:
 *   get:
 *     summary: Get user's contact submissions
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: User's contact submissions retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/user-submissions', authenticateToken, getUserContactSubmissions);

/**
 * @swagger
 * /api/contact/admin/submissions:
 *   get:
 *     summary: Get all contact submissions (Admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All contact submissions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/admin/submissions', authenticateToken, isAdmin, getAllContactSubmissions);

/**
 * @swagger
 * /api/contact/admin/submissions/{contactId}:
 *   put:
 *     summary: Update contact submission status (Admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               admin_notes:
 *                 type: string
 *               response_message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contact submission updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Contact submission not found
 */
router.put('/admin/submissions/:contactId', authenticateToken, isAdmin, updateContactStatus);

module.exports = router; 