const Admin = require('../models/Admin');

// Default super admin credentials
const DEFAULT_SUPER_ADMIN = {
  name: 'Super Admin',
  email: 'superadmin@afternote.com',
  password: 'SuperAdmin@123'
};

/**
 * Create super admin if no admin exists
 * This function should be called on server startup
 */
const createSuperAdminIfNeeded = async () => {
  try {
    // Check if any admin exists
    const adminCount = await Admin.countDocuments();
    
    if (adminCount === 0) {
      console.log('No admin found. Creating default super admin...');
      
      // Create the super admin
      const superAdmin = new Admin(DEFAULT_SUPER_ADMIN);
      await superAdmin.save();
      
      console.log('✅ Super Admin created successfully!');
      console.log('📧 Email:', DEFAULT_SUPER_ADMIN.email);
      console.log('🔑 Password:', DEFAULT_SUPER_ADMIN.password);
      console.log('⚠️  Please change the password after first login!');
      console.log('🔗 Login URL: http://localhost:5000/api-docs');
      
      return {
        success: true,
        message: 'Super admin created successfully',
        admin: {
          name: superAdmin.name,
          email: superAdmin.email,
          id: superAdmin._id
        }
      };
    } else {
      console.log(`✅ ${adminCount} admin(s) already exist in the database.`);
      return {
        success: true,
        message: 'Admins already exist',
        adminCount
      };
    }
  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    return {
      success: false,
      message: 'Error creating super admin',
      error: error.message
    };
  }
};

/**
 * Create a custom super admin with provided credentials
 * This can be used for initial setup or testing
 */
const createCustomSuperAdmin = async (name, email, password) => {
  try {
    // Check if admin with this email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return {
        success: false,
        message: 'Admin with this email already exists'
      };
    }

    // Create the custom super admin
    const superAdmin = new Admin({
      name,
      email,
      password
    });
    await superAdmin.save();

    console.log('✅ Custom Super Admin created successfully!');
    console.log('📧 Email:', email);
    console.log('👤 Name:', name);

    return {
      success: true,
      message: 'Custom super admin created successfully',
      admin: {
        name: superAdmin.name,
        email: superAdmin.email,
        id: superAdmin._id
      }
    };
  } catch (error) {
    console.error('❌ Error creating custom super admin:', error.message);
    return {
      success: false,
      message: 'Error creating custom super admin',
      error: error.message
    };
  }
};

/**
 * Get admin statistics
 */
const getAdminStats = async () => {
  try {
    const totalAdmins = await Admin.countDocuments();
    const recentAdmins = await Admin.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt lastLogin');

    return {
      success: true,
      stats: {
        totalAdmins,
        recentAdmins
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error fetching admin stats',
      error: error.message
    };
  }
};

/**
 * Reset super admin password (for emergency use)
 * This should only be used in development or emergency situations
 */
const resetSuperAdminPassword = async (email, newPassword) => {
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return {
        success: false,
        message: 'Admin not found'
      };
    }

    admin.password = newPassword;
    await admin.save();

    console.log('✅ Super Admin password reset successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 New Password:', newPassword);

    return {
      success: true,
      message: 'Password reset successfully'
    };
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
    return {
      success: false,
      message: 'Error resetting password',
      error: error.message
    };
  }
};

module.exports = {
  createSuperAdminIfNeeded,
  createCustomSuperAdmin,
  getAdminStats,
  resetSuperAdminPassword,
  DEFAULT_SUPER_ADMIN
}; 