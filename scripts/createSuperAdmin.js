require('dotenv').config();
const mongoose = require('mongoose');
const { createCustomSuperAdmin, createSuperAdminIfNeeded, getAdminStats } = require('../utils/superAdminSetup');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/afternote';

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    // Get command line arguments
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'default':
        // Create default super admin
        console.log('🔄 Creating default super admin...');
        const result = await createSuperAdminIfNeeded();
        if (result.success) {
          console.log('✅', result.message);
        } else {
          console.log('❌', result.message);
        }
        break;

      case 'custom':
        // Create custom super admin
        const name = args[1];
        const email = args[2];
        const password = args[3];

        if (!name || !email || !password) {
          console.log('❌ Usage: node createSuperAdmin.js custom <name> <email> <password>');
          console.log('Example: node createSuperAdmin.js custom "John Admin" "john@example.com" "password123"');
          process.exit(1);
        }

        console.log('🔄 Creating custom super admin...');
        const customResult = await createCustomSuperAdmin(name, email, password);
        if (customResult.success) {
          console.log('✅', customResult.message);
          console.log('👤 Admin Details:');
          console.log('   Name:', customResult.admin.name);
          console.log('   Email:', customResult.admin.email);
          console.log('   ID:', customResult.admin.id);
        } else {
          console.log('❌', customResult.message);
        }
        break;

      case 'stats':
        // Get admin statistics
        console.log('📊 Getting admin statistics...');
        const statsResult = await getAdminStats();
        if (statsResult.success) {
          console.log('✅ Admin Statistics:');
          console.log('   Total Admins:', statsResult.stats.totalAdmins);
          console.log('   Recent Admins:');
          statsResult.stats.recentAdmins.forEach((admin, index) => {
            console.log(`   ${index + 1}. ${admin.name} (${admin.email}) - Created: ${admin.createdAt}`);
          });
        } else {
          console.log('❌', statsResult.message);
        }
        break;

      default:
        console.log('🚀 Super Admin Management Script');
        console.log('');
        console.log('Available commands:');
        console.log('  default  - Create default super admin if none exists');
        console.log('  custom   - Create custom super admin with provided credentials');
        console.log('  stats    - Show admin statistics');
        console.log('');
        console.log('Examples:');
        console.log('  node createSuperAdmin.js default');
        console.log('  node createSuperAdmin.js custom "John Admin" "john@example.com" "password123"');
        console.log('  node createSuperAdmin.js stats');
        break;
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
};

// Run the script
createSuperAdmin(); 