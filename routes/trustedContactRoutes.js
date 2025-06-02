const express = require('express');
const router = express.Router();
const {
  createTrustedContact,
  getTrustedContacts,
  getTrustedContact,
  updateTrustedContact,
  deleteTrustedContact,
  updateVerificationDocument,
  updateContactStatus,
  updateLastContact
} = require('../controllers/trustedContactController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     VerificationDocument:
 *       type: object
 *       required:
 *         - document_type
 *         - document_url
 *       properties:
 *         document_type:
 *           type: string
 *           enum: [id, professional_license, death_certificate]
 *         document_url:
 *           type: string
 *         verified:
 *           type: boolean
 *         verified_date:
 *           type: string
 *           format: date-time
 *     TrustedContact:
 *       type: object
 *       required:
 *         - contact_id
 *         - full_name
 *         - email
 *         - phone
 *         - relationship
 *       properties:
 *         contact_id:
 *           type: string
 *           description: ID of the contact user
 *         full_name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         relationship:
 *           type: string
 *         profession:
 *           type: string
 *         verification_documents:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/VerificationDocument'
 *         permissions:
 *           type: object
 *           properties:
 *             can_verify_death:
 *               type: boolean
 *             can_release_messages:
 *               type: boolean
 *             can_modify_recipients:
 *               type: boolean
 *         status:
 *           type: string
 *           enum: [pending, verified, suspended]
 *         last_contact:
 *           type: string
 *           format: date-time
 *         emergency_contact:
 *           type: boolean
 */

/**
 * @swagger
 * /api/trusted-contacts:
 *   post:
 *     summary: Create a new trusted contact
 *     tags: [TrustedContacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TrustedContact'
 *     responses:
 *       201:
 *         description: Trusted contact created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get all trusted contacts for the authenticated user
 *     tags: [TrustedContacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of trusted contacts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TrustedContact'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/trusted-contacts/{id}:
 *   get:
 *     summary: Get a specific trusted contact
 *     tags: [TrustedContacts]
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
 *         description: Trusted contact details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TrustedContact'
 *       404:
 *         description: Trusted contact not found
 *       401:
 *         description: Unauthorized
 *   put:
 *     summary: Update a trusted contact
 *     tags: [TrustedContacts]
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
 *             $ref: '#/components/schemas/TrustedContact'
 *     responses:
 *       200:
 *         description: Trusted contact updated successfully
 *       404:
 *         description: Trusted contact not found
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Delete a trusted contact
 *     tags: [TrustedContacts]
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
 *         description: Trusted contact deleted successfully
 *       404:
 *         description: Trusted contact not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/trusted-contacts/{id}/documents/{documentId}:
 *   patch:
 *     summary: Update verification document status
 *     tags: [TrustedContacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: documentId
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
 *               - verified
 *             properties:
 *               verified:
 *                 type: boolean
 *               verified_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Document verification status updated successfully
 *       404:
 *         description: Document not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/trusted-contacts/{id}/status:
 *   patch:
 *     summary: Update trusted contact status
 *     tags: [TrustedContacts]
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
 *                 enum: [pending, verified, suspended]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Trusted contact not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/trusted-contacts/{id}/last-contact:
 *   patch:
 *     summary: Update last contact date
 *     tags: [TrustedContacts]
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
 *         description: Last contact date updated successfully
 *       404:
 *         description: Trusted contact not found
 *       401:
 *         description: Unauthorized
 */

// Create a new trusted contact
router.post('/', authenticateToken, createTrustedContact);

// Get all trusted contacts
router.get('/', authenticateToken, getTrustedContacts);

// Get a specific trusted contact
router.get('/:id', authenticateToken, getTrustedContact);

// Update a trusted contact
router.put('/:id', authenticateToken, updateTrustedContact);

// Delete a trusted contact
router.delete('/:id', authenticateToken, deleteTrustedContact);

// Update verification document
router.patch('/:id/documents/:documentId', authenticateToken, updateVerificationDocument);

// Update contact status
router.patch('/:id/status', authenticateToken, updateContactStatus);

// Update last contact date
router.patch('/:id/last-contact', authenticateToken, updateLastContact);

module.exports = router; 