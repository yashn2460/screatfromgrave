const Contact = require('../models/Contact');
const User = require('../models/User');
const { sendContactNotification, sendContactResponse } = require('../utils/emailService');

// Submit contact form
const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message, phone, category } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, subject, and message are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Create contact submission
    const contact = new Contact({
      name,
      email,
      subject,
      message,
      phone,
      category: category || 'general',
      user_id: req.user ? req.user.id : null,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    await contact.save();

    // Send notification email to admin
    try {
      await sendContactNotification(contact);
      console.log(`Contact notification sent for submission ${contact._id}`);
    } catch (emailError) {
      console.error('Error sending contact notification:', emailError);
      // Don't fail the submission if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Contact form submitted successfully. We will get back to you soon.',
      contact: {
        id: contact._id,
        subject: contact.subject,
        status: contact.status,
        submittedAt: contact.createdAt
      }
    });

  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting contact form',
      error: error.message
    });
  }
};

// Get contact form submission (user can view their own)
const getContactSubmission = async (req, res) => {
  try {
    const { contactId } = req.params;

    const contact = await Contact.findById(contactId);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    // Check if user can view this submission
    if (req.user && contact.user_id && contact.user_id.toString() === req.user.id) {
      // User can view their own submission
    } else if (!req.user && contact.email) {
      // Anonymous user can view if they provide email verification
      // This would need additional implementation for email verification
    } else {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this contact submission'
      });
    }

    res.status(200).json({
      success: true,
      contact: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        message: contact.message,
        phone: contact.phone,
        category: contact.category,
        status: contact.status,
        priority: contact.priority,
        response_message: contact.response_message,
        response_date: contact.response_date,
        submittedAt: contact.createdAt,
        updatedAt: contact.updatedAt
      }
    });

  } catch (error) {
    console.error('Get contact submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contact submission',
      error: error.message
    });
  }
};

// Get user's contact submissions
const getUserContactSubmissions = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const contacts = await Contact.find({ user_id: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Contact.countDocuments({ user_id: req.user.id });

    res.status(200).json({
      success: true,
      contacts: contacts.map(contact => ({
        id: contact._id,
        subject: contact.subject,
        category: contact.category,
        status: contact.status,
        priority: contact.priority,
        submittedAt: contact.createdAt,
        hasResponse: !!contact.response_message
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalContacts: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get user contact submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contact submissions',
      error: error.message
    });
  }
};

// Admin: Get all contact submissions
const getAllContactSubmissions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, search } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const contacts = await Contact.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Contact.countDocuments(query);

    res.status(200).json({
      success: true,
      contacts: contacts.map(contact => ({
        id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        message: contact.message,
        phone: contact.phone,
        category: contact.category,
        status: contact.status,
        priority: contact.priority,
        submittedAt: contact.createdAt,
        updatedAt: contact.updatedAt
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalContacts: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get all contact submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contact submissions',
      error: error.message
    });
  }
};

// Admin: Update contact submission status
const updateContactStatus = async (req, res) => {
  try {
    const { contactId } = req.params;
    const { status, admin_notes, response_message } = req.body;

    const contact = await Contact.findById(contactId);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    // Update fields
    if (status) contact.status = status;
    if (admin_notes !== undefined) contact.admin_notes = admin_notes;
    if (response_message !== undefined) {
      contact.response_message = response_message;
      contact.response_date = new Date();
      contact.response_by = req.user.id;
    }

    await contact.save();

    // Send response email to user if response message is provided
    if (response_message) {
      try {
        await sendContactResponse(contact, response_message);
        console.log(`Contact response sent to ${contact.email}`);
      } catch (emailError) {
        console.error('Error sending contact response:', emailError);
        // Don't fail the update if email fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Contact submission updated successfully',
      contact: {
        id: contact._id,
        status: contact.status,
        admin_notes: contact.admin_notes,
        response_message: contact.response_message,
        response_date: contact.response_date,
        updatedAt: contact.updatedAt
      }
    });

  } catch (error) {
    console.error('Update contact status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating contact submission',
      error: error.message
    });
  }
};

// Admin: Delete contact submission
const deleteContactSubmission = async (req, res) => {
  try {
    const { contactId } = req.params;

    const contact = await Contact.findByIdAndDelete(contactId);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact submission deleted successfully'
    });

  } catch (error) {
    console.error('Delete contact submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting contact submission',
      error: error.message
    });
  }
};

module.exports = {
  submitContact,
  getContactSubmission,
  getUserContactSubmissions,
  getAllContactSubmissions,
  updateContactStatus,
  deleteContactSubmission
}; 