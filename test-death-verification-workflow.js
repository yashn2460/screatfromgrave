const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let adminToken = '';
let trusteeToken = '';

// Test data
const testUser = {
  name: 'Test User',
  email: 'testuser@example.com',
  password: 'password123'
};

const testTrustee = {
  name: 'Test Trustee',
  email: 'trustee@example.com',
  password: 'password123'
};

const adminCredentials = {
  email: 'admin@example.com',
  password: 'admin123'
};

async function loginAdmin() {
  try {
    const response = await axios.post(`${BASE_URL}/admin/login`, adminCredentials);
    adminToken = response.data.token;
    console.log('✅ Admin logged in successfully');
    return adminToken;
  } catch (error) {
    console.error('❌ Admin login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function createTestUser() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, testUser);
    console.log('✅ Test user created:', response.data.user.email);
    return response.data.user._id;
  } catch (error) {
    console.error('❌ Failed to create test user:', error.response?.data || error.message);
    throw error;
  }
}

async function addTrusteeAsTrustedContact(userId) {
  try {
    const trustedContactData = {
      userId: userId,
      fullName: testTrustee.name,
      email: testTrustee.email,
      relationship: 'Friend',
      phone: '+1234567890',
      permissions: {
        can_verify_death: true,
        can_access_videos: false,
        can_manage_recipients: false
      }
    };

    const response = await axios.post(`${BASE_URL}/trusted-contacts`, trustedContactData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Trustee added as trusted contact');
    return response.data.trustedContact._id;
  } catch (error) {
    console.error('❌ Failed to add trustee:', error.response?.data || error.message);
    throw error;
  }
}

async function loginTrustee() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testTrustee.email,
      password: testTrustee.password
    });
    trusteeToken = response.data.token;
    console.log('✅ Trustee logged in successfully');
    return trusteeToken;
  } catch (error) {
    console.error('❌ Trustee login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function verifyDeath(userId) {
  try {
    const verificationData = {
      userId: userId,
      verificationMethod: 'death_certificate',
      dateOfDeath: '2024-01-15',
      placeOfDeath: 'Hospital',
      additionalNotes: 'Death verified by medical certificate',
      confirmVerification: true
    };

    const response = await axios.post(`${BASE_URL}/death-verification/verify`, verificationData, {
      headers: { Authorization: `Bearer ${trusteeToken}` }
    });
    console.log('✅ Death verification submitted:', response.data.message);
    console.log('📊 Status:', response.data.deathVerification.status);
    return response.data.deathVerification;
  } catch (error) {
    console.error('❌ Death verification failed:', error.response?.data || error.message);
    throw error;
  }
}

async function checkDeathVerificationStatus(userId) {
  try {
    const response = await axios.get(`${BASE_URL}/death-verification/status/${userId}`, {
      headers: { Authorization: `Bearer ${trusteeToken}` }
    });
    console.log('✅ Death verification status:', response.data.deathVerification?.status || 'No verification found');
    return response.data.deathVerification;
  } catch (error) {
    console.error('❌ Failed to check status:', error.response?.data || error.message);
    throw error;
  }
}

async function releaseVideoMessages(userId) {
  try {
    const response = await axios.post(`${BASE_URL}/death-verification/release/${userId}`, {}, {
      headers: { Authorization: `Bearer ${trusteeToken}` }
    });
    console.log('✅ Video messages released:', response.data.message);
    console.log('📊 Final status:', response.data.deathVerification.status);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to release videos:', error.response?.data || error.message);
    throw error;
  }
}

async function adminReleaseVideoMessages(userId) {
  try {
    const response = await axios.post(`${BASE_URL}/admin/release-videos/${userId}`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Admin released video messages:', response.data.message);
    console.log('📊 Released videos count:', response.data.releasedVideos);
    return response.data;
  } catch (error) {
    console.error('❌ Admin release failed:', error.response?.data || error.message);
    throw error;
  }
}

async function runWorkflowTest() {
  console.log('🚀 Starting Death Verification Workflow Test\n');

  try {
    // Step 1: Login as admin
    await loginAdmin();

    // Step 2: Create test user
    const userId = await createTestUser();

    // Step 3: Add trustee as trusted contact
    await addTrusteeAsTrustedContact(userId);

    // Step 4: Login as trustee
    await loginTrustee();

    // Step 5: Check initial status
    console.log('\n📋 Checking initial death verification status...');
    await checkDeathVerificationStatus(userId);

    // Step 6: Verify death
    console.log('\n🔍 Trustee verifying death...');
    const verification = await verifyDeath(userId);

    // Step 7: Check status after verification
    console.log('\n📋 Checking status after verification...');
    await checkDeathVerificationStatus(userId);

    // Step 8: Release video messages (trustee)
    console.log('\n🎬 Trustee releasing video messages...');
    await releaseVideoMessages(userId);

    // Step 9: Check final status
    console.log('\n📋 Checking final status...');
    await checkDeathVerificationStatus(userId);

    console.log('\n✅ Death verification workflow test completed successfully!');

  } catch (error) {
    console.error('\n❌ Workflow test failed:', error.message);
  }
}

// Alternative workflow: Admin release
async function runAdminReleaseTest() {
  console.log('\n🚀 Starting Admin Release Test\n');

  try {
    // Step 1: Login as admin
    await loginAdmin();

    // Step 2: Create test user
    const userId = await createTestUser();

    // Step 3: Add trustee as trusted contact
    await addTrusteeAsTrustedContact(userId);

    // Step 4: Login as trustee
    await loginTrustee();

    // Step 5: Verify death
    console.log('\n🔍 Trustee verifying death...');
    await verifyDeath(userId);

    // Step 6: Check status (should be waiting_for_release)
    console.log('\n📋 Checking status (should be waiting_for_release)...');
    await checkDeathVerificationStatus(userId);

    // Step 7: Admin releases video messages
    console.log('\n🎬 Admin releasing video messages...');
    await adminReleaseVideoMessages(userId);

    // Step 8: Check final status
    console.log('\n📋 Checking final status...');
    await checkDeathVerificationStatus(userId);

    console.log('\n✅ Admin release workflow test completed successfully!');

  } catch (error) {
    console.error('\n❌ Admin release test failed:', error.message);
  }
}

// Run the tests
if (require.main === module) {
  runWorkflowTest()
    .then(() => {
      console.log('\n🎉 All tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  runWorkflowTest,
  runAdminReleaseTest
}; 