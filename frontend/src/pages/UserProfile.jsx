import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiSave, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

// Styled components
const PageContainer = styled.div`
  padding: var(--spacing-md);
`;

const PageHeader = styled.div`
  margin-bottom: var(--spacing-lg);
  
  h1 {
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }
  
  p {
    margin-top: var(--spacing-xs);
    color: var(--color-text-secondary);
  }
`;

const Card = styled(motion.div)`
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-width: 500px;
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
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  }
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
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

const RolesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: var(--spacing-xs);
`;

const RoleBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${props => {
    switch(props.$role) {
      case 'admin': return 'var(--color-primary-light)';
      case 'hr': return 'var(--color-success-light)';
      case 'manager': return 'var(--color-warning-light)';
      default: return 'var(--color-background-light)';
    }
  }};
  color: ${props => {
    switch(props.$role) {
      case 'admin': return 'var(--color-primary-dark)';
      case 'hr': return 'var(--color-success-dark)';
      case 'manager': return 'var(--color-warning-dark)';
      default: return 'var(--color-text-secondary)';
    }
  }};
`;

const UserProfile = () => {
  const { user, updateUserProfile, getUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  
  // Load user data on component mount
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        full_name: user.full_name || '',
        email: user.email || ''
      }));
    }
  }, [user]);
  
  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset states
    setError(null);
    setSuccess(false);
    
    // Validate passwords match if changing password
    if (formData.password && formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      
      // Only send password if it's being changed
      const updateData = {
        full_name: formData.full_name
      };
      
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      // Update user profile
      await updateUserProfile(updateData);
      
      // Show success message
      setSuccess(true);
      
      // Reset password fields
      setFormData(prev => ({
        ...prev,
        password: '',
        confirm_password: ''
      }));
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <PageContainer>
      <PageHeader>
        <h1>User Profile</h1>
        <p>Manage your account information and password</p>
      </PageHeader>
      
      <Card
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {success && (
          <Alert $type="success">
            <FiSave />
            Profile updated successfully!
          </Alert>
        )}
        
        {error && (
          <Alert $type="error">
            <FiAlertCircle />
            {error}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <label htmlFor="email">
              <FiMail /> Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              disabled
              title="Email cannot be changed"
            />
          </FormGroup>
          
          <FormGroup>
            <label htmlFor="full_name">
              <FiUser /> Full Name
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              required
            />
          </FormGroup>
          
          <FormGroup>
            <label htmlFor="password">
              <FiLock /> New Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Leave blank to keep current password"
            />
          </FormGroup>
          
          <FormGroup>
            <label htmlFor="confirm_password">
              <FiLock /> Confirm New Password
            </label>
            <input
              type="password"
              id="confirm_password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleInputChange}
              placeholder="Leave blank to keep current password"
            />
          </FormGroup>
          
          <FormGroup>
            <label>
              <FiUser /> Your Roles
            </label>
            <RolesList>
              {user?.roles?.map(role => (
                <RoleBadge key={role} $role={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </RoleBadge>
              ))}
              {(!user?.roles || user?.roles.length === 0) && (
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  No roles assigned
                </span>
              )}
            </RolesList>
          </FormGroup>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Profile'}
          </Button>
        </Form>
      </Card>
    </PageContainer>
  );
};

export default UserProfile;
