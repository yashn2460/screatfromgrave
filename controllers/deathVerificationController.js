const DeathVerification = require('../models/DeathVerification');
const TrustedContact = require('../models/TrustedContact');
const VideoMessage = require('../models/VideoMessage');
const User = require('../models/User');
const { notifyAllRecipients } = require('../utils/emailService');
const { normalizeFilePath } = require('../utils/fileUtils');

// Trustee verifies death
const verifyDeath = async (req, res) => {
  try {
    const { 
      userId, 
      verificationMethod, 
      dateOfDeath, 
      placeOfDeath, 
      additionalNotes, 
      confirmVerification 
    } = req.body;
    
    const trusteeId = req.user.id; // Trustee's user ID

    // Validate required fields
    if (!userId || !verificationMethod || !dateOfDeath || !confirmVerification) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, verificationMethod, dateOfDeath, and confirmVerification are required'
      });
    }

    // Validate confirmation
    if (!confirmVerification) {
      return res.status(400).json({
        success: false,
        message: 'Death verification must be confirmed'
      });
    }

    // Check if trustee has permission to verify death
    const trustee = await TrustedContact.findOne({
      user_id: userId,
      email: req.user.email // Trustee's email
    });

    if (!trustee || !trustee.permissions.can_verify_death) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to verify death for this user'
      });
    }

    // Handle file upload for death certificate
    let deathCertificateUrl = null;
    if (req.file) {
      // Normalize file path to use forward slashes for web URLs
      const filePath = req.file.path || req.file.filename;
      deathCertificateUrl = normalizeFilePath(filePath);
    }

    // Check if death verification already exists
    let deathVerification = await DeathVerification.findOne({
      user_id: userId,
      status: { $in: ['pending', 'verified'] }
    });

    if (!deathVerification) {
      // Create new death verification
      deathVerification = new DeathVerification({
        user_id: userId,
        trustee_id: trustee._id,
        death_date: new Date(dateOfDeath),
        death_certificate_url: deathCertificateUrl,
        verification_notes: additionalNotes,
        required_trustees: trustee.trusted_contacts_required || 1,
        verification_method: verificationMethod,
        place_of_death: placeOfDeath
      });
    }

    // Add trustee to verified trustees if not already verified
    const alreadyVerified = deathVerification.verified_trustees.some(
      vt => vt.trustee_id.toString() === trustee._id.toString()
    );

    if (!alreadyVerified) {
      deathVerification.verified_trustees.push({
        trustee_id: trustee._id,
        verification_notes: additionalNotes,
        verification_method: verificationMethod,
        place_of_death: placeOfDeath
      });
    }

    // Check if enough trustees have verified
    if (deathVerification.verified_trustees.length >= deathVerification.required_trustees) {
      deathVerification.status = 'waiting_for_release';
      deathVerification.verification_date = new Date();
    }
    
    await deathVerification.save();

    res.status(200).json({
      success: true,
      message: deathVerification.status === 'waiting_for_release' 
        ? 'Death verification completed. Video messages are waiting for release.' 
        : 'Death verification submitted successfully. Waiting for additional trustee verification.',
      deathVerification: {
        id: deathVerification._id,
        status: deathVerification.status,
        verifiedTrustees: deathVerification.verified_trustees.length,
        requiredTrustees: deathVerification.required_trustees,
        verificationMethod: verificationMethod,
        dateOfDeath: dateOfDeath,
        placeOfDeath: placeOfDeath
      }
    });

  } catch (error) {
    console.error('Death verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying death',
      error: error.message
    });
  }
};

// Get death verification status
const getDeathVerificationStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const deathVerification = await DeathVerification.findOne({
      user_id: userId,
      status: { $in: ['pending', 'waiting_for_release', 'verified'] }
    }).populate('verified_trustees.trustee_id', 'full_name email');

    if (!deathVerification) {
      return res.status(200).json({
        success: true,
        status: 'no_verification',
        message: 'No death verification found'
      });
    }

    res.status(200).json({
      success: true,
      deathVerification: {
        id: deathVerification._id,
        status: deathVerification.status,
        deathDate: deathVerification.death_date,
        verifiedTrustees: deathVerification.verified_trustees,
        requiredTrustees: deathVerification.required_trustees,
        verificationDate: deathVerification.verification_date
      }
    });

  } catch (error) {
    console.error('Get death verification status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching death verification status',
      error: error.message
    });
  }
};

// Get pending death verifications for trustee
const getPendingVerifications = async (req, res) => {
  try {
    const trusteeEmail = req.user.email;

    // Find trusted contacts where this user is a trustee
    const trustedContacts = await TrustedContact.find({
      email: trusteeEmail,
      'permissions.can_verify_death': true
    });

    const userIds = trustedContacts.map(tc => tc.user_id);

    const pendingVerifications = await DeathVerification.find({
      user_id: { $in: userIds },
      status: { $in: ['pending', 'waiting_for_release'] }
    }).populate('user_id', 'name email')
      .populate('verified_trustees.trustee_id', 'full_name email');

    res.status(200).json({
      success: true,
      pendingVerifications
    });

  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending verifications',
      error: error.message
    });
  }
};

// Schedule death verification
const scheduleDeathVerification = async (req, res) => {
  try {
    const { userId, scheduledDate, autoVerifyAfterDays } = req.body;

    // Check if user has permission to schedule verification
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create or update death verification with schedule
    let deathVerification = await DeathVerification.findOne({
      user_id: userId,
      status: 'pending'
    });

    if (!deathVerification) {
      deathVerification = new DeathVerification({
        user_id: userId,
        verification_type: 'scheduled',
        scheduled_verification_date: new Date(scheduledDate),
        auto_verify_after_days: autoVerifyAfterDays || 30
      });
    } else {
      deathVerification.verification_type = 'scheduled';
      deathVerification.scheduled_verification_date = new Date(scheduledDate);
      deathVerification.auto_verify_after_days = autoVerifyAfterDays || 30;
    }

    await deathVerification.save();

    res.status(200).json({
      success: true,
      message: 'Death verification scheduled successfully',
      deathVerification: {
        id: deathVerification._id,
        scheduledDate: deathVerification.scheduled_verification_date,
        autoVerifyAfterDays: deathVerification.auto_verify_after_days
      }
    });

  } catch (error) {
    console.error('Schedule death verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error scheduling death verification',
      error: error.message
    });
  }
};

// Release video messages after death verification
const releaseVideoMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const trusteeId = req.user.id;

    // Check if trustee has permission to release messages
    const trustee = await TrustedContact.findOne({
      user_id: userId,
      email: req.user.email
    });

    if (!trustee || !trustee.permissions.can_verify_death) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to release video messages for this user'
      });
    }

    // Check if death verification is in waiting_for_release status
    const deathVerification = await DeathVerification.findOne({
      user_id: userId,
      status: 'waiting_for_release'
    });

    if (!deathVerification) {
      return res.status(400).json({
        success: false,
        message: 'No death verification found in waiting for release status'
      });
    }

    // Update status to verified and release video messages
    deathVerification.status = 'verified';
    await deathVerification.save();

    // Release video messages
    await releaseVideoMessagesHelper(userId);

    res.status(200).json({
      success: true,
      message: 'Video messages released successfully',
      deathVerification: {
        id: deathVerification._id,
        status: deathVerification.status,
        verificationDate: deathVerification.verification_date
      }
    });

  } catch (error) {
    console.error('Release video messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error releasing video messages',
      error: error.message
    });
  }
};

// Helper function to release video messages
const releaseVideoMessagesHelper = async (userId) => {
  try {
    const videoMessages = await VideoMessage.find({
      user_id: userId,
      'release_conditions.type': 'death_verification'
    });

    for (const video of videoMessages) {
      video.release_conditions.verification_required = false;
      video.scheduled_release = new Date(); // Release immediately
      await video.save();
    }

    console.log(`Released ${videoMessages.length} video messages for user ${userId}`);
    
    // Send email notifications to recipients
    const deceasedUser = await User.findById(userId);
    if (deceasedUser) {
      try {
        await notifyAllRecipients(userId, deceasedUser);
        console.log(`Email notifications sent to recipients for user ${userId}`);
      } catch (emailError) {
        console.error(`Error sending email notifications for user ${userId}:`, emailError);
        // Don't fail the verification process if email fails
      }
    }
  } catch (error) {
    console.error('Error releasing video messages:', error);
  }
};

// Process scheduled death verifications (for cron job)
const processScheduledVerifications = async () => {
  try {
    const now = new Date();
    
    // Find scheduled verifications that are due
    const scheduledVerifications = await DeathVerification.find({
      verification_type: 'scheduled',
      status: 'pending',
      scheduled_verification_date: { $lte: now }
    });

    console.log(`Processing ${scheduledVerifications.length} scheduled death verifications`);

    for (const verification of scheduledVerifications) {
      // Check if enough time has passed for auto-verification
      const daysSinceScheduled = Math.floor(
        (now - verification.scheduled_verification_date) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceScheduled >= verification.auto_verify_after_days) {
        verification.status = 'verified';
        verification.verification_date = now;
        verification.verification_type = 'automatic';
        await verification.save();

        // Release video messages and send emails
        await releaseVideoMessagesHelper(verification.user_id);

        console.log(`Auto-verified death for user ${verification.user_id}`);
      }
    }

  } catch (error) {
    console.error('Error processing scheduled verifications:', error);
  }
};

// Manual trigger for email notifications (admin only)
const triggerEmailNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if death verification exists and is verified
    const deathVerification = await DeathVerification.findOne({
      user_id: userId,
      status: 'verified'
    });

    if (!deathVerification) {
      return res.status(400).json({
        success: false,
        message: 'No verified death verification found for this user'
      });
    }

    // Send email notifications
    await notifyAllRecipients(userId, user);

    res.status(200).json({
      success: true,
      message: 'Email notifications sent successfully to all recipients'
    });

  } catch (error) {
    console.error('Trigger email notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending email notifications',
      error: error.message
    });
  }
};

module.exports = {
  verifyDeath,
  getDeathVerificationStatus,
  getPendingVerifications,
  scheduleDeathVerification,
  processScheduledVerifications,
  triggerEmailNotifications,
  releaseVideoMessages
}; 