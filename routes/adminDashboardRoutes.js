const express = require('express');
const router = express.Router();
const { 
  getDashboardOverview,
  getUserAnalytics,
  getVideoMessageAnalytics,
  getSystemHealth,
  getRecentActivity,
  getUserManagementData
} = require('../controllers/adminDashboardController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/admin/dashboard/overview:
 *   get:
 *     summary: Get dashboard overview statistics
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 overview:
 *                   type: object
 *                   properties:
 *                     counts:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: number
 *                         totalAdmins:
 *                           type: number
 *                         totalVideoMessages:
 *                           type: number
 *                         totalRecipients:
 *                           type: number
 *                         totalTrustedContacts:
 *                           type: number
 *                     monthlyGrowth:
 *                       type: object
 *                       properties:
 *                         newUsers:
 *                           type: number
 *                         newVideoMessages:
 *                           type: number
 *                     storage:
 *                       type: object
 *                       properties:
 *                         totalSize:
 *                           type: number
 *                         averageSize:
 *                           type: number
 *                         totalDuration:
 *                           type: number
 *                     formatDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: number
 *                     releaseConditionStats:
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
router.get('/overview', authenticateToken, getDashboardOverview);

/**
 * @swagger
 * /api/admin/dashboard/user-analytics:
 *   get:
 *     summary: Get user analytics and trends
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: "30"
 *         description: Number of days for analytics period
 *     responses:
 *       200:
 *         description: User analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 analytics:
 *                   type: object
 *                   properties:
 *                     userRegistrationTrend:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: object
 *                             properties:
 *                               year:
 *                                 type: number
 *                               month:
 *                                 type: number
 *                               day:
 *                                 type: number
 *                           count:
 *                             type: number
 *                     emailVerificationStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: boolean
 *                           count:
 *                             type: number
 *                     usersWithVideos:
 *                       type: number
 *                     topUsersByVideos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           videoCount:
 *                             type: number
 *                           createdAt:
 *                             type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/user-analytics', authenticateToken, getUserAnalytics);

/**
 * @swagger
 * /api/admin/dashboard/video-analytics:
 *   get:
 *     summary: Get video message analytics and trends
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: "30"
 *         description: Number of days for analytics period
 *     responses:
 *       200:
 *         description: Video analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 analytics:
 *                   type: object
 *                   properties:
 *                     videoUploadTrend:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: object
 *                             properties:
 *                               year:
 *                                 type: number
 *                               month:
 *                                 type: number
 *                               day:
 *                                 type: number
 *                           count:
 *                             type: number
 *                           totalSize:
 *                             type: number
 *                           totalDuration:
 *                             type: number
 *                     formatStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: number
 *                           totalSize:
 *                             type: number
 *                           avgDuration:
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
 *                     averageStats:
 *                       type: object
 *                       properties:
 *                         avgSize:
 *                           type: number
 *                         avgDuration:
 *                           type: number
 *                         totalSize:
 *                           type: number
 *                         totalDuration:
 *                           type: number
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/video-analytics', authenticateToken, getVideoMessageAnalytics);

/**
 * @swagger
 * /api/admin/dashboard/system-health:
 *   get:
 *     summary: Get system health and status
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 health:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       enum: [connected, disconnected]
 *                     recentErrors:
 *                       type: array
 *                       items:
 *                         type: object
 *                     storage:
 *                       type: object
 *                       properties:
 *                         totalSize:
 *                           type: number
 *                         totalFiles:
 *                           type: number
 *                     activeUsers:
 *                       type: number
 *                     pendingVerifications:
 *                       type: object
 *                       properties:
 *                         recipients:
 *                           type: number
 *                         trustedContacts:
 *                           type: number
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/system-health', authenticateToken, getSystemHealth);

/**
 * @swagger
 * /api/admin/dashboard/recent-activity:
 *   get:
 *     summary: Get recent system activity
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           default: "20"
 *         description: Number of recent activities to retrieve
 *     responses:
 *       200:
 *         description: Recent activity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 recentActivity:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                           lastLogin:
 *                             type: string
 *                     videos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
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
 *                               name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                     recipients:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           full_name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           relationship:
 *                             type: string
 *                           added_date:
 *                             type: string
 *                           user_id:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                     trustedContacts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           full_name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           relationship:
 *                             type: string
 *                           added_date:
 *                             type: string
 *                           user_id:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/recent-activity', authenticateToken, getRecentActivity);

/**
 * @swagger
 * /api/admin/dashboard/user-management:
 *   get:
 *     summary: Get user management data with pagination and search
 *     tags: [Admin Dashboard]
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
 *         description: Search term for name or email
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
 *     responses:
 *       200:
 *         description: User management data retrieved successfully
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
 *                           emailVerified:
 *                             type: boolean
 *                           createdAt:
 *                             type: string
 *                           lastLogin:
 *                             type: string
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
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/user-management', authenticateToken, getUserManagementData);

module.exports = router; 