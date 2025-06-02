const express = require('express');
const router = express.Router();
const { createVideoMessage, getVideoMessages, getVideoMessage, updateVideoMessage, deleteVideoMessage } = require('../controllers/videoMessageController');
const { authenticateToken } = require('../middleware/authMiddleware');
 // Assuming you have an auth middleware

/**
 * @swagger
 * components:
 *   schemas:
 *     VideoMessage:
 *       type: object
 *       required:
 *         - title
 *         - video
 *         - encryption_key
 *         - release_conditions
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the video message
 *         description:
 *           type: string
 *           description: Optional description of the video message
 *         video:
 *           type: string
 *           format: binary
 *           description: The video file to upload
 *         encryption_key:
 *           type: string
 *           description: Encrypted key for the video
 *         recipient_ids:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of recipient user IDs
 *         scheduled_release:
 *           type: string
 *           format: date-time
 *           description: Optional scheduled release date
 *         release_conditions:
 *           type: object
 *           required:
 *             - type
 *           properties:
 *             type:
 *               type: string
 *               enum: [death_verification, date_based, manual]
 *             verification_required:
 *               type: boolean
 *             trusted_contacts_required:
 *               type: integer
 */

/**
 * @swagger
 * /api/video-messages:
 *   post:
 *     summary: Create a new video message
 *     tags: [VideoMessages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/VideoMessage'
 *     responses:
 *       201:
 *         description: Video message created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get all video messages for the authenticated user
 *     tags: [VideoMessages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of video messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/VideoMessage'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/video-messages/{id}:
 *   get:
 *     summary: Get a specific video message
 *     tags: [VideoMessages]
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
 *         description: Video message details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VideoMessage'
 *       404:
 *         description: Video message not found
 *       401:
 *         description: Unauthorized
 *   put:
 *     summary: Update a video message
 *     tags: [VideoMessages]
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
 *             $ref: '#/components/schemas/VideoMessage'
 *     responses:
 *       200:
 *         description: Video message updated successfully
 *       404:
 *         description: Video message not found
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Delete a video message
 *     tags: [VideoMessages]
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
 *         description: Video message deleted successfully
 *       404:
 *         description: Video message not found
 *       401:
 *         description: Unauthorized
 */

// Create a new video message
router.post('/', authenticateToken, createVideoMessage);

// Get all video messages
router.get('/', authenticateToken, getVideoMessages);

// Get a specific video message
router.get('/:id', authenticateToken, getVideoMessage);

// Update a video message
router.put('/:id', authenticateToken, updateVideoMessage);

// Delete a video message
router.delete('/:id', authenticateToken, deleteVideoMessage);

module.exports = router; 