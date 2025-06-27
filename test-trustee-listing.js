const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let trusteeToken = '';

// Test data
const testTrustee = {
  name: 'Test Trustee',
  email: 'trustee@example.com',
  password: 'password123'
};

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

async function listTrustees() {
  try {
    const response = await axios.get(`${BASE_URL}/trustees`, {
      headers: { Authorization: `Bearer ${trusteeToken}` }
    });
    
    console.log('✅ Trustee listing retrieved successfully');
    console.log(`📊 Found ${response.data.length} users who have this trustee as trusted contact\n`);
    
    response.data.forEach((user, index) => {
      console.log(`👤 User ${index + 1}:`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Email Verified: ${user.emailVerified}`);
      console.log(`   Created: ${new Date(user.createdAt).toLocaleDateString()}`);
      
      if (user.deathVerification) {
        console.log(`   💀 Death Verification Status: ${user.deathVerification.status}`);
        console.log(`   📅 Death Date: ${user.deathVerification.deathDate ? new Date(user.deathVerification.deathDate).toLocaleDateString() : 'N/A'}`);
        console.log(`   🔍 Verification Method: ${user.deathVerification.verificationMethod || 'N/A'}`);
        console.log(`   📍 Place of Death: ${user.deathVerification.placeOfDeath || 'N/A'}`);
        console.log(`   👥 Verified Trustees: ${user.deathVerification.verifiedTrustees?.length || 0}/${user.deathVerification.requiredTrustees || 1}`);
        
        if (user.deathVerification.verifiedTrustees && user.deathVerification.verifiedTrustees.length > 0) {
          console.log('   📋 Verified by:');
          user.deathVerification.verifiedTrustees.forEach((verification, vIndex) => {
            console.log(`      ${vIndex + 1}. ${verification.trustee_id?.full_name || 'Unknown'} (${verification.trustee_id?.email || 'Unknown'})`);
            console.log(`         Date: ${new Date(verification.verification_date).toLocaleDateString()}`);
            console.log(`         Method: ${verification.verification_method || 'N/A'}`);
            if (verification.verification_notes) {
              console.log(`         Notes: ${verification.verification_notes}`);
            }
          });
        }
      } else {
        console.log('   💀 Death Verification Status: No verification found');
      }
      console.log('');
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to list trustees:', error.response?.data || error.message);
    throw error;
  }
}

async function runTest() {
  console.log('🚀 Starting Trustee Listing Test\n');

  try {
    // Step 1: Login as trustee
    await loginTrustee();

    // Step 2: List trustees with death verification status
    console.log('📋 Listing trustees with death verification status...\n');
    await listTrustees();

    console.log('✅ Trustee listing test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  runTest()
    .then(() => {
      console.log('\n🎉 Test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  runTest,
  listTrustees
}; 