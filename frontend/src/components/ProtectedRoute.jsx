import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute component for role-based access control
 * 
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Child components to render if authorized
 * @param {Array|string} props.roles Required roles for access (optional)
 * @param {boolean} props.requireAuth Whether authentication is required (default: true)
 * @returns {React.ReactNode} The protected component or redirect
 */
const ProtectedRoute = ({ children, roles = [], requireAuth = true }) => {
  const { isAuthenticated, hasRole, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If authentication is required and user is not authenticated, redirect to login
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required, check if user has any of them
  if (roles.length > 0 && !hasRole(roles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // User is authenticated and authorized, render the protected component
  return children;
};

export default ProtectedRoute;
