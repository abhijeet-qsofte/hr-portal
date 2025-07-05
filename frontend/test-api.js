// Simple script to test API endpoints
const axios = require('axios');

// API base URL
const API_URL = 'http://localhost:8000';

// Test endpoints
async function testApiEndpoints() {
  console.log('Testing API endpoints...');
  
  try {
    // Test employees endpoint
    console.log('\nTesting /employees/ endpoint:');
    const employeesResponse = await axios.get(`${API_URL}/employees/`);
    console.log(`Status: ${employeesResponse.status}`);
    console.log(`Data count: ${employeesResponse.data.length}`);
    
    // Test attendance endpoint
    console.log('\nTesting /attendance/ endpoint:');
    const attendanceResponse = await axios.get(`${API_URL}/attendance/`);
    console.log(`Status: ${attendanceResponse.status}`);
    console.log(`Data count: ${attendanceResponse.data.length}`);
    
    // Test payroll endpoint
    console.log('\nTesting /payroll/ endpoint:');
    const payrollResponse = await axios.get(`${API_URL}/payroll/`);
    console.log(`Status: ${payrollResponse.status}`);
    console.log(`Data count: ${payrollResponse.data.length}`);
    
    console.log('\nAll API endpoints tested successfully!');
  } catch (error) {
    console.error('Error testing API endpoints:', error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
    }
  }
}

// Run the tests
testApiEndpoints();
