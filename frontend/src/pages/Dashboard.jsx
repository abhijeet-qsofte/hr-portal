import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiUsers, FiClock, FiDollarSign, FiCalendar } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

import Card from '../components/Card';
import { employeeApi, attendanceApi, payrollApi } from '../utils/api';

const DashboardContainer = styled.div`
  padding: var(--spacing-md) 0;
`;

const PageHeader = styled.div`
  margin-bottom: var(--spacing-xl);
  
  h1 {
    margin-bottom: var(--spacing-xs);
  }
  
  p {
    color: var(--color-text-secondary);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
`;

const StatCard = styled(Card)`
  padding: var(--spacing-lg);
`;

const StatContent = styled.div`
  display: flex;
  align-items: center;
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background-color: ${props => props.$bgColor || 'rgba(0, 113, 227, 0.1)'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--spacing-lg);
  
  svg {
    font-size: 1.5rem;
    color: ${props => props.$iconColor || 'var(--color-primary)'};
  }
`;

const StatInfo = styled.div`
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

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  margin-bottom: var(--spacing-lg);
`;

const RecentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
`;

const RecentItem = styled.div`
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border);
  
  &:last-child {
    border-bottom: none;
  }
`;

const RecentItemAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--spacing-md);
  font-weight: 600;
  color: var(--color-primary);
`;

const RecentItemInfo = styled.div`
  flex: 1;
  
  h4 {
    font-size: 0.9375rem;
    margin-bottom: 0;
  }
  
  p {
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
    margin: 0;
  }
`;

const RecentItemMeta = styled.div`
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
`;

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    todayAttendance: 0,
    monthlyPayroll: 0
  });
  
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch employee stats
        const employeesResponse = await employeeApi.getAll();
        const activeEmployees = employeesResponse.data.filter(emp => emp.status === 'active');
        
        // Fetch recent employees (newest first)
        const recentEmps = [...employeesResponse.data]
          .sort((a, b) => new Date(b.hire_date) - new Date(a.hire_date))
          .slice(0, 5);
        
        // Fetch attendance data
        const attendanceResponse = await attendanceApi.getDetailed({ 
          limit: 5,
          start_date: format(new Date(), 'yyyy-MM-dd')
        });
        
        // Fetch payroll data for current month
        const payrollResponse = await payrollApi.getAll();
        const monthlyPayrollTotal = payrollResponse.data.reduce((sum, item) => sum + item.amount, 0);
        
        setStats({
          totalEmployees: employeesResponse.data.length,
          activeEmployees: activeEmployees.length,
          todayAttendance: attendanceResponse.data.length,
          monthlyPayroll: monthlyPayrollTotal
        });
        
        setRecentEmployees(recentEmps);
        setRecentAttendance(attendanceResponse.data);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Use mock data if API fails
        setStats({
          totalEmployees: 24,
          activeEmployees: 22,
          todayAttendance: 20,
          monthlyPayroll: 45600
        });
        
        setRecentEmployees([
          { id: 1, first_name: 'John', last_name: 'Doe', position: 'Farm Manager', hire_date: '2024-01-15' },
          { id: 2, first_name: 'Jane', last_name: 'Smith', position: 'HR Specialist', hire_date: '2024-02-03' },
          { id: 3, first_name: 'Michael', last_name: 'Johnson', position: 'Field Worker', hire_date: '2024-03-10' },
          { id: 4, first_name: 'Sarah', last_name: 'Williams', position: 'Accountant', hire_date: '2024-04-22' },
          { id: 5, first_name: 'Robert', last_name: 'Brown', position: 'Equipment Operator', hire_date: '2024-05-18' }
        ]);
        
        // Use the current date for mock data to ensure valid dates
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        setRecentAttendance([
          { id: 1, employee: { first_name: 'John', last_name: 'Doe' }, check_in: `${dateStr}T08:00:00` },
          { id: 2, employee: { first_name: 'Jane', last_name: 'Smith' }, check_in: `${dateStr}T08:15:00` },
          { id: 3, employee: { first_name: 'Michael', last_name: 'Johnson' }, check_in: `${dateStr}T07:55:00` },
          { id: 4, employee: { first_name: 'Sarah', last_name: 'Williams' }, check_in: `${dateStr}T08:05:00` },
          { id: 5, employee: { first_name: 'Robert', last_name: 'Brown' }, check_in: `${dateStr}T08:10:00` }
        ]);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return 'NA';
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  const formatTime = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Invalid time';
      
      return format(date, 'h:mm a');
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid time';
    }
  };
  
  return (
    <DashboardContainer>
      <PageHeader>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Welcome to Asikh Farms HR Portal
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </motion.p>
      </PageHeader>
      
      <StatsGrid>
        <StatCard 
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          accentColor="var(--color-primary)"
        >
          <StatContent>
            <StatIcon $bgColor="rgba(0, 113, 227, 0.1)" $iconColor="var(--color-primary)">
              <FiUsers />
            </StatIcon>
            <StatInfo>
              <h3>{stats.totalEmployees}</h3>
              <p>Total Employees</p>
            </StatInfo>
          </StatContent>
        </StatCard>
        
        <StatCard 
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          accentColor="var(--color-success)"
        >
          <StatContent>
            <StatIcon $bgColor="rgba(52, 199, 89, 0.1)" $iconColor="var(--color-success)">
              <FiClock />
            </StatIcon>
            <StatInfo>
              <h3>{stats.todayAttendance}</h3>
              <p>Today's Attendance</p>
            </StatInfo>
          </StatContent>
        </StatCard>
        
        <StatCard 
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          accentColor="var(--color-warning)"
        >
          <StatContent>
            <StatIcon $bgColor="rgba(255, 149, 0, 0.1)" $iconColor="var(--color-warning)">
              <FiDollarSign />
            </StatIcon>
            <StatInfo>
              <h3>{formatCurrency(stats.monthlyPayroll)}</h3>
              <p>Monthly Payroll</p>
            </StatInfo>
          </StatContent>
        </StatCard>
        
        <StatCard 
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          accentColor="var(--color-secondary)"
        >
          <StatContent>
            <StatIcon $bgColor="rgba(134, 134, 139, 0.1)" $iconColor="var(--color-secondary)">
              <FiCalendar />
            </StatIcon>
            <StatInfo>
              <h3>{stats.activeEmployees}</h3>
              <p>Active Employees</p>
            </StatInfo>
          </StatContent>
        </StatCard>
      </StatsGrid>
      
      <RecentGrid>
        <Card 
          title="Recent Employees" 
          subtitle="Newly added employees"
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          {recentEmployees.map(employee => (
            <RecentItem key={employee.id}>
              <RecentItemAvatar>
                {employee.name ? getInitials(...employee.name.split(' ').slice(0, 2)) : 'NA'}
              </RecentItemAvatar>
              <RecentItemInfo>
                <h4>
                  <Link to={`/employees/${employee.id}`}>
                    {employee.name}
                  </Link>
                </h4>
                <p>{employee.designation}</p>
              </RecentItemInfo>
              <RecentItemMeta>
                {employee.doj ? format(new Date(employee.doj), 'MMM d, yyyy') : 'No date'}
              </RecentItemMeta>
            </RecentItem>
          ))}
        </Card>
        
        <Card 
          title="Today's Attendance" 
          subtitle="Employee check-ins"
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          {recentAttendance.map(record => (
            <RecentItem key={record.id}>
              <RecentItemAvatar>
                {record.employee ? getInitials(record.employee.first_name, record.employee.last_name) : 'NA'}
              </RecentItemAvatar>
              <RecentItemInfo>
                <h4>
                  {record.employee ? `${record.employee.first_name || ''} ${record.employee.last_name || ''}` : 'Unknown Employee'}
                </h4>
                <p>Checked in</p>
              </RecentItemInfo>
              <RecentItemMeta>
                {formatTime(record.check_in)}
              </RecentItemMeta>
            </RecentItem>
          ))}
        </Card>
      </RecentGrid>
    </DashboardContainer>
  );
};

export default Dashboard;
