const express = require('express');
const router = express.Router();
const { 
  getAllUsers,
  getAllVideoMessages,
  getAllRecipients,
  getAllTrustedContacts,
  getUserDetails,
  triggerDeathVerificationCron,
  releaseVideoMessages,
  getAllDeathVerifications
} = require('../controllers/adminManagementController');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users with pagination, search, and filters
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *           default: "1"
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           default: "20"
 *         description: Number of users per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name, email, givenName, or familyName
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: "createdAt"
 *           enum: [createdAt, name, email, lastLogin]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           default: "desc"
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: emailVerified
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by email verification status
 *       - in: query
 *         name: hasVideos
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter users who have uploaded videos
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 users:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           givenName:
 *                             type: string
 *                           familyName:
 *                             type: string
 *                           picture:
 *                             type: string
 *                           emailVerified:
 *                             type: boolean
 *                           createdAt:
 *                             type: string
 *                           lastLogin:
 *                             type: string
 *                           videoCount:
 *                             type: number
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: number
 *                         totalPages:
 *                           type: number
 *                         totalUsers:
 *                           type: number
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: number
 *                     verifiedUsers:
 *                       type: number
 *                     unverifiedUsers:
 *                       type: number
 *                     usersWithVideos:
 *                       type: number
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/users', authenticateToken, getAllUsers);

/**
 * @swagger
 * /api/admin/video-messages:
 *   get:
 *     summary: Get all video messages with pagination, search, and filters
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *           default: "1"
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           default: "20"
 *         description: Number of videos per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title or description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: "upload_date"
 *           enum: [upload_date, title, duration, file_size]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           default: "desc"
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [mp4, mov, avi, wmv, flv, mkv]
 *         description: Filter by video format
 *       - in: query
 *         name: releaseType
 *         schema:
 *           type: string
 *           enum: [death_verification, date_based, manual]
 *         description: Filter by release condition type
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *     responses:
 *       200:
 *         description: Video messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 videoMessages:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           file_url:
 *                             type: string
 *                           duration:
 *                             type: number
 *                           file_size:
 *                             type: number
 *                           format:
 *                             type: string
 *                           upload_date:
 *                             type: string
 *                           user_id:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                           recipient_ids:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 _id:
 *                                   type: string
 *                                 full_name:
 *                                   type: string
 *                                 email:
 *                                   type: string
 *                           release_conditions:
 *                             type: object
 *                             properties:
 *                               type:
 *                                 type: string
 *                               verification_required:
 *                                 type: boolean
 *                               trusted_contacts_required:
 *                                 type: number
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: number
 *                         totalPages:
 *                           type: number
 *                         totalVideos:
 *                           type: number
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalVideos:
 *                       type: number
 *                     totalSize:
 *                       type: number
 *                     totalDuration:
 *                       type: number
 *                     avgSize:
 *                       type: number
 *                     avgDuration:
 *                       type: number
 *                     formatDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: number
 *                     releaseConditionDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: number
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/video-messages', authenticateToken, getAllVideoMessages);

/**
 * @swagger
 * /api/admin/recipients:
 *   get:
 *     summary: Get all recipients with pagination, search, and filters
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *           default: "1"
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           default: "20"
 *         description: Number of recipients per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for full_name, email, or phone
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: "added_date"
 *           enum: [added_date, full_name, email, relationship]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           default: "desc"
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: verificationStatus
 *         schema:
 *           type: string
 *           enum: [pending, verified, failed]
 *         description: Filter by verification status
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: relationship
 *         schema:
 *           type: string
 *         description: Filter by relationship
 *     responses:
 *       200:
 *         description: Recipients retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 recipients:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           full_name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           phone:
 *                             type: string
 *                           relationship:
 *                             type: string
 *                           address:
 *                             type: object
 *                             properties:
 *                               street:
 *                                 type: string
 *                               city:
 *                                 type: string
 *                               state:
 *                                 type: string
 *                               zip_code:
 *                                 type: string
 *                               country:
 *                                 type: string
 *                           notification_preferences:
 *                             type: object
 *                             properties:
 *                               email:
 *                                 type: boolean
 *                               sms:
 *                                 type: boolean
 *                               postal_mail:
 *                                 type: boolean
 *                           verification_status:
 *                             type: string
 *                           notes:
 *                             type: string
 *                           added_date:
 *                             type: string
 *                           last_updated:
 *                             type: string
 *                           user_id:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: number
 *                         totalPages:
 *                           type: number
 *                         totalRecipients:
 *                           type: number
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalRecipients:
 *                       type: number
 *                     pendingVerification:
 *                       type: number
 *                     verified:
 *                       type: number
 *                     failed:
 *                       type: number
 *                     relationshipDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: number
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/recipients', authenticateToken, getAllRecipients);

/**
 * @swagger
 * /api/admin/trusted-contacts:
 *   get:
 *     summary: Get all trusted contacts with pagination, search, and filters
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *           default: "1"
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           default: "20"
 *         description: Number of trusted contacts per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for full_name, email, phone, or profession
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: "added_date"
 *           enum: [added_date, full_name, email, relationship]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           default: "desc"
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, verified, suspended]
 *         description: Filter by status
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: relationship
 *         schema:
 *           type: string
 *         description: Filter by relationship
 *       - in: query
 *         name: profession
 *         schema:
 *           type: string
 *         description: Filter by profession
 *     responses:
 *       200:
 *         description: Trusted contacts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 trustedContacts:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           full_name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           phone:
 *                             type: string
 *                           relationship:
 *                             type: string
 *                           profession:
 *                             type: string
 *                           permissions:
 *                             type: object
 *                             properties:
 *                               can_verify_death:
 *                                 type: boolean
 *                               can_release_messages:
 *                                 type: boolean
 *                               can_modify_recipients:
 *                                 type: boolean
 *                           status:
 *                             type: string
 *                           last_contact:
 *                             type: string
 *                           emergency_contact:
 *                             type: boolean
 *                           added_date:
 *                             type: string
 *                           last_updated:
 *                             type: string
 *                           user_id:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: number
 *                         totalPages:
 *                           type: number
 *                         totalTrustedContacts:
 *                           type: number
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalTrustedContacts:
 *                       type: number
 *                     pending:
 *                       type: number
 *                     verified:
 *                       type: number
 *                     suspended:
 *                       type: number
 *                     emergencyContacts:
 *                       type: number
 *                     relationshipDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: number
 *                     professionDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: number
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/trusted-contacts', authenticateToken, getAllTrustedContacts);

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   get:
 *     summary: Get detailed user information with related data
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details retrieved successfully
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
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     givenName:
 *                       type: string
 *                     familyName:
 *                       type: string
 *                     picture:
 *                       type: string
 *                     emailVerified:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                     lastLogin:
 *                       type: string
 *                 videoMessages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       duration:
 *                         type: number
 *                       file_size:
 *                         type: number
 *                       format:
 *                         type: string
 *                       upload_date:
 *                         type: string
 *                 recipients:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       full_name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       relationship:
 *                         type: string
 *                       verification_status:
 *                         type: string
 *                       added_date:
 *                         type: string
 *                 trustedContacts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       full_name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       relationship:
 *                         type: string
 *                       status:
 *                         type: string
 *                       added_date:
 *                         type: string
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalVideos:
 *                       type: number
 *                     totalRecipients:
 *                       type: number
 *                     totalTrustedContacts:
 *                       type: number
 *                     totalStorageUsed:
 *                       type: number
 *                     totalDuration:
 *                       type: number
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/users/:userId', authenticateToken, getUserDetails);

/**
 * @swagger
 * /api/admin/trigger-death-verification:
 *   post:
 *     summary: Manually trigger death verification cron job
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Death verification cron job triggered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.post('/trigger-death-verification', authenticateToken, isAdmin, triggerDeathVerificationCron);

/**
 * @swagger
 * /api/admin/death-verifications:
 *   get:
 *     summary: Get all death verifications with pagination, search, and filters
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *           default: "1"
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           default: "20"
 *         description: Number of verifications per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for verification notes or place of death
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: "createdAt"
 *           enum: [createdAt, death_date, verification_date, status]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           default: "desc"
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, waiting_for_release, verified, rejected, expired]
 *         description: Filter by verification status
 *       - in: query
 *         name: verificationMethod
 *         schema:
 *           type: string
 *           enum: [death_certificate, medical_report, official_document, other]
 *         description: Filter by verification method
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *     responses:
 *       200:
 *         description: Death verifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 deathVerifications:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           user_id:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                               givenName:
 *                                 type: string
 *                               familyName:
 *                                 type: string
 *                           status:
 *                             type: string
 *                             enum: [pending, waiting_for_release, verified, rejected, expired]
 *                           death_date:
 *                             type: string
 *                             format: date
 *                           verification_date:
 *                             type: string
 *                             format: date
 *                           verification_method:
 *                             type: string
 *                           place_of_death:
 *                             type: string
 *                           verification_notes:
 *                             type: string
 *                           death_certificate_url:
 *                             type: string
 *                           death_certificate_url_full:
 *                             type: string
 *                             description: Full URL to access the death certificate file
 *                           required_trustees:
 *                             type: number
 *                           verified_trustees:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 trustee_id:
 *                                   type: object
 *                                   properties:
 *                                     full_name:
 *                                       type: string
 *                                     email:
 *                                       type: string
 *                                 verification_date:
 *                                   type: string
 *                                   format: date
 *                                 verification_notes:
 *                                   type: string
 *                                 verification_method:
 *                                   type: string
 *                                 place_of_death:
 *                                   type: string
 *                           createdAt:
 *                             type: string
 *                             format: date
 *                           updatedAt:
 *                             type: string
 *                             format: date
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: number
 *                         totalPages:
 *                           type: number
 *                         totalVerifications:
 *                           type: number
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalVerifications:
 *                       type: number
 *                     pending:
 *                       type: number
 *                     waitingForRelease:
 *                       type: number
 *                     verified:
 *                       type: number
 *                     rejected:
 *                       type: number
 *                     expired:
 *                       type: number
 *                     methodDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: number
 *                     recentActivity:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: number
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get('/death-verifications', authenticateToken, isAdmin, getAllDeathVerifications);

/**
 * @swagger
 * /api/admin/release-videos/{userId}:
 *   post:
 *     summary: Release video messages after death verification (Admin only)
 *     tags: [Admin Management]
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
 *                 releasedVideos:
 *                   type: number
 *                   description: Number of videos released
 *       400:
 *         description: No death verification found in waiting for release status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/release-videos/:userId', authenticateToken, isAdmin, releaseVideoMessages);

module.exports = router; 