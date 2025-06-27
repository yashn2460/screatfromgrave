const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyDeath, getDeathVerificationStatus, getPendingVerifications, scheduleDeathVerification, triggerEmailNotifications, releaseVideoMessages } = require('../controllers/deathVerificationController');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/death-certificates/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only PDF, JPG, PNG files
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'image/jpeg' || 
        file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, and PNG files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     DeathVerification:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user_id:
 *           type: string
 *         trustee_id:
 *           type: string
 *         verification_type:
 *           type: string
 *           enum: [manual, scheduled, automatic]
 *         verification_method:
 *           type: string
 *           enum: [death_certificate, medical_report, official_document, other]
 *         status:
 *           type: string
 *           enum: [pending, verified, waiting_for_release, rejected, expired]
 *         death_date:
 *           type: string
 *           format: date
 *         place_of_death:
 *           type: string
 *         death_certificate_url:
 *           type: string
 *         verification_notes:
 *           type: string
 *         required_trustees:
 *           type: number
 *         verified_trustees:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               trustee_id:
 *                 type: string
 *               verification_date:
 *                 type: string
 *                 format: date
 *               verification_notes:
 *                 type: string
 *               verification_method:
 *                 type: string
 *                 enum: [death_certificate, medical_report, official_document, other]
 *               place_of_death:
 *                 type: string
 *         scheduled_verification_date:
 *           type: string
 *           format: date
 *         auto_verify_after_days:
 *           type: number
 */

/**
 * @swagger
 * /api/death-verification/verify:
 *   post:
 *     summary: Trustee verifies death of a user
 *     tags: [Death Verification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - verificationMethod
 *               - dateOfDeath
 *               - confirmVerification
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user whose death is being verified
 *               verificationMethod:
 *                 type: string
 *                 enum: [death_certificate, medical_report, official_document, other]
 *                 description: Method used to verify death
 *               dateOfDeath:
 *                 type: string
 *                 format: date
 *                 description: Date of death (YYYY-MM-DD)
 *               placeOfDeath:
 *                 type: string
 *                 description: Place where death occurred
 *               additionalNotes:
 *                 type: string
 *                 description: Additional notes about the verification
 *               confirmVerification:
 *                 type: boolean
 *                 description: Confirmation that the trustee is certain about the death verification
 *               deathCertificate:
 *                 type: string
 *                 format: binary
 *                 description: Death certificate file (PDF, JPG, PNG - max 5MB)
 *     responses:
 *       200:
 *         description: Death verification submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 deathVerification:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                     verifiedTrustees:
 *                       type: number
 *                     requiredTrustees:
 *                       type: number
 *                     verificationMethod:
 *                       type: string
 *                     dateOfDeath:
 *                       type: string
 *                     placeOfDeath:
 *                       type: string
 *       400:
 *         description: Missing required fields or invalid confirmation
 *       403:
 *         description: Trustee does not have permission to verify death
 *       500:
 *         description: Server error
 */
router.post('/verify', authenticateToken, upload.single('deathCertificate'), verifyDeath);

/**
 * @swagger
 * /api/death-verification/status/{userId}:
 *   get:
 *     summary: Get death verification status for a user
 *     tags: [Death Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: Death verification status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                   description: Status if no verification found
 *                 message:
 *                   type: string
 *                 deathVerification:
 *                   $ref: '#/components/schemas/DeathVerification'
 *       500:
 *         description: Server error
 */
router.get('/status/:userId', authenticateToken, getDeathVerificationStatus);

/**
 * @swagger
 * /api/death-verification/pending:
 *   get:
 *     summary: Get pending death verifications for the authenticated trustee
 *     tags: [Death Verification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending verifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 pendingVerifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DeathVerification'
 *       500:
 *         description: Server error
 */
router.get('/pending', authenticateToken, getPendingVerifications);

/**
 * @swagger
 * /api/death-verification/schedule:
 *   post:
 *     summary: Schedule death verification for automatic processing
 *     tags: [Death Verification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - scheduledDate
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user
 *               scheduledDate:
 *                 type: string
 *                 format: date
 *                 description: Date when verification should be processed
 *               autoVerifyAfterDays:
 *                 type: number
 *                 description: Days after scheduled date to auto-verify, default 30
 *     responses:
 *       200:
 *         description: Death verification scheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 deathVerification:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     scheduledDate:
 *                       type: string
 *                       format: date
 *                     autoVerifyAfterDays:
 *                       type: number
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/schedule', authenticateToken, scheduleDeathVerification);

/**
 * @swagger
 * /api/death-verification/trigger-emails/{userId}:
 *   post:
 *     summary: Manually trigger email notifications to recipients (Admin only)
 *     tags: [Death Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user whose recipients should be notified
 *     responses:
 *       200:
 *         description: Email notifications sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: No verified death verification found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/trigger-emails/:userId', authenticateToken, isAdmin, triggerEmailNotifications);

/**
 * @swagger
 * /api/death-verification/release/{userId}:
 *   post:
 *     summary: Release video messages after death verification (Trustee only)
 *     tags: [Death Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user whose video messages should be released
 *     responses:
 *       200:
 *         description: Video messages released successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 deathVerification:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                     verificationDate:
 *                       type: string
 *                       format: date
 *       400:
 *         description: No death verification found in waiting for release status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Trustee does not have permission
 *       500:
 *         description: Server error
 */
router.post('/release/:userId', authenticateToken, releaseVideoMessages);

module.exports = router; 