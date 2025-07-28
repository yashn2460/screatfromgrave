const Recipient = require('../models/Recipient');
const Payment = require('../models/Payment');

// Create a new recipient
exports.createRecipient = async (req, res) => {
  try {
    const recipient = new Recipient({
      ...req.body,
      user_id: req.user.id
    });
    await recipient.save();
    res.status(201).json(recipient);
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error
      res.status(400).json({ message: 'A recipient with this email already exists' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
};

// Get all recipients for the authenticated user
exports.getRecipients = async (req, res) => {
  try {
    const recipients = await Recipient.find({ user_id: req.user.id });
    
    // Add payment status information to each recipient
    // const recipientsWithPaymentStatus = recipients.map(recipient => ({
    //   ...recipient.toObject(),
    //   paymentStatus: {
    //     completed: recipient.paymentCompleted,
    //     completedAt: recipient.paymentCompletedAt
    //   }
    // }));
    
    res.json(recipients);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get a specific recipient
exports.getRecipient = async (req, res) => {
  try {
    const recipient = await Recipient.findOne({
      _id: req.params.id,
      user_id: req.user._id
    });
    
    if (!recipient) {
      return res.status(404).json({ 
        success: false,
        message: 'Recipient not found' 
      });
    }
    
    // Add payment status information
    const recipientWithPaymentStatus = {
      ...recipient.toObject(),
      paymentStatus: {
        completed: recipient.paymentCompleted,
        completedAt: recipient.paymentCompletedAt
      }
    };
    
    res.json({
      success: true,
      data: recipientWithPaymentStatus
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Update a recipient
exports.updateRecipient = async (req, res) => {
  try {
    const recipient = await Recipient.findOne({
      _id: req.params.id,
      user_id: req.user._id
    });
    
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    
    // Prevent updating email if it's already verified
    if (recipient.verification_status === 'verified' && req.body.email !== recipient.email) {
      return res.status(400).json({ message: 'Cannot update email of a verified recipient' });
    }
    
    Object.assign(recipient, req.body);
    await recipient.save();
    res.json(recipient);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'A recipient with this email already exists' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
};

// Delete a recipient
exports.deleteRecipient = async (req, res) => {
  try {
    const recipient = await Recipient.findOne({
      _id: req.params.id,
      user_id: req.user.id
    });
    
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    
    await Recipient.deleteOne({ _id: req.params.id });
    await Payment.deleteOne({ recipientId: req.params.id });

    res.json({ message: 'Recipient deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update verification status
exports.updateVerificationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'verified', 'failed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }

    const recipient = await Recipient.findOne({
      _id: req.params.id,
      user_id: req.user._id
    });
    
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    
    recipient.verification_status = status;
    await recipient.save();
    res.json(recipient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 

// Get recipient payment status
exports.getRecipientPaymentStatus = async (req, res) => {
  try {
    const recipient = await Recipient.findOne({
      _id: req.params.id,
      user_id: req.user.id
    });
    
    if (!recipient) {
      return res.status(404).json({ 
        success: false,
        message: 'Recipient not found' 
      });
    }
    
    res.json({
      success: true,
      data: {
        recipientId: recipient._id,
        recipientName: recipient.full_name,
        paymentCompleted: recipient.paymentCompleted,
        paymentCompletedAt: recipient.paymentCompletedAt,
        verification_status: recipient.verification_status
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}; 