const TrustedContact = require('../models/TrustedContact');
const User = require('../models/User');

// List all trustees (trusted contacts)
const listTrustees = async (req, res) => {
  try {
    const trustedContacts = await TrustedContact.find({ email: req.user.email });
    const users = await User.find({ _id: { $in: trustedContacts.map(contact => contact.user_id) } });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  listTrustees
}; 