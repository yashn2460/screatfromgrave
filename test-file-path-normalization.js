const { normalizeFilePath, getFileUrl, getFilename, getFileExtension } = require('./utils/fileUtils');

// Test cases for file path normalization
const testCases = [
  {
    input: 'uploads\\death-certificates\\deathCertificate-1750940562258-151695822.pdf',
    expected: 'uploads/death-certificates/deathCertificate-1750940562258-151695822.pdf',
    description: 'Windows path with backslashes'
  },
  {
    input: 'uploads/death-certificates/deathCertificate-1750940562258-151695822.pdf',
    expected: 'uploads/death-certificates/deathCertificate-1750940562258-151695822.pdf',
    description: 'Unix path with forward slashes'
  },
  {
    input: 'uploads\\death-certificates\\subfolder\\file.pdf',
    expected: 'uploads/death-certificates/subfolder/file.pdf',
    description: 'Windows path with subfolder'
  },
  {
    input: null,
    expected: null,
    description: 'Null input'
  },
  {
    input: '',
    expected: '',
    description: 'Empty string'
  }
];

console.log('🧪 Testing File Path Normalization\n');

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.description}`);
  console.log(`   Input: ${testCase.input}`);
  
  const result = normalizeFilePath(testCase.input);
  console.log(`   Output: ${result}`);
  console.log(`   Expected: ${testCase.expected}`);
  console.log(`   ✅ Pass: ${result === testCase.expected ? 'YES' : 'NO'}`);
  console.log('');
});

// Test additional utility functions
console.log('🔧 Testing Additional Utility Functions\n');

const testFile = 'uploads/death-certificates/deathCertificate-1750940562258-151695822.pdf';

console.log(`Test File: ${testFile}`);
console.log(`Filename: ${getFilename(testFile)}`);
console.log(`Extension: ${getFileExtension(testFile)}`);
console.log(`Full URL: ${getFileUrl(testFile, 'http://localhost:3000')}`);

console.log('\n✅ File path normalization tests completed!'); 