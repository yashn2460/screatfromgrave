const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let adminToken = '';

// Admin credentials
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

async function getAllDeathVerifications(params = {}) {
  try {
    const queryParams = new URLSearchParams(params);
    const response = await axios.get(`${BASE_URL}/admin/death-verifications?${queryParams}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Death verifications retrieved successfully');
    console.log(`📊 Found ${response.data.deathVerifications.data.length} verifications`);
    console.log(`📄 Page ${response.data.deathVerifications.pagination.currentPage} of ${response.data.deathVerifications.pagination.totalPages}`);
    console.log(`📈 Total verifications: ${response.data.deathVerifications.pagination.totalVerifications}\n`);
    
    // Display statistics
    console.log('📊 Statistics:');
    console.log(`   Total: ${response.data.stats.totalVerifications}`);
    console.log(`   Pending: ${response.data.stats.pending}`);
    console.log(`   Waiting for Release: ${response.data.stats.waitingForRelease}`);
    console.log(`   Verified: ${response.data.stats.verified}`);
    console.log(`   Rejected: ${response.data.stats.rejected}`);
    console.log(`   Expired: ${response.data.stats.expired}\n`);
    
    // Display method distribution
    if (response.data.stats.methodDistribution && response.data.stats.methodDistribution.length > 0) {
      console.log('🔍 Verification Method Distribution:');
      response.data.stats.methodDistribution.forEach(method => {
        console.log(`   ${method._id}: ${method.count}`);
      });
      console.log('');
    }
    
    // Display recent activity
    if (response.data.stats.recentActivity && response.data.stats.recentActivity.length > 0) {
      console.log('📅 Recent Activity (Last 7 days):');
      response.data.stats.recentActivity.forEach(activity => {
        console.log(`   ${activity._id}: ${activity.count} verifications`);
      });
      console.log('');
    }
    
    // Display verification details
    response.data.deathVerifications.data.forEach((verification, index) => {
      console.log(`💀 Verification ${index + 1}:`);
      console.log(`   ID: ${verification._id}`);
      console.log(`   User: ${verification.user_id?.name} (${verification.user_id?.email})`);
      console.log(`   Status: ${verification.status}`);
      console.log(`   Death Date: ${verification.death_date ? new Date(verification.death_date).toLocaleDateString() : 'N/A'}`);
      console.log(`   Verification Date: ${verification.verification_date ? new Date(verification.verification_date).toLocaleDateString() : 'N/A'}`);
      console.log(`   Method: ${verification.verification_method || 'N/A'}`);
      console.log(`   Place: ${verification.place_of_death || 'N/A'}`);
      console.log(`   Notes: ${verification.verification_notes || 'N/A'}`);
      console.log(`   Required Trustees: ${verification.required_trustees}`);
      console.log(`   Verified Trustees: ${verification.verified_trustees?.length || 0}`);
      
      if (verification.verified_trustees && verification.verified_trustees.length > 0) {
        console.log('   📋 Verified by:');
        verification.verified_trustees.forEach((trustee, tIndex) => {
          console.log(`      ${tIndex + 1}. ${trustee.trustee_id?.full_name} (${trustee.trustee_id?.email})`);
          console.log(`         Date: ${new Date(trustee.verification_date).toLocaleDateString()}`);
          console.log(`         Method: ${trustee.verification_method || 'N/A'}`);
          if (trustee.verification_notes) {
            console.log(`         Notes: ${trustee.verification_notes}`);
          }
        });
      }
      console.log('');
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get death verifications:', error.response?.data || error.message);
    throw error;
  }
}

async function testFilters() {
  console.log('🔍 Testing different filters...\n');
  
  // Test 1: Get all verifications
  console.log('📋 Test 1: All verifications');
  await getAllDeathVerifications();
  
  // Test 2: Filter by status
  console.log('📋 Test 2: Waiting for release verifications');
  await getAllDeathVerifications({ status: 'waiting_for_release' });
  
  // Test 3: Filter by verification method
  console.log('📋 Test 3: Death certificate verifications');
  await getAllDeathVerifications({ verificationMethod: 'death_certificate' });
  
  // Test 4: Search by notes
  console.log('📋 Test 4: Search in notes');
  await getAllDeathVerifications({ search: 'hospital' });
  
  // Test 5: Pagination
  console.log('📋 Test 5: First page with 5 items');
  await getAllDeathVerifications({ page: 1, limit: 5 });
  
  // Test 6: Sort by death date
  console.log('📋 Test 6: Sort by death date (newest first)');
  await getAllDeathVerifications({ sortBy: 'death_date', sortOrder: 'desc' });
}

async function runTest() {
  console.log('🚀 Starting Admin Death Verification Listing Test\n');

  try {
    // Step 1: Login as admin
    await loginAdmin();

    // Step 2: Test different filters
    await testFilters();

    console.log('✅ Admin death verification listing test completed successfully!');

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
  getAllDeathVerifications
}; 