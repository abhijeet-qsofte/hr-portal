# Asikh Farms HR Portal

A full-stack HR Employee Management System built with FastAPI, React, and PostgreSQL.

## 🔧 Features

- Employee management (add, update, view, delete)
- Attendance tracking with crates handled
- Automated payroll calculation based on attendance and crates
- RESTful API with Swagger documentation
- PostgreSQL database with SQLAlchemy ORM
- Alembic migrations
- Modern React frontend with Jony Ive-inspired design
- Responsive UI that works on mobile and desktop
- Docker containerization for easy deployment

## 📁 Project Structure

```
hr-portal/
├── backend/                  # Backend code
│   ├── src/                  # Source code
│   │   ├── api/              # API endpoints
│   │   │   ├── employees.py
│   │   │   ├── attendance.py
│   │   │   ├── payroll.py
│   │   │   └── salary.py
│   │   ├── core/            # Core application code
│   │   ├── db/              # Database models and connection
│   │   │   ├── session.py
│   │   │   ├── base.py
│   │   │   └── init_db.py
│   │   ├── models/          # SQLAlchemy models
│   │   │   ├── employee.py
│   │   │   ├── attendance.py
│   │   │   ├── payroll.py
│   │   │   └── salary.py
│   │   ├── schemas/         # Pydantic schemas
│   │   └── utils/           # Utility functions
│   ├── alembic/             # Database migrations
│   ├── tests/               # Backend tests
│   ├── Dockerfile           # Backend Dockerfile
│   ├── requirements.txt     # Python dependencies
│   └── run.py               # Entry point
├── frontend/                # Frontend code
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── styles/           # CSS and styling
│   │   ├── utils/            # Utility functions
│   │   ├── App.jsx           # Main React component
│   │   └── main.jsx          # React entry point
│   ├── public/              # Static assets
│   ├── package.json         # Frontend dependencies
│   ├── vite.config.js       # Vite configuration
│   └── Dockerfile           # Frontend Docker configuration
├── docker-compose.yml       # Docker Compose configuration
├── .env.example            # Example environment variables
└── README.md               # Project documentation
```
├── requirements.txt          # Backend dependencies
├── .env                      # Environment variables (not in git)
├── .env.example              # Example environment variables
├── Dockerfile                # Backend Docker configuration
├── docker-compose.yml        # Docker Compose configuration
├── entrypoint.sh             # Docker entrypoint script
├── README.md                 # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL
- Node.js 18+ (for frontend development)
- Docker and Docker Compose (for containerized setup)

### Local Development Setup

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/hr-portal.git
cd hr-portal
```

2. **Backend Setup**

```bash
# Create and activate a virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

3. **Frontend Setup**

```bash
cd frontend
npm install
```

4. **Set up environment variables**

Copy the example environment file and update with your database credentials:

```bash
cp .env.example .env
```

Edit the `.env` file with your PostgreSQL credentials:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=asikh_hr
DB_USER=postgres
DB_PASSWORD=yourpassword
```

5. **Create the database**

```bash
createdb asikh_hr
```

6. **Run database migrations**

```bash
# Make sure you're in the backend directory
cd backend
alembic upgrade head
```

7. **Start the backend server**

```bash
# Make sure you're in the backend directory
cd backend
python run.py
# Or alternatively
uvicorn src.main:app --reload
```

8. **Start the frontend development server (in a new terminal)**

```bash
# Make sure you're in the frontend directory
cd frontend
npm run dev
```

### Docker Setup

Alternatively, you can use Docker to run the entire application:

```bash
# Build and start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Documentation: http://localhost:8000/docs
```

The API will be available at http://localhost:8000 and the frontend at http://localhost:3000

### Automated Testing Pipeline

We've created an automated testing pipeline to make local development and testing easier:

1. **Make the pipeline script executable**

```bash
chmod +x run_pipeline.sh
```

2. **Run the pipeline**

```bash
./run_pipeline.sh
```

This script will:
- Check if PostgreSQL is running
- Create the database if it doesn't exist
- Install dependencies
- Initialize the database with test data
- Start the API server
- Run automated tests against the API
- Keep the server running if you choose to

The pipeline is ideal for quickly setting up a development environment and verifying that all components are working correctly.

### Docker Setup

You can also run the application using Docker, which eliminates the need to install PostgreSQL and other dependencies locally:

1. **Build and start the containers**

```bash
docker-compose up --build
```

This will:
- Build the Docker image for the application
- Start a PostgreSQL container
- Start the application container
- Initialize the database with test data
- Make the API available at http://localhost:8000

2. **Stop the containers**

```bash
docker-compose down
```

3. **View logs**

```bash
docker-compose logs -f
```

### Heroku Deployment

The application is configured for easy deployment to Heroku:

1. **Make the deployment script executable**

```bash
chmod +x deploy-heroku.sh
```

2. **Run the deployment script**

```bash
./deploy-heroku.sh
```

This script will:
- Check if Heroku CLI is installed
- Log you in to Heroku if needed
- Create a new Heroku app or use an existing one
- Set the stack to container
- Add PostgreSQL addon
- Deploy the application
- Run database migrations

After deployment, your API will be available at:
- https://your-app-name.herokuapp.com
- API documentation: https://your-app-name.herokuapp.com/docs

### API Documentation

FastAPI automatically generates interactive API documentation:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 📝 API Endpoints

### Employees

- `GET /employees` - List all employees
- `GET /employees/detailed` - List all employees with attendance count and latest payroll
- `POST /employees` - Create a new employee
- `GET /employees/{employee_id}` - Get employee details
- `GET /employees/{employee_id}/detailed` - Get employee details with attendance and payroll information
- `PUT /employees/{employee_id}` - Update employee information
- `DELETE /employees/{employee_id}` - Delete an employee

### Attendance

- `GET /attendance` - List all attendance records
- `GET /attendance/detailed` - List all attendance records with employee details
- `POST /attendance` - Create a new attendance record
- `GET /attendance/{attendance_id}` - Get attendance record details
- `GET /attendance/employee/{employee_id}` - Get attendance records for a specific employee

### Payroll

- `GET /payroll` - List all payroll records
- `GET /payroll/detailed` - List all payroll records with employee and processor details
- `GET /payroll/{payroll_id}` - Get payroll record details
- `GET /payroll/employee/{employee_id}` - Get payroll records for a specific employee
- `POST /payroll` - Create a manual payroll record
- `POST /payroll/generate/{employee_id}/{month}` - Generate payroll for an employee for a specific month

## 📊 Sample API Payloads

### Create Employee

```json
{
  "name": "John Doe",
  "phone": "123-456-7890",
  "doj": "2023-01-15",
  "designation": "Farm Worker",
  "location": "North Field",
  "status": "active"
}
```

### Create Attendance Record

```json
{
  "employee_id": 1,
  "date": "2023-11-01",
  "start_time": "08:00:00",
  "end_time": "17:00:00",
  "break_duration": "01:00:00"
}
```

### Create Payroll Record (Manual)

```json
{
  "employee_id": 1,
  "month": "2023-11",
  "days_present": 22,
  "base_salary": 2200.0,
  "overtime_hours": 10.0,
  "overtime_rate": 20.0,
  "bonus": 250.0,
  "deductions": 150.0,
  "salary_total": 2500.0
}
```

### Response from Detailed Employee Endpoint

```json
{
  "id": 1,
  "name": "John Doe",
  "phone": "123-456-7890",
  "doj": "2023-01-15",
  "designation": "Farm Worker",
  "location": "North Field",
  "status": "active",
  "created_at": "2023-11-01T10:00:00",
  "updated_at": "2023-11-01T10:00:00",
  "attendance_count": 15,
  "latest_payroll": {
    "month": "2023-11",
    "days_present": 22,
    "salary_total": 2500.0,
    "base_salary": 2200.0,
    "overtime_hours": 10.0,
    "bonus": 250.0
  }
}
```

## 🚀 Deployment to Heroku

1. **Create a Heroku account and install the Heroku CLI**

2. **Login to Heroku**

```bash
heroku login
```

3. **Create a new Heroku app**

```bash
heroku create asikh-farms-hr-portal
```

4. **Add PostgreSQL add-on**

```bash
heroku addons:create heroku-postgresql:hobby-dev
```

5. **Deploy the application**

```bash
git push heroku main
```

6. **Run migrations on Heroku**

```bash
heroku run alembic upgrade head
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
