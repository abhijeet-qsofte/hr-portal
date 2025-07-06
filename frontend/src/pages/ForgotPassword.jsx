import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiMail, FiAlertCircle, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
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

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset states
    setError(null);
    
    try {
      setLoading(true);
      
      // Call the forgot password API
      await authApi.forgotPassword(email);
      
      // Show success message
      setSuccess(true);
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
          <p>Password Recovery</p>
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
              Password reset instructions have been sent to your email address.
            </Alert>
            <p>
              Please check your inbox and follow the instructions to reset your password.
              If you don't receive an email within a few minutes, please check your spam folder.
            </p>
            <BackLink to="/login">
              <FiArrowLeft /> Back to Login
            </BackLink>
          </>
        ) : (
          <>
            <p>
              Enter your email address and we'll send you instructions to reset your password.
            </p>
            
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <label htmlFor="email">
                  <FiMail /> Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email address"
                />
              </FormGroup>
              
              <Button type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Instructions'}
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

export default ForgotPassword;
