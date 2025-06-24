const User = require('../models/User');
const VideoMessage = require('../models/VideoMessage');
const Recipient = require('../models/Recipient');
const TrustedContact = require('../models/TrustedContact');

// Get All Users (Admin)
const getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      emailVerified,
      hasVideos
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build search query
    const searchQuery = {};
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { givenName: { $regex: search, $options: 'i' } },
        { familyName: { $regex: search, $options: 'i' } }
      ];
    }

    // Add filters
    if (emailVerified !== undefined) {
      searchQuery.emailVerified = emailVerified === 'true';
    }

    let usersQuery = User.find(searchQuery);

    // Filter users with videos if requested
    if (hasVideos === 'true') {
      usersQuery = User.aggregate([
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
            'videos.0': { $exists: true },
            ...searchQuery
          }
        },
        {
          $addFields: {
            videoCount: { $size: '$videos' }
          }
        },
        {
          $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
        },
        {
          $skip: skip
        },
        {
          $limit: parseInt(limit)
        }
      ]);
    } else {
      usersQuery = usersQuery
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-googleId');
    }

    const users = await usersQuery;
    const totalUsers = await User.countDocuments(searchQuery);

    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          verifiedUsers: { $sum: { $cond: ['$emailVerified', 1, 0] } },
          unverifiedUsers: { $sum: { $cond: ['$emailVerified', 0, 1] } }
        }
      }
    ]);

    // Get users with videos count
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
      stats: {
        ...userStats[0],
        usersWithVideos: usersWithVideos[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Get All Video Messages (Admin)
const getAllVideoMessages = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      sortBy = 'upload_date', 
      sortOrder = 'desc',
      format,
      releaseType,
      userId
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build search query
    const searchQuery = {};
    if (search) {
      searchQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Add filters
    if (format) {
      searchQuery.format = format;
    }
    if (releaseType) {
      searchQuery['release_conditions.type'] = releaseType;
    }
    if (userId) {
      searchQuery.user_id = userId;
    }

    const videoMessages = await VideoMessage.find(searchQuery)
      .populate('user_id', 'name email')
      .populate('recipient_ids', 'full_name email')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-encryption_key');

    const totalVideos = await VideoMessage.countDocuments(searchQuery);

    // Get video statistics
    const videoStats = await VideoMessage.aggregate([
      {
        $group: {
          _id: null,
          totalVideos: { $sum: 1 },
          totalSize: { $sum: '$file_size' },
          totalDuration: { $sum: '$duration' },
          avgSize: { $avg: '$file_size' },
          avgDuration: { $avg: '$duration' }
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
    const releaseConditionDistribution = await VideoMessage.aggregate([
      {
        $group: {
          _id: '$release_conditions.type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      videoMessages: {
        data: videoMessages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalVideos / parseInt(limit)),
          totalVideos,
          hasNext: skip + videoMessages.length < totalVideos,
          hasPrev: parseInt(page) > 1
        }
      },
      stats: {
        ...videoStats[0],
        formatDistribution,
        releaseConditionDistribution
      }
    });
  } catch (error) {
    console.error('Get all video messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching video messages',
      error: error.message
    });
  }
};

// Get All Recipients (Admin)
const getAllRecipients = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      sortBy = 'added_date', 
      sortOrder = 'desc',
      verificationStatus,
      userId,
      relationship
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build search query
    const searchQuery = {};
    if (search) {
      searchQuery.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Add filters
    if (verificationStatus) {
      searchQuery.verification_status = verificationStatus;
    }
    if (userId) {
      searchQuery.user_id = userId;
    }
    if (relationship) {
      searchQuery.relationship = { $regex: relationship, $options: 'i' };
    }

    const recipients = await Recipient.find(searchQuery)
      .populate('user_id', 'name email')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalRecipients = await Recipient.countDocuments(searchQuery);

    // Get recipient statistics
    const recipientStats = await Recipient.aggregate([
      {
        $group: {
          _id: null,
          totalRecipients: { $sum: 1 },
          pendingVerification: { $sum: { $cond: [{ $eq: ['$verification_status', 'pending'] }, 1, 0] } },
          verified: { $sum: { $cond: [{ $eq: ['$verification_status', 'verified'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$verification_status', 'failed'] }, 1, 0] } }
        }
      }
    ]);

    // Get relationship distribution
    const relationshipDistribution = await Recipient.aggregate([
      {
        $group: {
          _id: '$relationship',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      recipients: {
        data: recipients,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalRecipients / parseInt(limit)),
          totalRecipients,
          hasNext: skip + recipients.length < totalRecipients,
          hasPrev: parseInt(page) > 1
        }
      },
      stats: {
        ...recipientStats[0],
        relationshipDistribution
      }
    });
  } catch (error) {
    console.error('Get all recipients error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recipients',
      error: error.message
    });
  }
};

// Get All Trusted Contacts (Admin)
const getAllTrustedContacts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      sortBy = 'added_date', 
      sortOrder = 'desc',
      status,
      userId,
      relationship,
      profession
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build search query
    const searchQuery = {};
    if (search) {
      searchQuery.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { profession: { $regex: search, $options: 'i' } }
      ];
    }

    // Add filters
    if (status) {
      searchQuery.status = status;
    }
    if (userId) {
      searchQuery.user_id = userId;
    }
    if (relationship) {
      searchQuery.relationship = { $regex: relationship, $options: 'i' };
    }
    if (profession) {
      searchQuery.profession = { $regex: profession, $options: 'i' };
    }

    const trustedContacts = await TrustedContact.find(searchQuery)
      .populate('user_id', 'name email')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalTrustedContacts = await TrustedContact.countDocuments(searchQuery);

    // Get trusted contact statistics
    const trustedContactStats = await TrustedContact.aggregate([
      {
        $group: {
          _id: null,
          totalTrustedContacts: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          verified: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } },
          suspended: { $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] } },
          emergencyContacts: { $sum: { $cond: ['$emergency_contact', 1, 0] } }
        }
      }
    ]);

    // Get relationship distribution
    const relationshipDistribution = await TrustedContact.aggregate([
      {
        $group: {
          _id: '$relationship',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get profession distribution
    const professionDistribution = await TrustedContact.aggregate([
      {
        $match: { profession: { $exists: true, $ne: '' } }
      },
      {
        $group: {
          _id: '$profession',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      trustedContacts: {
        data: trustedContacts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalTrustedContacts / parseInt(limit)),
          totalTrustedContacts,
          hasNext: skip + trustedContacts.length < totalTrustedContacts,
          hasPrev: parseInt(page) > 1
        }
      },
      stats: {
        ...trustedContactStats[0],
        relationshipDistribution,
        professionDistribution
      }
    });
  } catch (error) {
    console.error('Get all trusted contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trusted contacts',
      error: error.message
    });
  }
};

// Get User Details with Related Data (Admin)
const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user details
    const user = await User.findById(userId).select('-googleId');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's video messages
    const videoMessages = await VideoMessage.find({ user_id: userId })
      .select('-encryption_key')
      .sort({ upload_date: -1 });

    // Get user's recipients
    const recipients = await Recipient.find({ user_id: userId })
      .sort({ added_date: -1 });

    // Get user's trusted contacts
    const trustedContacts = await TrustedContact.find({ user_id: userId })
      .sort({ added_date: -1 });

    // Get user statistics
    const userStats = {
      totalVideos: videoMessages.length,
      totalRecipients: recipients.length,
      totalTrustedContacts: trustedContacts.length,
      totalStorageUsed: videoMessages.reduce((sum, video) => sum + video.file_size, 0),
      totalDuration: videoMessages.reduce((sum, video) => sum + video.duration, 0)
    };

    res.status(200).json({
      success: true,
      user,
      videoMessages,
      recipients,
      trustedContacts,
      stats: userStats
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user details',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getAllVideoMessages,
  getAllRecipients,
  getAllTrustedContacts,
  getUserDetails
}; 