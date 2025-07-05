// Script to test data display in the frontend
const axios = require('axios');

// API base URL
const API_URL = 'http://localhost:8000';

// Test data display
async function testDataDisplay() {
  console.log('Testing data for frontend display...');
  
  try {
    // Test employees data
    console.log('\n===== EMPLOYEES DATA =====');
    const employeesResponse = await axios.get(`${API_URL}/employees/`);
    console.log(`Total employees: ${employeesResponse.data.length}`);
    
    // Display sample employee data
    if (employeesResponse.data.length > 0) {
      const sampleEmployee = employeesResponse.data[0];
      console.log('\nSample Employee:');
      console.log(`ID: ${sampleEmployee.id}`);
      console.log(`Name: ${sampleEmployee.first_name} ${sampleEmployee.last_name}`);
      console.log(`Position: ${sampleEmployee.position}`);
      console.log(`Department: ${sampleEmployee.department}`);
      console.log(`Status: ${sampleEmployee.status}`);
      console.log(`Hire Date: ${sampleEmployee.hire_date}`);
      console.log(`Email: ${sampleEmployee.email}`);
    }
    
    // Test attendance data
    console.log('\n===== ATTENDANCE DATA =====');
    const attendanceResponse = await axios.get(`${API_URL}/attendance/detailed/`);
    console.log(`Total attendance records: ${attendanceResponse.data.length}`);
    
    // Display sample attendance data
    if (attendanceResponse.data.length > 0) {
      const sampleAttendance = attendanceResponse.data[0];
      console.log('\nSample Attendance:');
      console.log(`ID: ${sampleAttendance.id}`);
      console.log(`Employee: ${sampleAttendance.employee?.first_name} ${sampleAttendance.employee?.last_name}`);
      console.log(`Date: ${sampleAttendance.date}`);
      console.log(`Check In: ${sampleAttendance.check_in}`);
      console.log(`Check Out: ${sampleAttendance.check_out}`);
    }
    
    // Test payroll data
    console.log('\n===== PAYROLL DATA =====');
    const payrollResponse = await axios.get(`${API_URL}/payroll/`);
    console.log(`Total payroll records: ${payrollResponse.data.length}`);
    
    // Display sample payroll data
    if (payrollResponse.data.length > 0) {
      const samplePayroll = payrollResponse.data[0];
      console.log('\nSample Payroll:');
      console.log(`ID: ${samplePayroll.id}`);
      console.log(`Employee ID: ${samplePayroll.employee_id}`);
      console.log(`Employee: ${samplePayroll.employee?.first_name} ${samplePayroll.employee?.last_name}`);
      console.log(`Period: ${samplePayroll.period}`);
      console.log(`Amount: ${samplePayroll.amount}`);
      console.log(`Status: ${samplePayroll.status}`);
      console.log(`Payment Date: ${samplePayroll.payment_date}`);
    }
    
    console.log('\nAll data tests completed!');
  } catch (error) {
    console.error('Error testing data display:', error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
    }
  }
}

// Run the tests
testDataDisplay();
