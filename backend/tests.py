#!/usr/bin/env python3
"""
Test script for Asikh Farms HR Portal API
This script tests the API endpoints
"""
import os
import sys
import requests
import json
from datetime import date, datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000"
HEADERS = {"Content-Type": "application/json"}

def test_employee_endpoints():
    """Test employee endpoints"""
    print("\n=== Testing Employee Endpoints ===")
    
    # Get all employees
    print("\nGetting all employees...")
    response = requests.get(f"{BASE_URL}/employees")
    if response.status_code == 200:
        employees = response.json()
        print(f"Success! Found {len(employees)} employees")
    else:
        print(f"Error: {response.status_code} - {response.text}")
    
    # Get detailed employees
    print("\nGetting detailed employees...")
    response = requests.get(f"{BASE_URL}/employees/detailed")
    if response.status_code == 200:
        employees = response.json()
        print(f"Success! Found {len(employees)} detailed employees")
        if employees:
            print(f"Sample employee: {json.dumps(employees[0], indent=2)}")
    else:
        print(f"Error: {response.status_code} - {response.text}")
    
    # Create a new employee
    print("\nCreating a new employee...")
    new_employee = {
        "name": "Test Employee",
        "phone": "999-888-7777",
        "doj": date.today().isoformat(),
        "designation": "Tester",
        "location": "Test Lab",
        "status": "active"
    }
    response = requests.post(f"{BASE_URL}/employees", json=new_employee)
    if response.status_code == 201:
        created_employee = response.json()
        print(f"Success! Created employee with ID: {created_employee['id']}")
        employee_id = created_employee['id']
    else:
        print(f"Error: {response.status_code} - {response.text}")
        # Use the first employee for subsequent tests
        response = requests.get(f"{BASE_URL}/employees")
        if response.status_code == 200:
            employee_id = response.json()[0]['id']
        else:
            print("Could not get any employees for testing")
            return
    
    # Get a specific employee
    print(f"\nGetting employee with ID {employee_id}...")
    response = requests.get(f"{BASE_URL}/employees/{employee_id}")
    if response.status_code == 200:
        employee = response.json()
        print(f"Success! Got employee: {employee['name']}")
    else:
        print(f"Error: {response.status_code} - {response.text}")
    
    # Get detailed employee
    print(f"\nGetting detailed employee with ID {employee_id}...")
    response = requests.get(f"{BASE_URL}/employees/{employee_id}/detailed")
    if response.status_code == 200:
        employee = response.json()
        print(f"Success! Got detailed employee: {employee['name']}")
        print(f"Attendance count: {employee.get('attendance_count', 'N/A')}")
        print(f"Latest payroll: {employee.get('latest_payroll', 'N/A')}")
    else:
        print(f"Error: {response.status_code} - {response.text}")
    
    # Update an employee
    print(f"\nUpdating employee with ID {employee_id}...")
    update_data = {
        "designation": "Senior Tester"
    }
    response = requests.put(f"{BASE_URL}/employees/{employee_id}", json=update_data)
    if response.status_code == 200:
        updated_employee = response.json()
        print(f"Success! Updated employee designation to: {updated_employee['designation']}")
    else:
        print(f"Error: {response.status_code} - {response.text}")
    
    return employee_id

def test_attendance_endpoints(employee_id):
    """Test attendance endpoints"""
    print("\n=== Testing Attendance Endpoints ===")
    
    # Get all attendance records
    print("\nGetting all attendance records...")
    response = requests.get(f"{BASE_URL}/attendance")
    if response.status_code == 200:
        records = response.json()
        print(f"Success! Found {len(records)} attendance records")
    else:
        print(f"Error: {response.status_code} - {response.text}")
    
    # Get detailed attendance records
    print("\nGetting detailed attendance records...")
    response = requests.get(f"{BASE_URL}/attendance/detailed")
    if response.status_code == 200:
        records = response.json()
        print(f"Success! Found {len(records)} detailed attendance records")
        if records:
            print(f"Sample record: {json.dumps(records[0], indent=2)}")
    else:
        print(f"Error: {response.status_code} - {response.text}")
    
    # Create a new attendance record
    print("\nCreating a new attendance record...")
    today = date.today()
    new_record = {
        "employee_id": employee_id,
        "date": (today - timedelta(days=2)).isoformat(),  # Use a date that likely doesn't have a record yet
        "start_time": "08:00:00",
        "end_time": "17:00:00",
        "break_duration": "01:00:00"
    }
    response = requests.post(f"{BASE_URL}/attendance", json=new_record)
    if response.status_code == 201:
        created_record = response.json()
        print(f"Success! Created attendance record with ID: {created_record['id']}")
        record_id = created_record['id']
    else:
        print(f"Error: {response.status_code} - {response.text}")
        # Use the first record for subsequent tests
        response = requests.get(f"{BASE_URL}/attendance")
        if response.status_code == 200 and response.json():
            record_id = response.json()[0]['id']
        else:
            print("Could not get any attendance records for testing")
            return
    
    # Get a specific attendance record
    print(f"\nGetting attendance record with ID {record_id}...")
    response = requests.get(f"{BASE_URL}/attendance/{record_id}")
    if response.status_code == 200:
        record = response.json()
        print(f"Success! Got attendance record for date: {record['date']}")
    else:
        print(f"Error: {response.status_code} - {response.text}")
    
    # Get employee attendance
    print(f"\nGetting attendance for employee with ID {employee_id}...")
    response = requests.get(f"{BASE_URL}/attendance/employee/{employee_id}")
    if response.status_code == 200:
        records = response.json()
        print(f"Success! Found {len(records)} attendance records for employee")
    else:
        print(f"Error: {response.status_code} - {response.text}")

def test_payroll_endpoints(employee_id):
    """Test payroll endpoints"""
    print("\n=== Testing Payroll Endpoints ===")
    
    # Get all payroll records
    print("\nGetting all payroll records...")
    response = requests.get(f"{BASE_URL}/payroll")
    if response.status_code == 200:
        records = response.json()
        print(f"Success! Found {len(records)} payroll records")
    else:
        print(f"Error: {response.status_code} - {response.text}")
    
    # Get detailed payroll records
    print("\nGetting detailed payroll records...")
    response = requests.get(f"{BASE_URL}/payroll/detailed")
    if response.status_code == 200:
        records = response.json()
        print(f"Success! Found {len(records)} detailed payroll records")
        if records:
            print(f"Sample record: {json.dumps(records[0], indent=2)}")
    else:
        print(f"Error: {response.status_code} - {response.text}")
    
    # Generate a payroll record
    print("\nGenerating a payroll record...")
    today = date.today()
    current_month = f"{today.year}-{today.month:02d}"
    
    # First check if payroll already exists for this month
    response = requests.get(f"{BASE_URL}/payroll/employee/{employee_id}")
    existing_payroll = False
    if response.status_code == 200:
        for record in response.json():
            if record['month'] == current_month:
                existing_payroll = True
                print(f"Payroll already exists for {current_month}")
                break
    
    if not existing_payroll:
        response = requests.post(f"{BASE_URL}/payroll/generate/{employee_id}/{current_month}")
        if response.status_code == 200:
            generated_payroll = response.json()
            print(f"Success! Generated payroll with ID: {generated_payroll['id']}")
            print(f"Salary total: {generated_payroll['salary_total']}")
        else:
            print(f"Error: {response.status_code} - {response.text}")
    
    # Create a manual payroll record for a future month
    print("\nCreating a manual payroll record...")
    next_month = f"{today.year}-{today.month+1:02d}" if today.month < 12 else f"{today.year+1}-01"
    new_payroll = {
        "employee_id": employee_id,
        "month": next_month,
        "days_present": 15,
        "base_salary": 2400.0,
        "overtime_hours": 5.0,
        "overtime_rate": 22.5,
        "bonus": 100.0,
        "deductions": 50.0,
        "salary_total": 2562.5  # 2400 + (5*22.5) + 100 - 50
    }
    response = requests.post(f"{BASE_URL}/payroll", json=new_payroll)
    if response.status_code == 201:
        created_payroll = response.json()
        print(f"Success! Created manual payroll record with ID: {created_payroll['id']}")
    else:
        print(f"Error: {response.status_code} - {response.text}")
    
    # Get employee payroll
    print(f"\nGetting payroll for employee with ID {employee_id}...")
    response = requests.get(f"{BASE_URL}/payroll/employee/{employee_id}")
    if response.status_code == 200:
        records = response.json()
        print(f"Success! Found {len(records)} payroll records for employee")
    else:
        print(f"Error: {response.status_code} - {response.text}")

def main():
    print("Starting API tests...")
    
    try:
        # Test if the API is running
        response = requests.get(f"{BASE_URL}/")
        if response.status_code != 200:
            print(f"API is not responding. Make sure the server is running on {BASE_URL}")
            return
        
        # Run tests
        employee_id = test_employee_endpoints()
        if employee_id:
            test_attendance_endpoints(employee_id)
            test_payroll_endpoints(employee_id)
        
        print("\nAll tests completed!")
        
    except requests.exceptions.ConnectionError:
        print(f"Could not connect to the API at {BASE_URL}. Make sure the server is running.")

if __name__ == "__main__":
    main()
