const User = require('../models/User');
const Admin = require('../models/Admin');
const VideoMessage = require('../models/VideoMessage');
const Recipient = require('../models/Recipient');
const TrustedContact = require('../models/TrustedContact');
const mongoose = require('mongoose');

// Get Dashboard Overview
const getDashboardOverview = async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments();
    const totalAdmins = await Admin.countDocuments();
    const totalVideoMessages = await VideoMessage.countDocuments();
    const totalRecipients = await Recipient.countDocuments();
    const totalTrustedContacts = await TrustedContact.countDocuments();

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const newVideoMessagesThisMonth = await VideoMessage.countDocuments({
      upload_date: { $gte: thirtyDaysAgo }
    });

    // Get storage statistics
    const storageStats = await VideoMessage.aggregate([
      {
        $group: {
          _id: null,
          totalSize: { $sum: '$file_size' },
          averageSize: { $avg: '$file_size' },
          totalDuration: { $sum: '$duration' }
        }
      }
    ]);

    // Get format distribution
    const formatDistribution = await VideoMessage.aggregate([
      {
        $group: {
          _id: '$format',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get release condition distribution
    const releaseConditionStats = await VideoMessage.aggregate([
      {
        $group: {
          _id: '$release_conditions.type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      overview: {
        counts: {
          totalUsers,
          totalAdmins,
          totalVideoMessages,
          totalRecipients,
          totalTrustedContacts
        },
        monthlyGrowth: {
          newUsers: newUsersThisMonth,
          newVideoMessages: newVideoMessagesThisMonth
        },
        storage: storageStats[0] || {
          totalSize: 0,
          averageSize: 0,
          totalDuration: 0
        },
        formatDistribution,
        releaseConditionStats
      }
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard overview',
      error: error.message
    });
  }
};

// Get User Analytics
const getUserAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // User registration trend
    const userRegistrationTrend = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Email verification stats
    const emailVerificationStats = await User.aggregate([
      {
        $group: {
          _id: '$emailVerified',
          count: { $sum: 1 }
        }
      }
    ]);

    // Users with video messages
    const usersWithVideos = await User.aggregate([
      {
        $lookup: {
          from: 'videomessages',
          localField: '_id',
          foreignField: 'user_id',
          as: 'videos'
        }
      },
      {
        $match: {
          'videos.0': { $exists: true }
        }
      },
      {
        $count: 'total'
      }
    ]);

    // Top users by video count
    const topUsersByVideos = await User.aggregate([
      {
        $lookup: {
          from: 'videomessages',
          localField: '_id',
          foreignField: 'user_id',
          as: 'videos'
        }
      },
      {
        $addFields: {
          videoCount: { $size: '$videos' }
        }
      },
      {
        $match: {
          videoCount: { $gt: 0 }
        }
      },
      {
        $sort: { videoCount: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          name: 1,
          email: 1,
          videoCount: 1,
          createdAt: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        userRegistrationTrend,
        emailVerificationStats,
        usersWithVideos: usersWithVideos[0]?.total || 0,
        topUsersByVideos
      }
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user analytics',
      error: error.message
    });
  }
};

// Get Video Message Analytics
const getVideoMessageAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Video upload trend
    const videoUploadTrend = await VideoMessage.aggregate([
      {
        $match: {
          upload_date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$upload_date' },
            month: { $month: '$upload_date' },
            day: { $dayOfMonth: '$upload_date' }
          },
          count: { $sum: 1 },
          totalSize: { $sum: '$file_size' },
          totalDuration: { $sum: '$duration' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Format distribution
    const formatStats = await VideoMessage.aggregate([
      {
        $group: {
          _id: '$format',
          count: { $sum: 1 },
          totalSize: { $sum: '$file_size' },
          avgDuration: { $avg: '$duration' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Release condition distribution
    const releaseConditionDistribution = await VideoMessage.aggregate([
      {
        $group: {
          _id: '$release_conditions.type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Average video statistics
    const averageStats = await VideoMessage.aggregate([
      {
        $group: {
          _id: null,
          avgSize: { $avg: '$file_size' },
          avgDuration: { $avg: '$duration' },
          totalSize: { $sum: '$file_size' },
          totalDuration: { $sum: '$duration' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        videoUploadTrend,
        formatStats,
        releaseConditionDistribution,
        averageStats: averageStats[0] || {
          avgSize: 0,
          avgDuration: 0,
          totalSize: 0,
          totalDuration: 0
        }
      }
    });
  } catch (error) {
    console.error('Video message analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching video message analytics',
      error: error.message
    });
  }
};

// Get System Health
const getSystemHealth = async (req, res) => {
  try {
    // Database connection status
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    // Recent errors (you might want to implement error logging)
    const recentErrors = []; // Placeholder for error tracking

    // Storage usage
    const storageUsage = await VideoMessage.aggregate([
      {
        $group: {
          _id: null,
          totalSize: { $sum: '$file_size' },
          totalFiles: { $sum: 1 }
        }
      }
    ]);

    // Active users (logged in within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: sevenDaysAgo }
    });

    // Pending verifications
    const pendingRecipientVerifications = await Recipient.countDocuments({
      verification_status: 'pending'
    });

    const pendingTrustedContactVerifications = await TrustedContact.countDocuments({
      status: 'pending'
    });

    res.status(200).json({
      success: true,
      health: {
        database: dbStatus,
        recentErrors,
        storage: storageUsage[0] || { totalSize: 0, totalFiles: 0 },
        activeUsers,
        pendingVerifications: {
          recipients: pendingRecipientVerifications,
          trustedContacts: pendingTrustedContactVerifications
        }
      }
    });
  } catch (error) {
    console.error('System health error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system health',
      error: error.message
    });
  }
};

// Get Recent Activity
const getRecentActivity = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Recent user registrations
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('name email createdAt lastLogin');

    // Recent video uploads
    const recentVideos = await VideoMessage.find()
      .sort({ upload_date: -1 })
      .limit(parseInt(limit))
      .populate('user_id', 'name email')
      .select('title duration file_size format upload_date user_id');

    // Recent recipient additions
    const recentRecipients = await Recipient.find()
      .sort({ added_date: -1 })
      .limit(parseInt(limit))
      .populate('user_id', 'name email')
      .select('full_name email relationship added_date user_id');

    // Recent trusted contact additions
    const recentTrustedContacts = await TrustedContact.find()
      .sort({ added_date: -1 })
      .limit(parseInt(limit))
      .populate('user_id', 'name email')
      .select('full_name email relationship added_date user_id');

    res.status(200).json({
      success: true,
      recentActivity: {
        users: recentUsers,
        videos: recentVideos,
        recipients: recentRecipients,
        trustedContacts: recentTrustedContacts
      }
    });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activity',
      error: error.message
    });
  }
};

// Get User Management Data
const getUserManagementData = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build search query
    const searchQuery = {};
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get users with pagination
    const users = await User.find(searchQuery)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-googleId');

    // Get total count for pagination
    const totalUsers = await User.countDocuments(searchQuery);

    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          verifiedUsers: {
            $sum: { $cond: ['$emailVerified', 1, 0] }
          },
          unverifiedUsers: {
            $sum: { $cond: ['$emailVerified', 0, 1] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      users: {
        data: users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalUsers / parseInt(limit)),
          totalUsers,
          hasNext: skip + users.length < totalUsers,
          hasPrev: parseInt(page) > 1
        }
      },
      stats: userStats[0] || {
        totalUsers: 0,
        verifiedUsers: 0,
        unverifiedUsers: 0
      }
    });
  } catch (error) {
    console.error('User management error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user management data',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardOverview,
  getUserAnalytics,
  getVideoMessageAnalytics,
  getSystemHealth,
  getRecentActivity,
  getUserManagementData
}; 