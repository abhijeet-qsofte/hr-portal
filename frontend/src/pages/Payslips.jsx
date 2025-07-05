import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit, FiTrash2, FiDownload, FiCheck, FiDollarSign, FiFileText, FiFilter } from 'react-icons/fi';
import { format } from 'date-fns';
import { payslipApi, employeeApi, salaryStructureApi } from '../utils/api';

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

const FilterContainer = styled.div`
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  
  label {
    white-space: nowrap;
    font-weight: 500;
  }
  
  select {
    min-width: 150px;
  }
`;

const TabsContainer = styled.div`
  margin-bottom: var(--spacing-lg);
`;

const TabList = styled.div`
  display: flex;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--spacing-md);
`;

const Tab = styled.button`
  padding: var(--spacing-sm) var(--spacing-md);
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.active ? 'var(--color-primary)' : 'transparent'};
  color: ${props => props.active ? 'var(--color-primary)' : 'var(--color-text)'};
  font-weight: ${props => props.active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: var(--color-primary);
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  background-color: ${props => {
    if (props.status === 'approved') return 'var(--color-success-light)';
    if (props.status === 'paid') return 'var(--color-primary-light)';
    if (props.status === 'pending') return 'var(--color-warning-light)';
    return 'var(--color-surface)';
  }};
  color: ${props => {
    if (props.status === 'approved') return 'var(--color-success)';
    if (props.status === 'paid') return 'var(--color-primary)';
    if (props.status === 'pending') return 'var(--color-warning)';
    return 'var(--color-text)';
  }};
`;

const PayslipDetails = styled.div`
  margin-bottom: var(--spacing-lg);
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--color-border);
  
  &:last-child {
    border-bottom: none;
  }
  
  span:first-child {
    color: var(--color-text-secondary);
  }
  
  span:last-child {
    font-weight: 500;
  }
`;

const TotalRow = styled(DetailRow)`
  font-weight: 600;
  border-top: 2px solid var(--color-border);
  margin-top: var(--spacing-sm);
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Payslips = () => {
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, pending, approved, paid
  const [filters, setFilters] = useState({
    month: format(new Date(), 'yyyy-MM'),
    employee_id: '',
  });
  
  // Modal states
  const [openGenerateDialog, setOpenGenerateDialog] = useState(false);
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [openPayDialog, setOpenPayDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [currentPayslip, setCurrentPayslip] = useState(null);
  
  // Form states
  const [generateForm, setGenerateForm] = useState({
    employee_id: '',
    month: format(new Date(), 'yyyy-MM'),
  });
  
  const [approveForm, setApproveForm] = useState({
    approver_id: ''
  });
  
  const [payForm, setPayForm] = useState({
    payment_reference: '',
    payment_date: format(new Date(), 'yyyy-MM-dd')
  });
  
  const [errors, setErrors] = useState({});
  
  // Fetch payslips, employees and salary structures
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [payslipsRes, employeesRes] = await Promise.all([
          payslipApi.getAll(),
          employeeApi.getAll()
        ]);
        setPayslips(payslipsRes.data);
        setEmployees(employeesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter payslips based on active tab and filters
  const filteredPayslips = payslips.filter(payslip => {
    // Filter by tab
    if (activeTab === 'pending' && payslip.is_approved) return false;
    if (activeTab === 'approved' && (!payslip.is_approved || payslip.is_paid)) return false;
    if (activeTab === 'paid' && !payslip.is_paid) return false;
    
    // Filter by month
    if (filters.month && !payslip.month.startsWith(filters.month)) return false;
    
    // Filter by employee
    if (filters.employee_id && payslip.employee_id !== filters.employee_id) return false;
    
    return true;
  });

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Handle tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle generate form changes
  const handleGenerateFormChange = (e) => {
    const { name, value } = e.target;
    setGenerateForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle approve form changes
  const handleApproveFormChange = (e) => {
    const { name, value } = e.target;
    setApproveForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle pay form changes
  const handlePayFormChange = (e) => {
    const { name, value } = e.target;
    setPayForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Open generate dialog
  const handleOpenGenerateDialog = () => {
    setGenerateForm({
      employee_id: '',
      month: format(new Date(), 'yyyy-MM'),
    });
    setErrors({});
    setOpenGenerateDialog(true);
  };

  // Close generate dialog
  const handleCloseGenerateDialog = () => {
    setOpenGenerateDialog(false);
  };

  // Open approve dialog
  const handleOpenApproveDialog = (payslip) => {
    setCurrentPayslip(payslip);
    setApproveForm({
      approver_id: ''
    });
    setErrors({});
    setOpenApproveDialog(true);
  };

  // Close approve dialog
  const handleCloseApproveDialog = () => {
    setOpenApproveDialog(false);
  };

  // Open pay dialog
  const handleOpenPayDialog = (payslip) => {
    setCurrentPayslip(payslip);
    setPayForm({
      payment_reference: '',
      payment_date: format(new Date(), 'yyyy-MM-dd')
    });
    setErrors({});
    setOpenPayDialog(true);
  };

  // Close pay dialog
  const handleClosePayDialog = () => {
    setOpenPayDialog(false);
  };

  // Open view dialog
  const handleOpenViewDialog = (payslip) => {
    setCurrentPayslip(payslip);
    setOpenViewDialog(true);
  };

  // Close view dialog
  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
  };

  // Validate generate form
  const validateGenerateForm = () => {
    const newErrors = {};
    
    if (!generateForm.employee_id) {
      newErrors.employee_id = 'Please select an employee';
    }
    
    if (!generateForm.month) {
      newErrors.month = 'Please select a month';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate approve form
  const validateApproveForm = () => {
    const newErrors = {};
    
    if (!approveForm.approver_id) {
      newErrors.approver_id = 'Please select an approver';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate pay form
  const validatePayForm = () => {
    const newErrors = {};
    
    if (!payForm.payment_reference) {
      newErrors.payment_reference = 'Please enter a payment reference';
    }
    
    if (!payForm.payment_date) {
      newErrors.payment_date = 'Please select a payment date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit generate form
  const handleGenerateSubmit = async () => {
    if (!validateGenerateForm()) return;
    
    try {
      const res = await payslipApi.generate(
        generateForm.employee_id,
        generateForm.month,
        // Optional processor ID can be added here if needed
        null
      );
      setPayslips([...payslips, res.data]);
      handleCloseGenerateDialog();
    } catch (error) {
      console.error('Error generating payslip:', error);
      setErrors({ submit: 'Failed to generate payslip' });
    }
  };

  // Submit approve form
  const handleApproveSubmit = async () => {
    if (!validateApproveForm() || !currentPayslip) return;
    
    try {
      const res = await payslipApi.approve(currentPayslip.id, approveForm.approver_id);
      const updatedPayslips = payslips.map(p => 
        p.id === currentPayslip.id ? { ...p, ...res.data } : p
      );
      setPayslips(updatedPayslips);
      handleCloseApproveDialog();
    } catch (error) {
      console.error('Error approving payslip:', error);
      setErrors({ submit: 'Failed to approve payslip' });
    }
  };

  // Submit pay form
  const handlePaySubmit = async () => {
    if (!validatePayForm() || !currentPayslip) return;
    
    try {
      const res = await payslipApi.markAsPaid(currentPayslip.id, payForm.payment_reference);
      const updatedPayslips = payslips.map(p => 
        p.id === currentPayslip.id ? { ...p, ...res.data } : p
      );
      setPayslips(updatedPayslips);
      handleClosePayDialog();
    } catch (error) {
      console.error('Error marking payslip as paid:', error);
      setErrors({ submit: 'Failed to mark payslip as paid' });
    }
  };

  // Download payslip
  const handleDownloadPayslip = async (payslip) => {
    try {
      const response = await payslipApi.downloadPdf(payslip.id);
      
      // Create a blob from the PDF data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      
      // Set the filename from the Content-Disposition header or use a default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `payslip_${payslip.employee_name || 'employee'}_${payslip.month}.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=([^;]+)/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/["']/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      
      // Append the link to the body
      document.body.appendChild(link);
      
      // Click the link to trigger the download
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error downloading payslip:', error);
      alert('Failed to download payslip. Please try again.');
    }
  };

  // Get employee name by ID
  const getEmployeeName = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.name : 'Unknown Employee';
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Format month
  const formatMonth = (monthString) => {
    try {
      if (!monthString) return 'N/A';
      return format(new Date(monthString + '-01'), 'MMMM yyyy');
    } catch (error) {
      return 'Invalid Month';
    }
  };

  // Table columns
  const columns = [
    { header: 'Employee', accessor: 'employee_id', render: (value) => getEmployeeName(value) },
    { header: 'Month', accessor: 'month', render: (value) => formatMonth(value) },
    { header: 'Gross Salary', accessor: 'gross_amount', render: (value) => formatCurrency(value) },
    { header: 'Net Salary', accessor: 'net_amount', render: (value) => formatCurrency(value) },
    { header: 'Status', accessor: 'status', render: (_, row) => {
      if (!row) return <StatusBadge status="pending">Unknown</StatusBadge>;
      if (row.is_paid) return <StatusBadge status="paid">Paid</StatusBadge>;
      if (row.is_approved) return <StatusBadge status="approved">Approved</StatusBadge>;
      return <StatusBadge status="pending">Pending</StatusBadge>;
    }},
    { header: 'Payment Date', accessor: 'payment_date', render: (value) => value ? formatDate(value) : 'Not Paid' },
    {
      header: 'Actions',
      accessor: 'id',
      render: (value, row) => {
        if (!row) return null;
        
        return (
          <ActionButtons>
            <Button 
              icon={<FiFileText />} 
              variant="secondary" 
              size="sm" 
              onClick={() => handleOpenViewDialog(row)}
              aria-label="View"
            >
              View
            </Button>
            {!row.is_approved && !row.is_paid && (
              <Button 
                icon={<FiCheck />} 
                variant="secondary" 
                size="sm" 
                onClick={() => handleOpenApproveDialog(row)}
                aria-label="Approve"
              >
                Approve
              </Button>
            )}
            {row.is_approved && !row.is_paid && (
              <Button 
                icon={<FiDollarSign />} 
                variant="secondary" 
                size="sm" 
                onClick={() => handleOpenPayDialog(row)}
                aria-label="Mark as Paid"
              >
                Pay
              </Button>
            )}
            {(row.is_approved || row.is_paid) && (
              <Button 
                icon={<FiDownload />} 
                variant="secondary" 
                size="sm" 
                onClick={() => handleDownloadPayslip(row)}
                aria-label="Download PDF"
              >
                Download
              </Button>
            )}
          </ActionButtons>
        );
      }
    }
  ];

  // Calculate summary totals
  const summaryData = {
    totalPayslips: filteredPayslips.length,
    totalGrossSalary: filteredPayslips.reduce((sum, p) => sum + (p.gross_salary || 0), 0),
    totalNetSalary: filteredPayslips.reduce((sum, p) => sum + (p.net_salary || 0), 0),
    totalDeductions: filteredPayslips.reduce((sum, p) => sum + ((p.gross_salary || 0) - (p.net_salary || 0)), 0),
    pendingCount: filteredPayslips.filter(p => !p.is_approved && !p.is_paid).length,
    approvedCount: filteredPayslips.filter(p => p.is_approved && !p.is_paid).length,
    paidCount: filteredPayslips.filter(p => p.is_paid).length
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <h1>Payslips</h1>
          <p>Generate and manage employee payslips</p>
        </PageTitle>
        <Button
          icon={<FiPlus />}
          onClick={handleOpenGenerateDialog}
        >
          Generate Payslip
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <SummaryGrid>
        <SummaryCard>
          <Card.Body>
            <SummaryItem>
              <h4>Total Payslips</h4>
              <p>{summaryData.totalPayslips}</p>
            </SummaryItem>
          </Card.Body>
        </SummaryCard>
        
        <SummaryCard>
          <Card.Body>
            <SummaryItem>
              <h4>Total Gross Salary</h4>
              <p>{formatCurrency(summaryData.totalGrossSalary)}</p>
            </SummaryItem>
          </Card.Body>
        </SummaryCard>
        
        <SummaryCard>
          <Card.Body>
            <SummaryItem>
              <h4>Total Net Salary</h4>
              <p>{formatCurrency(summaryData.totalNetSalary)}</p>
            </SummaryItem>
          </Card.Body>
        </SummaryCard>
        
        <SummaryCard>
          <Card.Body>
            <SummaryItem highlight>
              <h4>Total Deductions</h4>
              <p>{formatCurrency(summaryData.totalDeductions)}</p>
            </SummaryItem>
          </Card.Body>
        </SummaryCard>
      </SummaryGrid>

      {/* Tabs */}
      <TabsContainer>
        <TabList>
          <Tab active={activeTab === 'all'} onClick={() => handleTabChange('all')}>
            All Payslips ({filteredPayslips.length})
          </Tab>
          <Tab active={activeTab === 'pending'} onClick={() => handleTabChange('pending')}>
            Pending ({summaryData.pendingCount})
          </Tab>
          <Tab active={activeTab === 'approved'} onClick={() => handleTabChange('approved')}>
            Approved ({summaryData.approvedCount})
          </Tab>
          <Tab active={activeTab === 'paid'} onClick={() => handleTabChange('paid')}>
            Paid ({summaryData.paidCount})
          </Tab>
        </TabList>
      </TabsContainer>

      {/* Filters */}
      <FilterContainer>
        <FilterGroup>
          <label htmlFor="month">Month:</label>
          <input
            type="month"
            id="month"
            name="month"
            value={filters.month}
            onChange={handleFilterChange}
          />
        </FilterGroup>
        
        <FilterGroup>
          <label htmlFor="employee_id">Employee:</label>
          <select
            id="employee_id"
            name="employee_id"
            value={filters.employee_id}
            onChange={handleFilterChange}
          >
            <option value="">All Employees</option>
            {employees.map(employee => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </FilterGroup>
      </FilterContainer>

      {/* Payslips Table */}
      <Card>
        <Card.Header>
          <h3>Payslips</h3>
        </Card.Header>
        <Card.Body>
          <Table
            columns={columns}
            data={filteredPayslips}
            loading={loading}
            emptyMessage="No payslips found"
          />
        </Card.Body>
      </Card>

      {/* Generate Payslip Modal */}
      {openGenerateDialog && (
        <Modal isOpen={openGenerateDialog} onClose={handleCloseGenerateDialog}>
          <ModalContent>
            <ModalTitle>Generate Payslip</ModalTitle>
            
            <FormGroup>
              <label htmlFor="employee_id">Employee</label>
              <select
                id="employee_id"
                name="employee_id"
                value={generateForm.employee_id}
                onChange={handleGenerateFormChange}
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

            <FormGroup>
              <label htmlFor="month">Month</label>
              <input
                type="month"
                id="month"
                name="month"
                value={generateForm.month}
                onChange={handleGenerateFormChange}
              />
              {errors.month && <ErrorMessage>{errors.month}</ErrorMessage>}
            </FormGroup>

            {errors.submit && <ErrorMessage>{errors.submit}</ErrorMessage>}

            <ModalActions>
              <Button variant="secondary" onClick={handleCloseGenerateDialog}>Cancel</Button>
              <Button onClick={handleGenerateSubmit}>Generate</Button>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}

      {/* Approve Payslip Modal */}
      {openApproveDialog && currentPayslip && (
        <Modal isOpen={openApproveDialog} onClose={handleCloseApproveDialog}>
          <ModalContent>
            <ModalTitle>Approve Payslip</ModalTitle>
            
            <p>
              You are about to approve the payslip for {getEmployeeName(currentPayslip.employee_id)} 
              for {formatMonth(currentPayslip.month)}.
            </p>

            <FormGroup>
              <label htmlFor="approver_id">Approver</label>
              <select
                id="approver_id"
                name="approver_id"
                value={approveForm.approver_id}
                onChange={handleApproveFormChange}
              >
                <option value="">Select Approver</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
              {errors.approver_id && <ErrorMessage>{errors.approver_id}</ErrorMessage>}
            </FormGroup>

            {errors.submit && <ErrorMessage>{errors.submit}</ErrorMessage>}

            <ModalActions>
              <Button variant="secondary" onClick={handleCloseApproveDialog}>Cancel</Button>
              <Button onClick={handleApproveSubmit}>Approve</Button>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}

      {/* Mark as Paid Modal */}
      {openPayDialog && currentPayslip && (
        <Modal isOpen={openPayDialog} onClose={handleClosePayDialog}>
          <ModalContent>
            <ModalTitle>Mark Payslip as Paid</ModalTitle>
            
            <p>
              You are about to mark the payslip for {getEmployeeName(currentPayslip.employee_id)} 
              for {formatMonth(currentPayslip.month)} as paid.
            </p>

            <FormGroup>
              <label htmlFor="payment_reference">Payment Reference</label>
              <input
                type="text"
                id="payment_reference"
                name="payment_reference"
                value={payForm.payment_reference}
                onChange={handlePayFormChange}
                placeholder="e.g. Bank Transfer ID, Check Number"
              />
              {errors.payment_reference && <ErrorMessage>{errors.payment_reference}</ErrorMessage>}
            </FormGroup>

            <FormGroup>
              <label htmlFor="payment_date">Payment Date</label>
              <input
                type="date"
                id="payment_date"
                name="payment_date"
                value={payForm.payment_date}
                onChange={handlePayFormChange}
              />
              {errors.payment_date && <ErrorMessage>{errors.payment_date}</ErrorMessage>}
            </FormGroup>

            {errors.submit && <ErrorMessage>{errors.submit}</ErrorMessage>}

            <ModalActions>
              <Button variant="secondary" onClick={handleClosePayDialog}>Cancel</Button>
              <Button onClick={handlePaySubmit}>Mark as Paid</Button>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}

      {/* View Payslip Modal */}
      {openViewDialog && currentPayslip && (
        <Modal isOpen={openViewDialog} onClose={handleCloseViewDialog}>
          <ModalContent>
            <ModalTitle>Payslip Details</ModalTitle>
            
            <PayslipDetails>
              <DetailRow>
                <span>Employee:</span>
                <span>{getEmployeeName(currentPayslip.employee_id)}</span>
              </DetailRow>
              <DetailRow>
                <span>Month:</span>
                <span>{formatMonth(currentPayslip.month)}</span>
              </DetailRow>
              <DetailRow>
                <span>Working Days:</span>
                <span>{currentPayslip.working_days}</span>
              </DetailRow>
              <DetailRow>
                <span>Days Present:</span>
                <span>{currentPayslip.days_present}</span>
              </DetailRow>
              <DetailRow>
                <span>Leave Days:</span>
                <span>{currentPayslip.leave_days}</span>
              </DetailRow>
              <DetailRow>
                <span>Overtime Hours:</span>
                <span>{currentPayslip.overtime_hours}</span>
              </DetailRow>
              <DetailRow>
                <span>Overtime Rate:</span>
                <span>{formatCurrency(currentPayslip.overtime_rate)}</span>
              </DetailRow>
              <DetailRow>
                <span>Overtime Amount:</span>
                <span>{formatCurrency(currentPayslip.overtime_amount)}</span>
              </DetailRow>
              <DetailRow>
                <span>Bonus:</span>
                <span>{formatCurrency(currentPayslip.bonus)}</span>
              </DetailRow>
              {currentPayslip.bonus_description && (
                <DetailRow>
                  <span>Bonus Description:</span>
                  <span>{currentPayslip.bonus_description}</span>
                </DetailRow>
              )}
              <DetailRow>
                <span>Additional Deductions:</span>
                <span>{formatCurrency(currentPayslip.additional_deductions)}</span>
              </DetailRow>
              {currentPayslip.deduction_description && (
                <DetailRow>
                  <span>Deduction Description:</span>
                  <span>{currentPayslip.deduction_description}</span>
                </DetailRow>
              )}
              <DetailRow>
                <span>Gross Amount:</span>
                <span>{formatCurrency(currentPayslip.gross_amount)}</span>
              </DetailRow>
              <DetailRow>
                <span>Total Deductions:</span>
                <span>{formatCurrency(currentPayslip.total_deductions)}</span>
              </DetailRow>
              <TotalRow>
                <span>Net Amount:</span>
                <span>{formatCurrency(currentPayslip.net_amount)}</span>
              </TotalRow>
            </PayslipDetails>

            <ModalActions>
              <Button variant="secondary" onClick={handleCloseViewDialog}>Close</Button>
              {(currentPayslip.is_approved || currentPayslip.is_paid) && (
                <Button 
                  icon={<FiDownload />}
                  onClick={() => handleDownloadPayslip(currentPayslip)}
                >
                  Download PDF
                </Button>
              )}
            </ModalActions>
          </ModalContent>
        </Modal>
      )}
    </PageContainer>
  );
};

export default Payslips;
