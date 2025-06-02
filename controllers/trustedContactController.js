const TrustedContact = require('../models/TrustedContact');

// Create a new trusted contact
exports.createTrustedContact = async (req, res) => {
  try {
    const trustedContact = new TrustedContact({
      ...req.body,
      user_id: req.user.id
    });
    await trustedContact.save();
    res.status(201).json(trustedContact);
  } catch (error) {
    console.log(error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'This contact is already added as a trusted contact' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
};

// Get all trusted contacts for the authenticated user
exports.getTrustedContacts = async (req, res) => {
  try {
    const trustedContacts = await TrustedContact.find({ user_id: req.user.id });
    res.json(trustedContacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific trusted contact
exports.getTrustedContact = async (req, res) => {
  try {
    const trustedContact = await TrustedContact.findOne({
      _id: req.params.id,
      user_id: req.user.id
    });
    
    if (!trustedContact) {
      return res.status(404).json({ message: 'Trusted contact not found' });
    }
    
    res.json(trustedContact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a trusted contact
exports.updateTrustedContact = async (req, res) => {
  try {
    const trustedContact = await TrustedContact.findOne({
      _id: req.params.id,
      user_id: req.user.id
    });
    
    if (!trustedContact) {
      return res.status(404).json({ message: 'Trusted contact not found' });
    }
    
    Object.assign(trustedContact, req.body);
    await trustedContact.save();
    res.json(trustedContact);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a trusted contact
exports.deleteTrustedContact = async (req, res) => {
  try {
    const trustedContact = await TrustedContact.findOne({
      _id: req.params.id,
      user_id: req.user.id
    });
    
    if (!trustedContact) {
      return res.status(404).json({ message: 'Trusted contact not found' });
    }
    
    await TrustedContact.deleteOne({ _id: req.params.id });
    res.json({ message: 'Trusted contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update verification document
exports.updateVerificationDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { verified, verified_date } = req.body;

    const trustedContact = await TrustedContact.findOne({
      'verification_documents._id': documentId,
      user_id: req.user.id
    });
    
    if (!trustedContact) {
      return res.status(404).json({ message: 'Verification document not found' });
    }

    const document = trustedContact.verification_documents.id(documentId);
    document.verified = verified;
    if (verified) {
      document.verified_date = verified_date || new Date();
    }

    await trustedContact.save();
    res.json(trustedContact);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update contact status
exports.updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'verified', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const trustedContact = await TrustedContact.findOne({
      _id: req.params.id,
      user_id: req.user.id
    });
    
    if (!trustedContact) {
      return res.status(404).json({ message: 'Trusted contact not found' });
    }
    
    trustedContact.status = status;
    await trustedContact.save();
    res.json(trustedContact);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update last contact date
exports.updateLastContact = async (req, res) => {
  try {
    const trustedContact = await TrustedContact.findOne({
      _id: req.params.id,
      user_id: req.user.id 
    });
    
    if (!trustedContact) {
      return res.status(404).json({ message: 'Trusted contact not found' });
    }
    
    trustedContact.last_contact = new Date();
    await trustedContact.save();
    res.json(trustedContact);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 