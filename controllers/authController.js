const User = require('../models/User');
const { generateToken } = require('../utils/jwtUtils');

const handleGoogleLogin = async (req, res) => {
  try {
    const { credential, clientId } = req.body;

    // Decode the JWT token
    const decodedToken = JSON.parse(atob(credential.split('.')[1]));

    // Check if user already exists
    let user = await User.findOne({ googleId: decodedToken.sub });

    if (user) {
      // Update last login
      user.lastLogin = new Date();
      await user.save();
    } else {
      // Create new user
      user = new User({
        email: decodedToken.email,
        name: decodedToken.name,
        givenName: decodedToken.given_name,
        familyName: decodedToken.family_name,
        picture: decodedToken.picture,
        googleId: decodedToken.sub,
        emailVerified: decodedToken.email_verified
      });
      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture
      },
      token
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing Google login',
      error: error.message
    });
  }
};

// Get current user profile
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-googleId');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

module.exports = {
  handleGoogleLogin,
  getCurrentUser
}; 