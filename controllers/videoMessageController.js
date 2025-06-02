const VideoMessage = require('../models/VideoMessage');
const { upload, getVideoMetadata, s3Client } = require('../utils/s3Config');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

// Create a new video message
exports.createVideoMessage = async (req, res) => {
  try { 
    // Handle file upload
    upload.single('video')(req, res, async (err) => {
      if (err) {
        console.log(err);
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        console.log(err);
        return res.status(400).json({ message: 'No video file uploaded' });
      }

      try {
        // Get video metadata
        const metadata = await getVideoMetadata(req.file);

        // Parse recipient_ids if it's a string
        let recipient_ids = [];
        if (req.body.recipient_ids) {
          try {
            recipient_ids = JSON.parse(req.body.recipient_ids);
          } catch (e) {
            // If it's not a JSON string, treat it as a single value
            recipient_ids = [req.body.recipient_ids];
          }
        }

        // Parse release_conditions if it's a string
        let release_conditions = {
          type: 'manual',
          verification_required: false,
          trusted_contacts_required: 0
        };
        if (req.body.release_conditions) {
          try {
            release_conditions = JSON.parse(req.body.release_conditions);
          } catch (e) {
            // If it's not a JSON string, use the default values
            console.log('Invalid release_conditions format, using defaults');
          }
        }

        // Create video message
        const videoMessage = new VideoMessage({
          user_id: req.user.id,
          title: req.body.title,
          description: req.body.description,
          file_url: req.file.location, // S3 URL
          duration: metadata.duration,
          file_size: metadata.size,
          format: path.extname(req.file.originalname).slice(1),
          encryption_key: req.body.encryption_key,
          recipient_ids: recipient_ids,
          scheduled_release: req.body.scheduled_release,
          release_conditions: release_conditions
        });

        await videoMessage.save();
        res.status(201).json(videoMessage);
      } catch (error) {
        console.log(error);
        res.status(400).json({ message: error.message });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
};

// Get all video messages for the authenticated user
exports.getVideoMessages = async (req, res) => {
  try {
    const videoMessages = await VideoMessage.find({
      $or: [
        { user_id: req.user.id },
        // { recipient_ids: req.user._id }
      ]
    });
    res.json(videoMessages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific video message
exports.getVideoMessage = async (req, res) => {
  try {
    const videoMessage = await VideoMessage.findOne({
      _id: req.params.id,
      $or: [
        { user_id: req.user._id },
        { recipient_ids: req.user._id }
      ]
    });
    
    if (!videoMessage) {
      return res.status(404).json({ message: 'Video message not found' });
    }
    
    res.json(videoMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a video message
exports.updateVideoMessage = async (req, res) => {
  try {
    const videoMessage = await VideoMessage.findOne({
      _id: req.params.id,
      user_id: req.user._id // Only allow updates by the creator
    });
    
    if (!videoMessage) {
      return res.status(404).json({ message: 'Video message not found' });
    }

    // Handle file upload if a new video is provided
    if (req.file) {
      upload.single('video')(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ message: err.message });
        }

        try {
          const metadata = await getVideoMetadata(req.file);
          
          // Update video message with new file information
          Object.assign(videoMessage, {
            ...req.body,
            file_url: req.file.location,
            duration: metadata.duration,
            file_size: metadata.size,
            format: path.extname(req.file.originalname).slice(1)
          });

          await videoMessage.save();
          res.json(videoMessage);
        } catch (error) {
          res.status(400).json({ message: error.message });
        }
      });
    } else {
      // Update without changing the video file
      Object.assign(videoMessage, req.body);
      await videoMessage.save();
      res.json(videoMessage);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a video message
exports.deleteVideoMessage = async (req, res) => {
  try {
    const videoMessage = await VideoMessage.findOne({
      _id: req.params.id,
      user_id: req.user.id // Only allow deletion by the creator
    });
    
    if (!videoMessage) {
      return res.status(404).json({ message: 'Video message not found' });
    }

    // Delete the video file from S3
    // const key = videoMessage.file_url.split('/').slice(-2).join('/'); // Get the S3 key from the URL
    // await s3Client.send(new DeleteObjectCommand({
    //   Bucket: process.env.AWS_S3_BUCKET,
    //   Key: key
    // }));
    
    await VideoMessage.deleteOne({ _id: req.params.id });
    res.json({ message: 'Video message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 