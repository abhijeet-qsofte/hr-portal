import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiUser, FiMail, FiPhone, FiCalendar, FiBriefcase, 
  FiMapPin, FiDollarSign, FiClock, FiEdit2, FiTrash2,
  FiArrowLeft, FiCheckCircle, FiXCircle, FiPlus
} from 'react-icons/fi';

import Card from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';
import Modal from '../components/Modal';
import EditEmployeeForm from '../components/EditEmployeeForm';
import { employeeApi, attendanceApi, payrollApi, salaryStructureApi } from '../utils/api';
import { format, parseISO } from 'date-fns';

const PageContainer = styled.div`
  padding: var(--spacing-md) 0;
`;

const BackButton = styled(Button)`
  margin-bottom: var(--spacing-lg);
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const ProfileAvatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: var(--color-background-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--spacing-xl);
  
  svg {
    font-size: 3rem;
    color: var(--color-text-secondary);
  }
  
  @media (max-width: 768px) {
    margin-bottom: var(--spacing-lg);
    margin-right: 0;
  }
`;

const ProfileInfo = styled.div`
  flex: 1;
  
  h1 {
    margin-bottom: var(--spacing-xs);
    display: flex;
    align-items: center;
  }
  
  .position {
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-sm);
  }
  
  .status {
    display: inline-block;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
    margin-left: var(--spacing-sm);
    
    &.active {
      background-color: rgba(52, 199, 89, 0.1);
      color: var(--color-success);
    }
    
    &.inactive {
      background-color: rgba(255, 59, 48, 0.1);
      color: var(--color-error);
    }
    
    &.on_leave {
      background-color: rgba(255, 149, 0, 0.1);
      color: var(--color-warning);
    }
  }
`;

const ProfileActions = styled.div`
  display: flex;
  gap: var(--spacing-sm);
  
  @media (max-width: 768px) {
    margin-top: var(--spacing-md);
    width: 100%;
    
    button {
      flex: 1;
    }
  }
`;

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--spacing-lg);
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Tab = styled.button`
  padding: var(--spacing-md) var(--spacing-lg);
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.active ? 'var(--color-primary)' : 'transparent'};
  color: ${props => props.active ? 'var(--color-primary)' : 'var(--color-text-secondary)'};
  font-weight: ${props => props.active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover {
    color: var(--color-primary);
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  
  .icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    background-color: var(--color-background-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: var(--spacing-md);
    
    svg {
      color: var(--color-text-secondary);
    }
  }
  
  .content {
    flex: 1;
    
    .label {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      margin-bottom: var(--spacing-xs);
    }
    
    .value {
      font-weight: 500;
    }
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  margin-bottom: var(--spacing-lg);
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
  
  &.active {
    background-color: rgba(0, 200, 83, 0.1);
    color: #00c853;
  }
  
  &.inactive {
    background-color: rgba(244, 67, 54, 0.1);
    color: #f44336;
  }
  
  &.on_leave {
    background-color: rgba(255, 152, 0, 0.1);
    color: #ff9800;
  }
`;

const AttendanceStatus = styled.span`
  display: flex;
  align-items: center;
  font-weight: 500;
  
  svg {
    margin-right: var(--spacing-xs);
  }
  
  &.on-time {
    color: var(--color-success);
  }
  
  &.late {
    color: var(--color-warning);
  }
`;

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [salaryStructure, setSalaryStructure] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  useEffect(() => {
    fetchEmployeeData();
  }, [id]);
  
  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendanceRecords();
    } else if (activeTab === 'payroll') {
      fetchPayrollRecords();
    } else if (activeTab === 'salary') {
      fetchSalaryStructure();
    }
  }, [activeTab]);
  
  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      const response = await employeeApi.getById(id);
      setEmployee(response.data);
    } catch (error) {
      console.error('Error fetching employee data:', error);
      // Use mock data if API fails
      setEmployee({
        id: parseInt(id),
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '555-123-4567',
        designation: 'Farm Manager',
        location: 'Main Farm',
        status: 'active',
        doj: '2024-01-15',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAttendanceRecords = async () => {
    try {
      const response = await attendanceApi.getByEmployee(id);
      setAttendanceRecords(response.data);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      // Use mock data if API fails
      setAttendanceRecords([
        { id: 1, check_in: '2025-07-01T08:00:00', check_out: '2025-07-01T17:00:00' },
        { id: 2, check_in: '2025-07-02T08:15:00', check_out: '2025-07-02T17:30:00' },
        { id: 3, check_in: '2025-07-03T07:55:00', check_out: '2025-07-03T16:45:00' },
        { id: 4, check_in: '2025-07-04T08:05:00', check_out: '2025-07-04T17:10:00' },
        { id: 5, check_in: '2025-07-05T09:10:00', check_out: '2025-07-05T18:00:00' }
      ]);
    }
  };
  
  const fetchPayrollRecords = async () => {
    try {
      const response = await payrollApi.getByEmployee(id);
      setPayrollRecords(response.data);
    } catch (error) {
      console.error('Error fetching payroll records:', error);
      // Use mock data if API fails
      setPayrollRecords([
        { id: 1, period: 'July 2025', amount: 5000, status: 'paid', payment_date: '2025-07-01' },
        { id: 2, period: 'June 2025', amount: 5000, status: 'paid', payment_date: '2025-06-01' },
        { id: 3, period: 'May 2025', amount: 5000, status: 'paid', payment_date: '2025-05-01' },
        { id: 4, period: 'April 2025', amount: 4800, status: 'paid', payment_date: '2025-04-01' },
        { id: 5, period: 'March 2025', amount: 4800, status: 'paid', payment_date: '2025-03-01' }
      ]);
    }
  };
  
  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };
  
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };
  
  const handleEmployeeUpdate = async () => {
    // Refresh employee data after update
    await fetchEmployeeData();
  };
  
  const fetchSalaryStructure = async () => {
    try {
      const response = await salaryStructureApi.getByEmployee(employee.id);
      // Get the most recent salary structure (should be the first one if sorted by effective_from)
      if (response.data && response.data.length > 0) {
        setSalaryStructure(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching salary structure:', error);
    }
  };

  const handleDeleteEmployee = async () => {
    if (window.confirm(`Are you sure you want to delete ${employee.name}?`)) {
      try {
        await employeeApi.delete(employee.id);
        navigate('/employees');
      } catch (error) {
        console.error('Error deleting employee:', error);
      }
    }
  };
  
  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'N/A';
    }
  };
  
  const formatTime = (dateString) => {
    try {
      return format(parseISO(dateString), 'h:mm a');
    } catch (error) {
      return 'N/A';
    }
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const attendanceColumns = [
    { 
      accessor: 'check_in', 
      header: 'Date',
      render: (value) => formatDate(value)
    },
    { 
      accessor: 'check_in', 
      header: 'Check In',
      render: (value) => formatTime(value)
    },
    { 
      accessor: 'check_out', 
      header: 'Check Out',
      render: (value) => value ? formatTime(value) : 'Not checked out'
    },
    { 
      accessor: 'check_in', 
      header: 'Duration',
      render: (value, row) => {
        if (!value || !row.check_out) return 'N/A';
        
        try {
          const checkIn = parseISO(value);
          const checkOut = parseISO(row.check_out);
          const diffMs = checkOut - checkIn;
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          
          return `${hours}h ${minutes}m`;
        } catch (error) {
          return 'N/A';
        }
      }
    },
    { 
      accessor: 'check_in', 
      header: 'Status',
      render: (value, row) => {
        try {
          const checkIn = parseISO(value);
          const isLate = checkIn.getHours() > 9 || (checkIn.getHours() === 9 && checkIn.getMinutes() > 0);
          
          return (
            <span style={{ color: isLate ? 'var(--color-warning)' : 'var(--color-success)', fontWeight: 500 }}>
              {isLate ? 'Late' : 'On Time'}
            </span>
          );
        } catch (error) {
          return 'N/A';
        }
      }
    }
  ];
  
  const payrollColumns = [
    { 
      accessor: 'period', 
      header: 'Pay Period',
      render: (value) => value
    },
    { 
      accessor: 'amount', 
      header: 'Amount',
      render: (value) => formatCurrency(value)
    },
    { 
      accessor: 'status', 
      header: 'Status',
      render: (value) => (
        <span style={{ 
          color: value === 'paid' ? 'var(--color-success)' : 'var(--color-warning)',
          fontWeight: 500,
          textTransform: 'capitalize'
        }}>
          {value}
        </span>
      )
    },
    { 
      accessor: 'payment_date', 
      header: 'Payment Date',
      render: (value) => value ? formatDate(value) : 'Not Paid'
    }
  ];
  
  if (loading) {
    return (
      <PageContainer>
        <p>Loading employee data...</p>
      </PageContainer>
    );
  }
  
  if (!employee) {
    return (
      <PageContainer>
        <p>Employee not found</p>
        <BackButton variant="secondary" onClick={() => navigate('/employees')}>
          <FiArrowLeft /> Back to Employees
        </BackButton>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <BackButton variant="secondary" onClick={() => navigate('/employees')}>
        <FiArrowLeft /> Back to Employees
      </BackButton>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ProfileHeader>
          <ProfileAvatar>
            <FiUser />
          </ProfileAvatar>
          
          <ProfileInfo>
            <h1>
              {employee.name}
              <span className={`status ${employee.status}`}>
                {employee.status?.replace('_', ' ')}
              </span>
            </h1>
            <div className="position">{employee.designation} • {employee.location}</div>
          </ProfileInfo>
          
          <ProfileActions>
            <Button variant="secondary" onClick={handleEditClick}>
              <FiEdit2 /> Edit
            </Button>
            <Button variant="danger" onClick={handleDeleteEmployee}>
              <FiTrash2 /> Delete
            </Button>
          </ProfileActions>
        </ProfileHeader>
        
        <TabsContainer>
          <Tab 
            active={activeTab === 'info'} 
            onClick={() => setActiveTab('info')}
          >
            Personal Information
          </Tab>
          <Tab 
            active={activeTab === 'attendance'} 
            onClick={() => setActiveTab('attendance')}
          >
            Attendance History
          </Tab>
          <Tab 
            active={activeTab === 'payroll'} 
            onClick={() => setActiveTab('payroll')}
          >
            Payroll History
          </Tab>
          <Tab 
            active={activeTab === 'salary'} 
            onClick={() => setActiveTab('salary')}
          >
            Salary Structure
          </Tab>
        </TabsContainer>
        
        {activeTab === 'info' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <InfoGrid>
              <InfoItem>
                <div className="icon">
                  <FiMail />
                </div>
                <div className="content">
                  <div className="label">Email</div>
                  <div className="value">{employee.email || 'Not provided'}</div>
                </div>
              </InfoItem>
              
              <InfoItem>
                <div className="icon">
                  <FiPhone />
                </div>
                <div className="content">
                  <div className="label">Phone</div>
                  <div className="value">{employee.phone}</div>
                </div>
              </InfoItem>
              
              <InfoItem>
                <div className="icon">
                  <FiCalendar />
                </div>
                <div className="content">
                  <div className="label">Date of Joining</div>
                  <div className="value">{formatDate(employee.doj)}</div>
                </div>
              </InfoItem>
              
              <InfoItem>
                <div className="icon">
                  <FiBriefcase />
                </div>
                <div className="content">
                  <div className="label">Designation</div>
                  <div className="value">{employee.designation}</div>
                </div>
              </InfoItem>
              
              <InfoItem>
                <div className="icon">
                  <FiMapPin />
                </div>
                <div className="content">
                  <div className="label">Location</div>
                  <div className="value">{employee.location}</div>
                </div>
              </InfoItem>
              
              <InfoItem>
                <div className="icon">
                  <FiCheckCircle />
                </div>
                <div className="content">
                  <div className="label">Status</div>
                  <div className="value">
                    <StatusBadge className={employee.status}>
                      {employee.status?.charAt(0).toUpperCase() + employee.status?.slice(1)}
                    </StatusBadge>
                  </div>
                </div>
              </InfoItem>
              
              <InfoItem>
                <div className="icon">
                  <FiClock />
                </div>
                <div className="content">
                  <div className="label">Created At</div>
                  <div className="value">{formatDate(employee.created_at)}</div>
                </div>
              </InfoItem>
              
              <InfoItem>
                <div className="icon">
                  <FiClock />
                </div>
                <div className="content">
                  <div className="label">Last Updated</div>
                  <div className="value">{formatDate(employee.updated_at)}</div>
                </div>
              </InfoItem>
            </InfoGrid>
          </motion.div>
        )}
        
        {activeTab === 'attendance' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <SectionTitle>Attendance History</SectionTitle>
            <Card>
              <Table 
                columns={attendanceColumns} 
                data={attendanceRecords} 
                emptyMessage="No attendance records found"
              />
            </Card>
          </motion.div>
        )}
        
        {activeTab === 'payroll' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <SectionTitle>Payroll History</SectionTitle>
            <Card>
              <Table 
                columns={payrollColumns} 
                data={payrollRecords} 
                emptyMessage="No payroll records found"
              />
            </Card>
          </motion.div>
        )}
        
        {activeTab === 'salary' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {salaryStructure ? (
              <Card>
                <Card.Header>
                  <h3>Current Salary Structure</h3>
                  <p>Effective from: {formatDate(salaryStructure.effective_from)}</p>
                </Card.Header>
                <Card.Body>
                  <InfoGrid>
                    <InfoItem>
                      <div className="icon">
                        <FiDollarSign />
                      </div>
                      <div className="content">
                        <div className="label">Basic Salary</div>
                        <div className="value">{formatCurrency(salaryStructure.basic_salary)}</div>
                      </div>
                    </InfoItem>
                    
                    <InfoItem>
                      <div className="icon">
                        <FiDollarSign />
                      </div>
                      <div className="content">
                        <div className="label">House Rent Allowance</div>
                        <div className="value">{formatCurrency(salaryStructure.house_rent_allowance)}</div>
                      </div>
                    </InfoItem>
                    
                    <InfoItem>
                      <div className="icon">
                        <FiDollarSign />
                      </div>
                      <div className="content">
                        <div className="label">Medical Allowance</div>
                        <div className="value">{formatCurrency(salaryStructure.medical_allowance)}</div>
                      </div>
                    </InfoItem>
                    
                    <InfoItem>
                      <div className="icon">
                        <FiDollarSign />
                      </div>
                      <div className="content">
                        <div className="label">Transport Allowance</div>
                        <div className="value">{formatCurrency(salaryStructure.transport_allowance)}</div>
                      </div>
                    </InfoItem>
                    
                    <InfoItem>
                      <div className="icon">
                        <FiDollarSign />
                      </div>
                      <div className="content">
                        <div className="label">Special Allowance</div>
                        <div className="value">{formatCurrency(salaryStructure.special_allowance)}</div>
                      </div>
                    </InfoItem>
                    
                    <InfoItem>
                      <div className="icon">
                        <FiDollarSign />
                      </div>
                      <div className="content">
                        <div className="label">Gross Salary</div>
                        <div className="value">{formatCurrency(salaryStructure.gross_salary)}</div>
                      </div>
                    </InfoItem>
                  </InfoGrid>
                  
                  <h4 style={{ marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-md)' }}>Deductions</h4>
                  
                  <InfoGrid>
                    <InfoItem>
                      <div className="icon">
                        <FiDollarSign />
                      </div>
                      <div className="content">
                        <div className="label">Tax Deduction</div>
                        <div className="value">{formatCurrency(salaryStructure.tax_deduction)}</div>
                      </div>
                    </InfoItem>
                    
                    <InfoItem>
                      <div className="icon">
                        <FiDollarSign />
                      </div>
                      <div className="content">
                        <div className="label">Provident Fund</div>
                        <div className="value">{formatCurrency(salaryStructure.provident_fund)}</div>
                      </div>
                    </InfoItem>
                    
                    <InfoItem>
                      <div className="icon">
                        <FiDollarSign />
                      </div>
                      <div className="content">
                        <div className="label">Insurance</div>
                        <div className="value">{formatCurrency(salaryStructure.insurance)}</div>
                      </div>
                    </InfoItem>
                    
                    <InfoItem>
                      <div className="icon">
                        <FiDollarSign />
                      </div>
                      <div className="content">
                        <div className="label">Other Deductions</div>
                        <div className="value">{formatCurrency(salaryStructure.other_deductions)}</div>
                      </div>
                    </InfoItem>
                    
                    <InfoItem>
                      <div className="icon">
                        <FiDollarSign />
                      </div>
                      <div className="content">
                        <div className="label">Total Deductions</div>
                        <div className="value">{formatCurrency(salaryStructure.tax_deduction + salaryStructure.provident_fund + salaryStructure.insurance + salaryStructure.other_deductions)}</div>
                      </div>
                    </InfoItem>
                    
                    <InfoItem>
                      <div className="icon">
                        <FiDollarSign />
                      </div>
                      <div className="content">
                        <div className="label">Net Salary</div>
                        <div className="value">{formatCurrency(salaryStructure.net_salary)}</div>
                      </div>
                    </InfoItem>
                  </InfoGrid>
                </Card.Body>
              </Card>
            ) : (
              <Card>
                <Card.Body>
                  <p>No salary structure found for this employee.</p>
                  <Button 
                    onClick={() => navigate(`/salary-structures?employee=${employee.id}`)}
                    style={{ marginTop: 'var(--spacing-md)' }}
                  >
                    <FiPlus /> Create Salary Structure
                  </Button>
                </Card.Body>
              </Card>
            )}
          </motion.div>
        )}
      </motion.div>
      
      {/* Edit Employee Modal */}
      {isEditModalOpen && employee && (
        <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal}>
          <EditEmployeeForm 
            employee={employee} 
            onClose={handleCloseEditModal} 
            onUpdate={handleEmployeeUpdate} 
          />
        </Modal>
      )}
    </PageContainer>
  );
};

export default EmployeeDetail;
