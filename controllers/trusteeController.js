const TrustedContact = require('../models/TrustedContact');
const User = require('../models/User');
const DeathVerification = require('../models/DeathVerification');

// List all trustees (trusted contacts)
const listTrustees = async (req, res) => {
  try {
    const trustedContacts = await TrustedContact.find({ email: req.user.email });
    const users = await User.find({ _id: { $in: trustedContacts.map(contact => contact.user_id) } });

    // Get death verification status for each user
    const usersWithDeathStatus = await Promise.all(
      users.map(async (user) => {
        const deathVerification = await DeathVerification.findOne({
          user_id: user._id,
          status: { $in: ['pending', 'waiting_for_release', 'verified'] }
        }).populate('verified_trustees.trustee_id', 'full_name email');

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          givenName: user.givenName,
          familyName: user.familyName,
          picture: user.picture,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          deathVerification: deathVerification ? {
            id: deathVerification._id,
            status: deathVerification.status,
            deathDate: deathVerification.death_date,
            verificationDate: deathVerification.verification_date,
            verifiedTrustees: deathVerification.verified_trustees,
            requiredTrustees: deathVerification.required_trustees,
            verificationMethod: deathVerification.verification_method,
            placeOfDeath: deathVerification.place_of_death
          } : null
        };
      })
    );

    res.json(usersWithDeathStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  listTrustees
}; 