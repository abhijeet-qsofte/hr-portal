from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
import uvicorn
import sys
import os
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session

# Add the current directory to the path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import db_setup first to ensure models are registered only once
import db_setup

# Now import API routes
from api import employees, attendance, payroll, salary, auth, examples
from db.session import get_db
from auth.init_db import init_db

# Create FastAPI app with redirect_slashes=False to enforce no-trailing-slash URLs
app = FastAPI(
    title="Asikh Farms HR Portal",
    description="""## HR Employee Management System API
    
    This API provides endpoints for managing employees, attendance records, and payroll at Asikh Farms.
    
    ### Features
    
    * **Employee Management**: Create, read, update, and delete employee records
    * **Attendance Tracking**: Record and query employee attendance with start/end times
    * **Payroll Processing**: Generate and manage employee payroll records
    
    ### Authentication
    
    Most endpoints do not require authentication for demonstration purposes.
    In a production environment, proper authentication would be implemented.
    """,
    # Disable automatic redirects for trailing slashes
    redirect_slashes=False,
    version="1.0.0",
    contact={
        "name": "Asikh Farms HR Department",
        "email": "hr@asikhfarms.example.com",
    },
    license_info={
        "name": "MIT License",
    },
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers with standard prefixes
app.include_router(employees.router, prefix="/employees", tags=["Employees"])
app.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
app.include_router(payroll.router, prefix="/payroll", tags=["Payroll"])
app.include_router(salary.router, prefix="/salary", tags=["Salary Management"])
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(examples.router)  # Examples router already has prefix and tags

@app.on_event("startup")
def startup_event():
    # Initialize database with default roles and admin user
    db = next(get_db())
    init_db(db)

@app.get("/", tags=["Root"])
async def root():
    return {"message": "Welcome to Asikh Farms HR Portal API"}

if __name__ == "__main__":
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
