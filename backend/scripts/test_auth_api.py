"""
Script to test the authentication and RBAC API endpoints.
"""
import os
import sys
import requests
import json
from pprint import pprint
from dotenv import load_dotenv

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv()

# API base URL
BASE_URL = "http://0.0.0.0:8001"

# Debug mode
DEBUG = True

def print_separator(title):
    """Print a separator with a title."""
    print("\n" + "=" * 50)
    print(f" {title} ".center(50, "="))
    print("=" * 50)

def test_register_user():
    """Test user registration endpoint."""
    print_separator("REGISTER USER")
    
    url = f"{BASE_URL}/auth/register"
    data = {
        "email": "test@example.com",
        "password": "Password123!",
        "full_name": "Test User"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        pprint(response.json())
        return response.json()
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_login():
    """Test login endpoint."""
    print_separator("LOGIN")
    
    url = f"{BASE_URL}/auth/login"
    data = {
        "username": "test@example.com",  # Note: username is actually the email
        "password": "Password123!"
    }
    
    try:
        response = requests.post(url, data=data)
        print(f"Status Code: {response.status_code}")
        result = response.json()
        pprint(result)
        return result
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_admin_login():
    """Test admin login."""
    print_separator("ADMIN LOGIN")
    
    url = f"{BASE_URL}/auth/login"
    data = {
        "username": "admin@asikhfarms.com",
        "password": "adminpassword"
    }
    
    try:
        response = requests.post(url, data=data)
        print(f"Status Code: {response.status_code}")
        result = response.json()
        pprint(result)
        return result
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_refresh_token(refresh_token):
    """Test refresh token endpoint."""
    print_separator("REFRESH TOKEN")
    
    url = f"{BASE_URL}/auth/refresh"
    headers = {
        "Authorization": f"Bearer {refresh_token}"
    }
    
    try:
        response = requests.post(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        pprint(response.json())
        return response.json()
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_get_roles(access_token):
    """Test get roles endpoint."""
    print_separator("GET ROLES")
    
    url = f"{BASE_URL}/auth/roles"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        pprint(response.json())
        return response.json()
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_check_permission(access_token, permission_name):
    """Test check permission endpoint."""
    print_separator(f"CHECK PERMISSION: {permission_name}")
    
    url = f"{BASE_URL}/auth/check-permission/{permission_name}"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        pprint(response.json())
        return response.json()
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_example_endpoints(access_token):
    """Test example endpoints with different permission requirements."""
    print_separator("EXAMPLE ENDPOINTS")
    
    endpoints = [
        "/examples/public",
        "/examples/authenticated",
        "/examples/admin-only",
        "/examples/hr-only",
        "/examples/permission-required",
        "/examples/resource-ownership/1",
        "/examples/combined-check/1"
    ]
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    for endpoint in endpoints:
        print(f"\nTesting endpoint: {endpoint}")
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
            print(f"Status Code: {response.status_code}")
            try:
                pprint(response.json())
            except:
                print(response.text)
        except Exception as e:
            print(f"Error: {e}")

def run_tests():
    """Run all tests."""
    # Register a new user
    test_register_user()
    
    # Login with the new user
    user_tokens = test_login()
    
    # Login with admin
    admin_tokens = test_admin_login()
    
    if admin_tokens and "access_token" in admin_tokens:
        # Test refresh token
        if "refresh_token" in admin_tokens:
            test_refresh_token(admin_tokens["refresh_token"])
        
        # Test get roles
        test_get_roles(admin_tokens["access_token"])
        
        # Test check permission
        test_check_permission(admin_tokens["access_token"], "user:create_admin")
        
        # Test example endpoints with admin token
        print("\n\n" + "=" * 50)
        print(" TESTING ENDPOINTS WITH ADMIN TOKEN ".center(50, "="))
        print("=" * 50)
        test_example_endpoints(admin_tokens["access_token"])
    
    if user_tokens and "access_token" in user_tokens:
        # Test example endpoints with regular user token
        print("\n\n" + "=" * 50)
        print(" TESTING ENDPOINTS WITH REGULAR USER TOKEN ".center(50, "="))
        print("=" * 50)
        test_example_endpoints(user_tokens["access_token"])

if __name__ == "__main__":
    run_tests()
