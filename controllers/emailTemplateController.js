// Controller for managing email templates (CRUD) for admin usage.
// Allows listing, creating, updating, and deleting email templates used in notifications.
const EmailTemplate = require('../models/EmailTemplate');

// List all email templates (with optional filtering, pagination)
exports.listEmailTemplates = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const query = search ? { type: { $regex: search, $options: 'i' } } : {};
    const templates = await EmailTemplate.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    const total = await EmailTemplate.countDocuments(query);
    res.json({ templates, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single email template by ID
exports.getEmailTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ message: 'Email template not found' });
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new email template
exports.createEmailTemplate = async (req, res) => {
  try {
    const { type, subject, html, text, metadata, isActive } = req.body;
    const template = new EmailTemplate({ type, subject, html, text, metadata, isActive });
    await template.save();
    res.status(201).json(template);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update an email template by ID
exports.updateEmailTemplate = async (req, res) => {
  try {
    const { subject, html, text, metadata, isActive } = req.body;
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ message: 'Email template not found' });
    if (subject !== undefined) template.subject = subject;
    if (html !== undefined) template.html = html;
    if (text !== undefined) template.text = text;
    if (metadata !== undefined) template.metadata = metadata;
    if (isActive !== undefined) template.isActive = isActive;
    await template.save();
    res.json(template);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an email template by ID
exports.deleteEmailTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ message: 'Email template not found' });
    res.json({ message: 'Email template deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 