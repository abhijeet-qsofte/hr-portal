import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
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

const AddEmployeeForm = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    doj: '',
    designation: '',
    location: '',
    status: 'active',
    email: ''
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
      await employeeApi.create(dataToSubmit);
      setSuccess(true);
      setLoading(false);
      
      // Notify parent component that addition was successful
      if (onAdd) {
        onAdd();
      }
      
      // Close the form after a short delay
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 1500);
    } catch (error) {
      console.error('Error adding employee:', error);
      setError(error.response?.data?.detail || 'Failed to add employee');
      setLoading(false);
    }
  };
  
  return (
    <FormContainer as={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <FormTitle>Add New Employee</FormTitle>
      
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="name">Full Name*</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="phone">Phone Number*</Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="doj">Date of Joining*</Label>
          <Input
            id="doj"
            name="doj"
            type="date"
            value={formData.doj}
            onChange={handleChange}
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="designation">Designation*</Label>
          <Input
            id="designation"
            name="designation"
            value={formData.designation}
            onChange={handleChange}
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="location">Location*</Label>
          <Input
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="status">Status*</Label>
          <Select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
          </Select>
        </FormGroup>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>Employee added successfully!</SuccessMessage>}
        
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
            {loading ? 'Adding...' : 'Add Employee'}
          </Button>
        </ButtonGroup>
      </form>
    </FormContainer>
  );
};

export default AddEmployeeForm;
