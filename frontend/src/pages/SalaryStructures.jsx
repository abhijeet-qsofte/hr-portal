import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit, FiTrash2, FiDollarSign } from 'react-icons/fi';
import { format } from 'date-fns';
import { salaryStructureApi, employeeApi } from '../utils/api';

// Import components
import Table from '../components/Table';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';

// Styled components
const PageContainer = styled.div`
  padding: var(--spacing-md) 0;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    
    button {
      margin-top: var(--spacing-md);
      width: 100%;
    }
  }
`;

const PageTitle = styled.div`
  h1 {
    margin-bottom: var(--spacing-xs);
  }
  
  p {
    color: var(--color-text-secondary);
    margin: 0;
  }
`;

const FormGroup = styled.div`
  margin-bottom: var(--spacing-md);
  
  label {
    display: block;
    margin-bottom: var(--spacing-xs);
    font-weight: 500;
    color: var(--color-text);
  }
  
  input, select {
    width: 100%;
    padding: var(--spacing-sm);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 1rem;
    background-color: var(--color-background);
    color: var(--color-text);
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px rgba(0, 113, 227, 0.2);
    }
    
    &:disabled {
      background-color: var(--color-surface);
      cursor: not-allowed;
    }
  }
`;

const ModalContent = styled.div`
  padding: var(--spacing-lg);
`;

const ModalTitle = styled.h2`
  margin-top: 0;
  margin-bottom: var(--spacing-lg);
  color: var(--color-text);
  font-size: 1.5rem;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
`;

const FormRow = styled.div`
  display: flex;
  gap: var(--spacing-md);
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const FormColumn = styled.div`
  flex: 1;
`;

const SummaryCard = styled(Card)`
  margin-bottom: var(--spacing-lg);
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
`;

const SummaryItem = styled.div`
  h4 {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-xs);
    font-weight: 500;
  }
  
  p {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
    color: ${props => props.highlight ? 'var(--color-primary)' : 'var(--color-text)'};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: var(--spacing-xs);
`;

const ErrorMessage = styled.div`
  color: var(--color-error);
  font-size: 0.875rem;
  margin-top: var(--spacing-xs);
`;

const SalaryStructures = () => {
  const [structures, setStructures] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentStructure, setCurrentStructure] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    basic_salary: 0,
    house_rent_allowance: 0,
    transport_allowance: 0,
    medical_allowance: 0,
    special_allowance: 0,
    tax_deduction: 0,
    provident_fund: 0,
    insurance: 0,
    other_deductions: 0,
    effective_from: format(new Date(), 'yyyy-MM-dd')
  });
  const [errors, setErrors] = useState({});

  // Fetch salary structures and employees
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [structuresRes, employeesRes] = await Promise.all([
          salaryStructureApi.getAll(),
          employeeApi.getAll()
        ]);
        setStructures(structuresRes.data);
        setEmployees(employeesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;
    
    // Convert numeric fields to numbers
    if (name !== 'employee_id' && name !== 'effective_from') {
      parsedValue = parseFloat(value) || 0;
    }
    
    setFormData({ ...formData, [name]: parsedValue });
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Calculate gross and net salary
  const calculateTotals = () => {
    const {
      basic_salary,
      house_rent_allowance,
      transport_allowance,
      medical_allowance,
      special_allowance,
      tax_deduction,
      provident_fund,
      insurance,
      other_deductions
    } = formData;

    const grossSalary = 
      parseFloat(basic_salary || 0) +
      parseFloat(house_rent_allowance || 0) +
      parseFloat(transport_allowance || 0) +
      parseFloat(medical_allowance || 0) +
      parseFloat(special_allowance || 0);

    const totalDeductions =
      parseFloat(tax_deduction || 0) +
      parseFloat(provident_fund || 0) +
      parseFloat(insurance || 0) +
      parseFloat(other_deductions || 0);

    const netSalary = grossSalary - totalDeductions;

    return {
      grossSalary: grossSalary.toFixed(2),
      netSalary: netSalary.toFixed(2),
      totalDeductions: totalDeductions.toFixed(2)
    };
  };

  // Open dialog for creating/editing
  const handleOpenDialog = (structure = null) => {
    if (structure) {
      setEditMode(true);
      setCurrentStructure(structure);
      setFormData({
        employee_id: structure.employee_id,
        basic_salary: structure.basic_salary,
        house_rent_allowance: structure.house_rent_allowance,
        transport_allowance: structure.transport_allowance,
        meal_allowance: structure.meal_allowance,
        medical_allowance: structure.medical_allowance,
        other_allowances: structure.other_allowances,
        tax_deduction: structure.tax_deduction,
        provident_fund: structure.provident_fund,
        insurance: structure.insurance,
        other_deductions: structure.other_deductions,
        effective_from: structure.effective_from
      });
    } else {
      setEditMode(false);
      setCurrentStructure(null);
      setFormData({
        employee_id: '',
        basic_salary: 0,
        house_rent_allowance: 0,
        transport_allowance: 0,
        meal_allowance: 0,
        medical_allowance: 0,
        other_allowances: 0,
        tax_deduction: 0,
        provident_fund: 0,
        insurance: 0,
        other_deductions: 0,
        effective_from: format(new Date(), 'yyyy-MM-dd')
      });
    }
    setErrors({});
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Employee is required
    if (!formData.employee_id) {
      newErrors.employee_id = 'Please select an employee';
    }
    
    // Basic salary must be positive
    if (formData.basic_salary <= 0) {
      newErrors.basic_salary = 'Basic salary must be greater than zero';
    }
    
    // Tax rate must be between 0-100%
    if (formData.tax_deduction < 0) {
      newErrors.tax_deduction = 'Tax deduction cannot be negative';
    }
    
    // Effective date is required
    if (!formData.effective_from) {
      newErrors.effective_from = 'Effective date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      if (editMode && currentStructure) {
        await salaryStructureApi.update(currentStructure.id, formData);
        const updatedStructures = structures.map(s => 
          s.id === currentStructure.id ? { ...s, ...formData } : s
        );
        setStructures(updatedStructures);
      } else {
        const res = await salaryStructureApi.create(formData);
        setStructures([...structures, res.data]);
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving salary structure:', error);
      setErrors({ submit: 'Failed to save salary structure' });
    }
  };

  // Open delete confirmation
  const handleDeleteConfirm = (structure) => {
    setConfirmDelete(structure);
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };

  // Delete salary structure
  const handleDelete = async () => {
    if (!confirmDelete) return;
    
    try {
      await salaryStructureApi.delete(confirmDelete.id);
      setStructures(structures.filter(s => s.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error deleting salary structure:', error);
    }
  };

  // Get employee name by ID
  const getEmployeeName = (employeeId) => {
    const employee = employees.find(e => e.id === parseInt(employeeId));
    return employee ? employee.name : 'Unknown Employee';
  };

  // Format currency
  const formatCurrency = (amount) => {
    // Handle null, undefined, or NaN values
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '₹0.00';
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'N/A';
    }
  };

  // Table columns
  const columns = [
    { header: 'Employee', accessor: 'employee_name', render: (value) => value || 'Unknown Employee' },
    { header: 'Basic Salary', accessor: 'basic_salary', render: (value) => formatCurrency(value) },
    { header: 'Gross Salary', accessor: 'gross_salary', render: (value) => formatCurrency(value) },
    { header: 'Net Salary', accessor: 'net_salary', render: (value) => formatCurrency(value) },
    { header: 'Effective From', accessor: 'effective_from', render: (value) => formatDate(value) },
    {
      header: 'Actions',
      accessor: 'id',
      render: (value, row) => (
        <ActionButtons>
          <Button 
            icon={<FiEdit />} 
            variant="secondary" 
            size="sm" 
            onClick={() => handleOpenDialog(row)}
            aria-label="Edit"
          />
          <Button 
            icon={<FiTrash2 />} 
            variant="danger" 
            size="sm" 
            onClick={() => handleDeleteConfirm(row)}
            aria-label="Delete"
          />
        </ActionButtons>
      )
    }
  ];

  const { grossSalary, netSalary, totalDeductions } = calculateTotals();

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <h1>Salary Structures</h1>
          <p>Manage employee salary components and deductions</p>
        </PageTitle>
        <Button
          icon={<FiPlus />}
          onClick={() => handleOpenDialog()}
        >
          Add Salary Structure
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      {openDialog && (
        <SummaryCard>
          <Card.Header>
            <h3>Salary Summary</h3>
          </Card.Header>
          <Card.Body>
            <SummaryGrid>
              <SummaryItem>
                <h4>Gross Salary</h4>
                <p>{formatCurrency(grossSalary)}</p>
              </SummaryItem>
              <SummaryItem>
                <h4>Total Deductions</h4>
                <p>{formatCurrency(totalDeductions)}</p>
              </SummaryItem>
              <SummaryItem highlight>
                <h4>Net Salary</h4>
                <p>{formatCurrency(netSalary)}</p>
              </SummaryItem>
            </SummaryGrid>
          </Card.Body>
        </SummaryCard>
      )}

      {/* Salary Structures Table */}
      <Card>
        <Card.Header>
          <h3>Salary Structures</h3>
        </Card.Header>
        <Card.Body>
          <Table
            columns={columns}
            data={structures}
            loading={loading}
            emptyMessage="No salary structures found"
          />
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      {openDialog && (
        <Modal isOpen={openDialog} onClose={handleCloseDialog}>
          <ModalContent>
            <ModalTitle>
              {editMode ? 'Edit Salary Structure' : 'Add Salary Structure'}
            </ModalTitle>
            
            <FormGroup>
              <label htmlFor="employee_id">Employee</label>
              <select
                id="employee_id"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleInputChange}
                disabled={editMode}
              >
                <option value="">Select Employee</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
              {errors.employee_id && <ErrorMessage>{errors.employee_id}</ErrorMessage>}
            </FormGroup>

            <FormRow>
              <FormColumn>
                <FormGroup>
                  <label htmlFor="basic_salary">Basic Salary</label>
                  <input
                    type="number"
                    id="basic_salary"
                    name="basic_salary"
                    value={formData.basic_salary}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                  {errors.basic_salary && <ErrorMessage>{errors.basic_salary}</ErrorMessage>}
                </FormGroup>
              </FormColumn>
              <FormColumn>
                <FormGroup>
                  <label htmlFor="effective_from">Effective From</label>
                  <input
                    type="date"
                    id="effective_from"
                    name="effective_from"
                    value={formData.effective_from}
                    onChange={handleInputChange}
                  />
                  {errors.effective_from && <ErrorMessage>{errors.effective_from}</ErrorMessage>}
                </FormGroup>
              </FormColumn>
            </FormRow>

            <h3>Allowances</h3>
            <FormRow>
              <FormColumn>
                <FormGroup>
                  <label htmlFor="house_rent_allowance">House Rent Allowance</label>
                  <input
                    type="number"
                    id="house_rent_allowance"
                    name="house_rent_allowance"
                    value={formData.house_rent_allowance}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </FormGroup>
              </FormColumn>
              <FormColumn>
                <FormGroup>
                  <label htmlFor="transport_allowance">Transport Allowance</label>
                  <input
                    type="number"
                    id="transport_allowance"
                    name="transport_allowance"
                    value={formData.transport_allowance}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </FormGroup>
              </FormColumn>
            </FormRow>

            <FormRow>
              <FormColumn>
                <FormGroup>
                  <label htmlFor="medical_allowance">Medical Allowance</label>
                  <input
                    type="number"
                    id="medical_allowance"
                    name="medical_allowance"
                    value={formData.medical_allowance}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </FormGroup>
              </FormColumn>
              <FormColumn>
                <FormGroup>
                  <label htmlFor="special_allowance">Special Allowance</label>
                  <input
                    type="number"
                    id="special_allowance"
                    name="special_allowance"
                    value={formData.special_allowance}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </FormGroup>
              </FormColumn>
            </FormRow>

            <h3>Deductions</h3>
            <FormRow>
              <FormColumn>
                <FormGroup>
                  <label htmlFor="tax_deduction">Tax Deduction</label>
                  <input
                    type="number"
                    id="tax_deduction"
                    name="tax_deduction"
                    value={formData.tax_deduction}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                  {errors.tax_deduction && <ErrorMessage>{errors.tax_deduction}</ErrorMessage>}
                </FormGroup>
              </FormColumn>
              <FormColumn>
                <FormGroup>
                  <label htmlFor="provident_fund">Provident Fund</label>
                  <input
                    type="number"
                    id="provident_fund"
                    name="provident_fund"
                    value={formData.provident_fund}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </FormGroup>
              </FormColumn>
            </FormRow>

            <FormRow>
              <FormColumn>
                <FormGroup>
                  <label htmlFor="insurance">Insurance</label>
                  <input
                    type="number"
                    id="insurance"
                    name="insurance"
                    value={formData.insurance}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </FormGroup>
              </FormColumn>
              <FormColumn>
                <FormGroup>
                  <label htmlFor="other_deductions">Other Deductions</label>
                  <input
                    type="number"
                    id="other_deductions"
                    name="other_deductions"
                    value={formData.other_deductions}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </FormGroup>
              </FormColumn>
            </FormRow>

            {errors.submit && <ErrorMessage>{errors.submit}</ErrorMessage>}

            <ModalActions>
              <Button variant="secondary" onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={handleSubmit}>
                {editMode ? 'Update' : 'Create'}
              </Button>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <Modal isOpen={!!confirmDelete} onClose={handleCancelDelete}>
          <ModalContent>
            <ModalTitle>Confirm Delete</ModalTitle>
            <p>
              Are you sure you want to delete the salary structure for {getEmployeeName(confirmDelete.employee_id)}?
              This action cannot be undone.
            </p>
            <ModalActions>
              <Button variant="secondary" onClick={handleCancelDelete}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}
    </PageContainer>
  );
};

export default SalaryStructures;
