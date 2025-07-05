Create a full-stack HR Employee Management App called "Asikh Farms HR Portal" with the following setup:

🔧 Backend

Framework: FastAPI (preferred for speed + Swagger support)

Language: Python 3.11+

REST API Endpoints:

/employees [GET, POST, PUT, DELETE]

/attendance [GET, POST]

/payroll [GET, optional POST for manual override]

Use PostgreSQL as the database

Tables:

-- ==================================================
-- ASIKH FARMS HR PORTAL - SCALABLE DATABASE SCHEMA
-- ==================================================

-- Create database (PostgreSQL)
CREATE DATABASE asikh_farms_hr;

-- Connect to the database
\c asikh_farms_hr;

-- Enable UUID extension for better scalability
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================================================
-- EMPLOYEES TABLE
-- ==================================================
CREATE TABLE employees (
id SERIAL PRIMARY KEY,
name VARCHAR(100) NOT NULL,
phone VARCHAR(15) UNIQUE NOT NULL,
doj DATE NOT NULL, -- Date of Joining
designation VARCHAR(50) NOT NULL,
location VARCHAR(100) NOT NULL,
status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),

    -- Audit fields for scalability
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_phone CHECK (phone ~ '^[0-9+\-\s()]+$'),
    CONSTRAINT valid_doj CHECK (doj <= CURRENT_DATE)

);

-- Indexes for employees table
CREATE INDEX idx_employees_phone ON employees(phone);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_designation ON employees(designation);
CREATE INDEX idx_employees_location ON employees(location);
CREATE INDEX idx_employees_doj ON employees(doj);
CREATE INDEX idx_employees_created_at ON employees(created_at);

-- ==================================================
-- ATTENDANCE TABLE
-- ==================================================
CREATE TABLE attendance (
id SERIAL PRIMARY KEY,
employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
date DATE NOT NULL,
start_time TIME NOT NULL,

    -- Additional useful fields for scalability
    end_time TIME,
    break_duration INTERVAL DEFAULT '0 minutes',
    total_hours DECIMAL(4,2) GENERATED ALWAYS AS (
        CASE
            WHEN end_time IS NOT NULL THEN
                EXTRACT(EPOCH FROM (end_time - start_time - COALESCE(break_duration, '0 minutes'::interval))) / 3600
            ELSE NULL
        END
    ) STORED,

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT unique_employee_date UNIQUE(employee_id, date),
    CONSTRAINT valid_date CHECK (date <= CURRENT_DATE),
    CONSTRAINT valid_time_order CHECK (end_time IS NULL OR end_time > start_time)

);

-- Indexes for attendance table
CREATE INDEX idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX idx_attendance_date_range ON attendance(date, start_time);
CREATE INDEX idx_attendance_created_at ON attendance(created_at);

-- Composite index for common queries
CREATE INDEX idx_attendance_employee_month ON attendance(employee_id, date)
WHERE date >= DATE_TRUNC('month', CURRENT_DATE);

-- ==================================================
-- PAYROLL TABLE
-- ==================================================
CREATE TABLE payroll (
id SERIAL PRIMARY KEY,
employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
days_present INTEGER NOT NULL DEFAULT 0,
salary_total DECIMAL(10,2) NOT NULL,

    -- Additional scalable fields
    base_salary DECIMAL(10,2),
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    overtime_rate DECIMAL(6,2) DEFAULT 0,
    bonus DECIMAL(8,2) DEFAULT 0,
    deductions DECIMAL(8,2) DEFAULT 0,

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_by INTEGER REFERENCES employees(id),

    -- Constraints
    CONSTRAINT unique_employee_month UNIQUE(employee_id, month),
    CONSTRAINT valid_month CHECK (month ~ '^\d{4}-\d{2}$'),
    CONSTRAINT valid_days_present CHECK (days_present >= 0 AND days_present <= 31),
    CONSTRAINT valid_salary CHECK (salary_total >= 0)

);

-- Indexes for payroll table
CREATE INDEX idx_payroll_employee_id ON payroll(employee_id);
CREATE INDEX idx_payroll_month ON payroll(month);
CREATE INDEX idx_payroll_employee_month ON payroll(employee_id, month);
CREATE INDEX idx_payroll_created_at ON payroll(created_at);
CREATE INDEX idx_payroll_processed_by ON payroll(processed_by);

-- ==================================================
-- ADDITIONAL SCALABLE TABLES
-- ==================================================

-- Departments table for better organization
CREATE TABLE departments (
id SERIAL PRIMARY KEY,
name VARCHAR(50) UNIQUE NOT NULL,
description TEXT,
manager_id INTEGER REFERENCES employees(id),
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Locations table for better data normalization
CREATE TABLE locations (
id SERIAL PRIMARY KEY,
name VARCHAR(100) UNIQUE NOT NULL,
address TEXT,
city VARCHAR(50),
state VARCHAR(50),
country VARCHAR(50) DEFAULT 'India',
postal_code VARCHAR(10),
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Designations table for better standardization
CREATE TABLE designations (
id SERIAL PRIMARY KEY,
title VARCHAR(50) UNIQUE NOT NULL,
department_id INTEGER REFERENCES departments(id),
min_salary DECIMAL(10,2),
max_salary DECIMAL(10,2),
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==================================================
-- FUNCTIONS AND TRIGGERS FOR SCALABILITY
-- ==================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;

$$
language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_updated_at BEFORE UPDATE ON payroll
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- VIEWS FOR COMMON QUERIES
-- ==================================================

-- Active employees view
CREATE VIEW active_employees AS
SELECT
    id, name, phone, doj, designation, location, created_at
FROM employees
WHERE status = 'active';

-- Monthly attendance summary view
CREATE VIEW monthly_attendance_summary AS
SELECT
    e.id as employee_id,
    e.name as employee_name,
    TO_CHAR(a.date, 'YYYY-MM') as month,
    COUNT(a.id) as days_present,
    AVG(a.total_hours) as avg_hours_per_day,
    SUM(a.total_hours) as total_hours
FROM employees e
LEFT JOIN attendance a ON e.id = a.employee_id
WHERE e.status = 'active'
GROUP BY e.id, e.name, TO_CHAR(a.date, 'YYYY-MM');

-- Current month payroll view
CREATE VIEW current_month_payroll AS
SELECT
    p.*,
    e.name as employee_name,
    e.designation,
    e.location
FROM payroll p
JOIN employees e ON p.employee_id = e.id
WHERE p.month = TO_CHAR(CURRENT_DATE, 'YYYY-MM');

-- ==================================================
-- SAMPLE DATA FOR TESTING
-- ==================================================

-- Insert sample employees
INSERT INTO employees (name, phone, doj, designation, location) VALUES
('Rajesh Kumar', '+91-9876543210', '2023-01-15', 'Farm Manager', 'Farm Site A'),
('Priya Sharma', '+91-9876543211', '2023-02-01', 'Supervisor', 'Farm Site A'),
('Amit Singh', '+91-9876543212', '2023-03-10', 'Worker', 'Farm Site B'),
('Sunita Devi', '+91-9876543213', '2023-04-05', 'Worker', 'Farm Site A'),
('Mohan Lal', '+91-9876543214', '2023-05-20', 'Driver', 'Farm Site B');

-- Insert sample attendance records
INSERT INTO attendance (employee_id, date, start_time, end_time) VALUES
(1, CURRENT_DATE - INTERVAL '1 day', '08:00:00', '17:00:00'),
(2, CURRENT_DATE - INTERVAL '1 day', '08:30:00', '17:30:00'),
(3, CURRENT_DATE - INTERVAL '1 day', '09:00:00', '18:00:00'),
(1, CURRENT_DATE, '08:00:00', '17:00:00'),
(2, CURRENT_DATE, '08:30:00', '17:30:00');

-- Insert sample payroll records
INSERT INTO payroll (employee_id, month, days_present, base_salary, salary_total) VALUES
(1, TO_CHAR(CURRENT_DATE, 'YYYY-MM'), 22, 25000.00, 25000.00),
(2, TO_CHAR(CURRENT_DATE, 'YYYY-MM'), 20, 20000.00, 20000.00),
(3, TO_CHAR(CURRENT_DATE, 'YYYY-MM'), 24, 15000.00, 15000.00);

-- ==================================================
-- PERFORMANCE OPTIMIZATION QUERIES
-- ==================================================

-- Analyze tables for better query planning
ANALYZE employees;
ANALYZE attendance;
ANALYZE payroll;

-- ==================================================
-- USEFUL QUERIES FOR APPLICATION
-- ==================================================

-- Get employee attendance for current month
/*
SELECT
    e.name,
    COUNT(a.id) as days_present,
    AVG(a.total_hours) as avg_hours
FROM employees e
LEFT JOIN attendance a ON e.id = a.employee_id
    AND DATE_TRUNC('month', a.date) = DATE_TRUNC('month', CURRENT_DATE)
WHERE e.status = 'active'
GROUP BY e.id, e.name;
*/

-- Get payroll summary for a specific month
/*
SELECT
    e.name,
    e.designation,
    p.days_present,
    p.salary_total
FROM payroll p
JOIN employees e ON p.employee_id = e.id
WHERE p.month = '2024-01'
ORDER BY p.salary_total DESC;
*/

-- Get attendance trends
/*
SELECT
    DATE_TRUNC('month', date) as month,
    COUNT(DISTINCT employee_id) as unique_employees,
    COUNT(*) as total_attendance_records,
    AVG(total_hours) as avg_hours_per_day
FROM attendance
WHERE date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', date)
ORDER BY month;
*/

ORM: SQLAlchemy with Pydantic schemas

Use alembic for migrations

Use dotenv to manage local credentials securely via .env

Enable CORS for frontend integration

🧪 Local Testing

Include instructions in README.md to:

Set up virtual environment

Install dependencies via requirements.txt

Start FastAPI server on localhost:8000

Auto-generate Swagger UI at /docs

Sample .env file:

DB_HOST=localhost
DB_PORT=5432
DB_NAME=asikh_hr
DB_USER=postgres
DB_PASSWORD=yourpassword

🚀 Deployment: Heroku (Production)

Include:

Procfile with uvicorn command:

web: uvicorn src.main:app --host=0.0.0.0 --port=${PORT:-5000}

requirements.txt

runtime.txt (e.g., python-3.11.5)

GitHub integration-ready file structure

.env.example for Heroku config

Automatic database connection using Heroku’s DATABASE_URL

📁 Project Structure

asikh-hr-backend/
├── src/
│ ├── main.py
│ ├── routes/
│ │ └── employees.py
│ │ └── attendance.py
│ │ └── payroll.py
│ ├── models/
│ │ └── employee.py
│ │ └── attendance.py
│ │ └── payroll.py
│ ├── schemas/
│ ├── db/
│ │ └── session.py
│ │ └── base.py
│ │ └── init_db.py
│ ├── utils/
├── alembic/
├── requirements.txt
├── .env
├── .env.example
├── Dockerfile (optional)
├── Procfile
├── runtime.txt
├── README.md

📦 Extras

Add a sample POST /employees JSON payload for API testing

Include seed script to populate test data

Add formatting tools: black, flake8, pre-commit

Optional: integrate CI/CD workflow using GitHub Actions for Heroku deployment
$$
