import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { employeeApi } from '../utils/api';
import Button from './Button';

const FormContainer = styled.div`
  padding: 20px;
  background-color: var(--color-background-secondary);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
`;

const FormTitle = styled.h3`
  margin-bottom: 20px;
  color: var(--color-text);
  font-weight: 500;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--color-text-secondary);
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 16px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.2);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 16px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.2);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

// Button component is now imported from './Button'

const ErrorMessage = styled.div`
  color: var(--color-error);
  font-size: 14px;
  margin-top: 4px;
`;

const SuccessMessage = styled.div`
  color: var(--color-success);
  font-size: 14px;
  margin-top: 4px;
`;

const EditEmployeeForm = ({ employee, onClose, onUpdate }) => {
  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const [formData, setFormData] = useState({
    name: employee.name || '',
    phone: employee.phone || '',
    doj: formatDateForInput(employee.doj) || '',
    designation: employee.designation || '',
    location: employee.location || '',
    status: employee.status || 'active',
    email: employee.email || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    // Create a copy of formData to avoid modifying the state directly
    const dataToSubmit = {...formData};
    
    // If email is empty, set it to null instead of empty string
    if (dataToSubmit.email === '') {
      dataToSubmit.email = null;
    }
    
    try {
      await employeeApi.update(employee.id, dataToSubmit);
      setSuccess(true);
      setLoading(false);
      
      // Notify parent component that update was successful
      if (onUpdate) {
        onUpdate();
      }
      
      // Close the form after a short delay
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 1500);
    } catch (error) {
      console.error('Error updating employee:', error);
      setError(error.response?.data?.detail || 'Failed to update employee');
      setLoading(false);
    }
  };
  
  return (
    <FormContainer as={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <FormTitle>Edit Employee</FormTitle>
      
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="name">Full Name</Label>
          <Input 
            type="text" 
            id="name" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            required 
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="email">Email Address</Label>
          <Input 
            type="email" 
            id="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="phone">Phone Number</Label>
          <Input 
            type="text" 
            id="phone" 
            name="phone" 
            value={formData.phone} 
            onChange={handleChange} 
            required 
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="doj">Date of Joining</Label>
          <Input 
            type="date" 
            id="doj" 
            name="doj" 
            value={formData.doj} 
            onChange={handleChange} 
            required 
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="designation">Designation</Label>
          <Input 
            type="text" 
            id="designation" 
            name="designation" 
            value={formData.designation} 
            onChange={handleChange} 
            required 
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="location">Location</Label>
          <Input 
            type="text" 
            id="location" 
            name="location" 
            value={formData.location} 
            onChange={handleChange} 
            required 
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="status">Status</Label>
          <Select 
            id="status" 
            name="status" 
            value={formData.status} 
            onChange={handleChange} 
            required
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="terminated">Terminated</option>
          </Select>
        </FormGroup>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>Employee updated successfully!</SuccessMessage>}
        
        <ButtonGroup>
          <Button 
            type="button" 
            onClick={onClose} 
            variant="secondary"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
            variant="primary"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </ButtonGroup>
      </form>
    </FormContainer>
  );
};

export default EditEmployeeForm;
