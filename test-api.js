const dotenv = require('dotenv');
dotenv.config();

// Load the service
const smsService = require('./src/services/smsService');

async function testDirect() {
  console.log('Testing SMS Service Directly...');
  console.log('Environment variables:');
  console.log('Username:', process.env.HOLLATAGS_USERNAME);
  console.log('Sender ID:', process.env.HOLLATAGS_SENDER_ID);
  console.log('Password set:', !!process.env.HOLLATAGS_PASSWORD);
  
  const result = await smsService.sendSMS('2347033783159', 'Test from CSPAPP - Direct test!');
  console.log('Result:', result);
}

testDirect();