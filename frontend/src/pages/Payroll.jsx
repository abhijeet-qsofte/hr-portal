import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiPlus, FiCalendar, FiDollarSign, FiFilter, FiDownload } from 'react-icons/fi';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';

import Table from '../components/Table';
import Card from '../components/Card';
import Button from '../components/Button';
import { payrollApi } from '../utils/api';

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

const FiltersContainer = styled.div`
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const FilterDropdown = styled.div`
  position: relative;
  min-width: 200px;
  
  select {
    padding-left: 40px;
    appearance: none;
    cursor: pointer;
  }
  
  svg {
    position: absolute;
    left: var(--spacing-md);
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-secondary);
    pointer-events: none;
  }
`;

const SummaryCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
`;

const SummaryCard = styled(Card)`
  padding: var(--spacing-lg);
`;

const SummaryContent = styled.div`
  display: flex;
  align-items: center;
`;

const SummaryIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background-color: ${props => props.bgColor || 'rgba(0, 113, 227, 0.1)'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--spacing-lg);
  
  svg {
    font-size: 1.5rem;
    color: ${props => props.iconColor || 'var(--color-primary)'};
  }
`;

const SummaryInfo = styled.div`
  h3 {
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 0;
    letter-spacing: -0.025em;
  }
  
  p {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin: 0;
  }
`;

const TableActions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--spacing-md);
  
  button {
    margin-left: var(--spacing-sm);
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: var(--spacing-lg);
  
  span {
    margin: 0 var(--spacing-md);
    color: var(--color-text-secondary);
  }
`;

const Payroll = () => {
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('current');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [summary, setSummary] = useState({
    totalAmount: 0,
    averageSalary: 0,
    highestSalary: 0,
    employeeCount: 0
  });
  const pageSize = 10;
  
  useEffect(() => {
    handlePeriodFilterChange({ target: { value: 'current' } });
  }, []);
  
  const fetchPayrollRecords = async (startDate, endDate) => {
    setLoading(true);
    try {
      const params = {
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
        start_date: startDate,
        end_date: endDate
      };
      
      const response = await payrollApi.getAll(params);
      setPayrollRecords(response.data);
      setTotalRecords(parseInt(response.headers['x-total-count'] || 0));
      
      // Calculate summary
      const totalAmount = response.data.reduce((sum, record) => sum + record.salary_total, 0);
      const employeeCount = new Set(response.data.map(record => record.employee_id)).size;
      const averageSalary = employeeCount > 0 ? totalAmount / employeeCount : 0;
      const highestSalary = Math.max(...response.data.map(record => record.salary_total), 0);
      
      setSummary({
        totalAmount,
        averageSalary,
        highestSalary,
        employeeCount
      });
      
    } catch (error) {
      console.error('Error fetching payroll records:', error);
      // Use mock data if API fails
      const mockRecords = [
        { id: 1, employee_id: 1, month: '2025-06', days_present: 22, salary_total: 3870.0, base_salary: 3520.0, overtime_hours: 10.0, overtime_rate: 30.0, bonus: 200.0, deductions: 150.0, created_at: '2025-07-01T10:00:00Z', updated_at: '2025-07-01T10:00:00Z', processed_by: 4 },
        { id: 2, employee_id: 2, month: '2025-06', days_present: 20, salary_total: 2492.5, base_salary: 2400.0, overtime_hours: 5.0, overtime_rate: 22.5, bonus: 100.0, deductions: 120.0, created_at: '2025-07-01T10:00:00Z', updated_at: '2025-07-01T10:00:00Z', processed_by: 4 },
        { id: 3, employee_id: 3, month: '2025-06', days_present: 21, salary_total: 3225.0, base_salary: 2940.0, overtime_hours: 12.0, overtime_rate: 26.25, bonus: 150.0, deductions: 180.0, created_at: '2025-07-01T10:00:00Z', updated_at: '2025-07-01T10:00:00Z', processed_by: 4 },
        { id: 4, employee_id: 4, month: '2025-06', days_present: 19, salary_total: 3150.0, base_salary: 3000.0, overtime_hours: 8.0, overtime_rate: 25.0, bonus: 100.0, deductions: 150.0, created_at: '2025-07-01T10:00:00Z', updated_at: '2025-07-01T10:00:00Z', processed_by: 4 },
        { id: 5, employee_id: 5, month: '2025-06', days_present: 18, salary_total: 2730.0, base_salary: 2600.0, overtime_hours: 6.0, overtime_rate: 21.67, bonus: 80.0, deductions: 130.0, created_at: '2025-07-01T10:00:00Z', updated_at: '2025-07-01T10:00:00Z', processed_by: 4 }
      ];
      
      setPayrollRecords(mockRecords);
      setTotalRecords(mockRecords.length);
      
      // Calculate summary from mock data
      const totalAmount = mockRecords.reduce((sum, record) => sum + record.amount, 0);
      const employeeCount = new Set(mockRecords.map(record => record.employee_id)).size;
      const averageSalary = employeeCount > 0 ? totalAmount / employeeCount : 0;
      const highestSalary = Math.max(...mockRecords.map(record => record.amount), 0);
      
      setSummary({
        totalAmount,
        averageSalary,
        highestSalary,
        employeeCount
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handlePeriodFilterChange = (e) => {
    const value = e.target.value;
    setPeriodFilter(value);
    
    const now = new Date();
    let startDate, endDate;
    
    switch (value) {
      case 'current':
        startDate = format(startOfMonth(now), 'yyyy-MM-dd');
        endDate = format(endOfMonth(now), 'yyyy-MM-dd');
        break;
      case 'previous':
        const prevMonth = subMonths(now, 1);
        startDate = format(startOfMonth(prevMonth), 'yyyy-MM-dd');
        endDate = format(endOfMonth(prevMonth), 'yyyy-MM-dd');
        break;
      case 'last3months':
        startDate = format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd');
        endDate = format(endOfMonth(now), 'yyyy-MM-dd');
        break;
      default:
        startDate = format(startOfMonth(now), 'yyyy-MM-dd');
        endDate = format(endOfMonth(now), 'yyyy-MM-dd');
    }
    
    fetchPayrollRecords(startDate, endDate);
    setCurrentPage(1); // Reset to first page when filter changes
  };
  
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };
  
  const totalPages = Math.ceil(totalRecords / pageSize);
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      
      // Check if the string can be parsed as a valid date
      const date = parseISO(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };
  
  const columns = [
    { 
      accessor: 'employee_id', 
      header: 'Employee ID',
      render: (value) => (
        <Link to={`/employees/${value}`}>
          {value}
        </Link>
      )
    },
    { 
      accessor: 'month', 
      header: 'Pay Period',
      render: (value) => {
        try {
          const date = parseISO(value + '-01');
          return format(date, 'MMMM yyyy');
        } catch (error) {
          return value || 'N/A';
        }
      }
    },
    { 
      accessor: 'salary_total', 
      header: 'Amount',
      render: (value) => (
        <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>
          {formatCurrency(value)}
        </span>
      )
    },
    { 
      accessor: 'days_present', 
      header: 'Days Present'
    },
    { 
      accessor: 'created_at', 
      header: 'Payment Date',
      render: (value) => formatDate(value)
    }
  ];
  
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Payroll
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Manage employee compensation
          </motion.p>
        </PageTitle>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Button>
            <FiPlus /> Process Payroll
          </Button>
        </motion.div>
      </PageHeader>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <SummaryCards>
          <SummaryCard 
            as={motion.div}
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 300 }}
            accentColor="var(--color-primary)"
          >
            <SummaryContent>
              <SummaryIcon bgColor="rgba(0, 113, 227, 0.1)" iconColor="var(--color-primary)">
                ₹
              </SummaryIcon>
              <SummaryInfo>
                <h3>{formatCurrency(summary.totalAmount)}</h3>
                <p>Total Payroll</p>
              </SummaryInfo>
            </SummaryContent>
          </SummaryCard>
          
          <SummaryCard 
            as={motion.div}
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 300 }}
            accentColor="var(--color-success)"
          >
            <SummaryContent>
              <SummaryIcon bgColor="rgba(52, 199, 89, 0.1)" iconColor="var(--color-success)">
                ₹
              </SummaryIcon>
              <SummaryInfo>
                <h3>{formatCurrency(summary.averageSalary)}</h3>
                <p>Average Salary</p>
              </SummaryInfo>
            </SummaryContent>
          </SummaryCard>
          
          <SummaryCard 
            as={motion.div}
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 300 }}
            accentColor="var(--color-warning)"
          >
            <SummaryContent>
              <SummaryIcon bgColor="rgba(255, 149, 0, 0.1)" iconColor="var(--color-warning)">
                ₹
              </SummaryIcon>
              <SummaryInfo>
                <h3>{formatCurrency(summary.highestSalary)}</h3>
                <p>Highest Salary</p>
              </SummaryInfo>
            </SummaryContent>
          </SummaryCard>
        </SummaryCards>
        
        <FiltersContainer>
          <FilterDropdown>
            <FiCalendar />
            <select value={periodFilter} onChange={handlePeriodFilterChange}>
              <option value="current">Current Month</option>
              <option value="previous">Previous Month</option>
              <option value="last3months">Last 3 Months</option>
            </select>
          </FilterDropdown>
        </FiltersContainer>
        
        <Card>
          <TableActions>
            <Button variant="secondary" size="small">
              <FiDownload /> Export CSV
            </Button>
            <Button variant="secondary" size="small">
              <FiDownload /> Export PDF
            </Button>
          </TableActions>
          
          <Table 
            columns={columns} 
            data={payrollRecords} 
            emptyMessage="No payroll records found"
          />
          
          {totalPages > 1 && (
            <Pagination>
              <Button 
                variant="secondary" 
                size="small" 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Previous
              </Button>
              <span>Page {currentPage} of {totalPages}</span>
              <Button 
                variant="secondary" 
                size="small" 
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </Button>
            </Pagination>
          )}
        </Card>
      </motion.div>
    </PageContainer>
  );
};

export default Payroll;
