import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { authApi } from '../utils/api';
import { jwtDecode } from 'jwt-decode';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // State for user data and authentication status
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenRefreshTimeout, setTokenRefreshTimeout] = useState(null);

  // Check for existing token on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setRefreshToken(storedRefreshToken);
      setUser(JSON.parse(storedUser));
      
      // Set the default Authorization header for all axios requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      
      // Setup token refresh if token exists
      setupTokenRefresh(storedToken, storedRefreshToken);
    }
    
    setLoading(false);
    
    // Cleanup function to clear timeout when component unmounts
    return () => {
      if (tokenRefreshTimeout) {
        clearTimeout(tokenRefreshTimeout);
      }
    };
  }, []);

  // Setup token refresh based on token expiration
  const setupTokenRefresh = (accessToken, refreshTokenValue) => {
    if (!accessToken || !refreshTokenValue) return;
    
    try {
      // Decode the token to get expiration time
      const decodedToken = jwtDecode(accessToken);
      const expirationTime = decodedToken.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      
      // Calculate time until token expires (with 1-minute buffer)
      const timeUntilExpire = expirationTime - currentTime - (60 * 1000);
      
      // Clear any existing timeout
      if (tokenRefreshTimeout) {
        clearTimeout(tokenRefreshTimeout);
      }
      
      // Only setup refresh if token is not already expired
      if (timeUntilExpire > 0) {
        const timeout = setTimeout(() => refreshAccessToken(refreshTokenValue), timeUntilExpire);
        setTokenRefreshTimeout(timeout);
      } else {
        // Token is already expired, refresh immediately
        refreshAccessToken(refreshTokenValue);
      }
    } catch (error) {
      console.error('Error setting up token refresh:', error);
    }
  };
  
  // Refresh access token using refresh token
  const refreshAccessToken = async (refreshTokenValue) => {
    try {
      if (!refreshTokenValue) {
        logout();
        return;
      }
      
      const response = await authApi.refreshToken(refreshTokenValue);
      const { access_token, refresh_token } = response.data;
      
      // Update tokens in storage
      localStorage.setItem('authToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      
      // Update state
      setToken(access_token);
      setRefreshToken(refresh_token);
      
      // Update axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Setup the next refresh
      setupTokenRefresh(access_token, refresh_token);
      
      return access_token;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // If refresh fails, log the user out
      logout();
      return null;
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the authApi utility for login
      const response = await authApi.login(email, password);
      
      // Extract token and user data
      const { access_token, refresh_token, user } = response.data;
      
      // Store tokens and user data
      localStorage.setItem('authToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set state
      setToken(access_token);
      setRefreshToken(refresh_token);
      setUser(user);
      
      // Set the default Authorization header for all axios requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Setup token refresh
      setupTokenRefresh(access_token, refresh_token);
      
      return user;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Remove token and user data from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Reset state
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    
    // Clear token refresh timeout
    if (tokenRefreshTimeout) {
      clearTimeout(tokenRefreshTimeout);
      setTokenRefreshTimeout(null);
    }
    
    // Remove Authorization header
    delete axios.defaults.headers.common['Authorization'];
  };

  // Check if user has a specific role
  const hasRole = (requiredRoles) => {
    if (!user || !user.roles) return false;
    
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.some(role => user.roles.includes(role));
    }
    
    return user.roles.includes(requiredRoles);
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/auth/register', userData);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get user profile
  const getUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/auth/me');
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get user profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.put('/api/auth/me', userData);
      
      // Update local user data
      const updatedUser = { ...user, ...response.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update user profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    token,
    refreshToken,
    loading,
    error,
    isAuthenticated: !!token,
    login,
    logout,
    register,
    getUserProfile,
    updateUserProfile,
    hasRole,
    refreshAccessToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
