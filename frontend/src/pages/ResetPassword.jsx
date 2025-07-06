import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiLock, FiAlertCircle, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { authApi } from '../utils/api';

// Styled components
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--spacing-md);
  background-color: var(--color-background);
`;

const Card = styled(motion.div)`
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-md);
  width: 100%;
  max-width: 450px;
  padding: var(--spacing-xl);
  
  @media (max-width: 480px) {
    padding: var(--spacing-lg);
  }
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: var(--spacing-lg);
  
  h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--color-primary);
    margin: 0;
  }
  
  p {
    color: var(--color-text-secondary);
    margin-top: var(--spacing-xs);
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  label {
    font-weight: 500;
    color: var(--color-text);
    display: flex;
    align-items: center;
    gap: 8px;
    
    svg {
      color: var(--color-text-secondary);
    }
  }
  
  input {
    padding: 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px var(--color-primary-light);
    }
  }
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-top: var(--spacing-sm);
  
  &:hover {
    background-color: var(--color-primary-dark);
  }
  
  &:disabled {
    background-color: var(--color-disabled);
    cursor: not-allowed;
  }
`;

const Alert = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-md);
  
  ${props => props.$type === 'success' && `
    background-color: var(--color-success-light);
    color: var(--color-success-dark);
  `}
  
  ${props => props.$type === 'error' && `
    background-color: var(--color-error-light);
    color: var(--color-error-dark);
  `}
`;

const BackLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  margin-top: var(--spacing-lg);
  
  &:hover {
    text-decoration: underline;
  }
`;

const PasswordStrength = styled.div`
  margin-top: 4px;
  font-size: 0.875rem;
  
  .strength-bar {
    height: 4px;
    border-radius: 2px;
    background-color: var(--color-background);
    margin-top: 4px;
    overflow: hidden;
  }
  
  .strength-indicator {
    height: 100%;
    transition: width 0.3s ease, background-color 0.3s ease;
    
    ${props => props.$strength === 'weak' && `
      width: 33%;
      background-color: var(--color-error);
    `}
    
    ${props => props.$strength === 'medium' && `
      width: 66%;
      background-color: var(--color-warning);
    `}
    
    ${props => props.$strength === 'strong' && `
      width: 100%;
      background-color: var(--color-success);
    `}
  }
`;

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  // Extract token from URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get('token');
    
    if (!tokenParam) {
      setError('Invalid reset link. Please request a new password reset.');
    } else {
      setToken(tokenParam);
    }
  }, [location]);
  
  // Check password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength('');
      return;
    }
    
    // Simple password strength check
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;
    
    const score = [hasLowerCase, hasUpperCase, hasNumber, hasSpecialChar, isLongEnough]
      .filter(Boolean).length;
    
    if (score <= 2) {
      setPasswordStrength('weak');
    } else if (score <= 4) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  }, [password]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset states
    setError(null);
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    if (passwordStrength === 'weak') {
      setError('Please choose a stronger password');
      return;
    }
    
    try {
      setLoading(true);
      
      // Call the reset password API
      await authApi.resetPassword(token, password);
      
      // Show success message
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <PageContainer>
      <Card
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Logo>
          <h1>Asikh Farms HR</h1>
          <p>Reset Password</p>
        </Logo>
        
        {error && (
          <Alert $type="error">
            <FiAlertCircle />
            {error}
          </Alert>
        )}
        
        {success ? (
          <>
            <Alert $type="success">
              <FiCheckCircle />
              Your password has been reset successfully!
            </Alert>
            <p>
              You will be redirected to the login page in a few seconds.
            </p>
            <BackLink to="/login">
              <FiArrowLeft /> Go to Login
            </BackLink>
          </>
        ) : (
          <>
            <p>
              Please enter your new password below.
            </p>
            
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <label htmlFor="password">
                  <FiLock /> New Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your new password"
                  disabled={!token}
                />
                {password && (
                  <PasswordStrength $strength={passwordStrength}>
                    Password strength: {passwordStrength || 'none'}
                    <div className="strength-bar">
                      <div className="strength-indicator" />
                    </div>
                  </PasswordStrength>
                )}
              </FormGroup>
              
              <FormGroup>
                <label htmlFor="confirmPassword">
                  <FiLock /> Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your new password"
                  disabled={!token}
                />
              </FormGroup>
              
              <Button type="submit" disabled={loading || !token}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </Form>
            
            <BackLink to="/login">
              <FiArrowLeft /> Back to Login
            </BackLink>
          </>
        )}
      </Card>
    </PageContainer>
  );
};

export default ResetPassword;
