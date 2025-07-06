import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

// Styled components for the login page
const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
`;

const LoginCard = styled(motion.div)`
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

const Logo = styled.div`
  margin-bottom: 30px;
  
  h1 {
    font-size: 24px;
    color: #333;
    margin: 0;
    font-weight: 600;
  }
  
  p {
    color: #666;
    margin: 5px 0 0;
    font-size: 14px;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  text-align: left;
  
  label {
    margin-bottom: 8px;
    font-size: 14px;
    color: #555;
  }
  
  input {
    padding: 12px 16px;
    border-radius: 6px;
    border: 1px solid #ddd;
    font-size: 16px;
    transition: border 0.3s ease;
    
    &:focus {
      outline: none;
      border-color: #4a90e2;
    }
  }
`;

const Button = styled.button`
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s ease;
  margin-top: 10px;
  
  &:hover {
    background: #3a80d2;
  }
  
  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  margin-top: 20px;
  font-size: 14px;
  text-align: center;
`;

const ForgotPasswordLink = styled(Link)`
  display: block;
  margin-top: 15px;
  color: #4a90e2;
  font-size: 14px;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the page user was trying to access before being redirected to login
  const from = location.state?.from?.pathname || '/';
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await login(email, password);
      // Redirect to the page user was trying to access or dashboard
      navigate(from, { replace: true });
    } catch (err) {
      // Error handling is done in the AuthContext
      console.error('Login failed:', err);
    }
  };
  
  return (
    <LoginContainer>
      <LoginCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Logo>
          <h1>Asikh Farms HR Portal</h1>
          <p>Sign in to access your account</p>
        </Logo>
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </FormGroup>
          
          <FormGroup>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </FormGroup>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <ForgotPasswordLink to="/forgot-password">
            Forgot your password?
          </ForgotPasswordLink>
        </Form>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;
