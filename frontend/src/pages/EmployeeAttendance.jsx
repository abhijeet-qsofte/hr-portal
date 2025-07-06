import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiClock, FiCalendar, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { format } from 'date-fns';

import Card from '../components/Card';
import Button from '../components/Button';
import { attendanceApi } from '../utils/api';

const PageContainer = styled.div`
  padding: var(--spacing-md) 0;
  max-width: 600px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: var(--spacing-xl);
  text-align: center;
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

const AttendanceCard = styled(Card)`
  padding: var(--spacing-lg);
`;

const CurrentTime = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin: var(--spacing-lg) 0;
  color: var(--color-primary);
`;

const CurrentDate = styled.div`
  font-size: 1.2rem;
  text-align: center;
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    margin-right: var(--spacing-xs);
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
`;

const StatusMessage = styled.div`
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    margin-right: var(--spacing-xs);
  }
  
  &.success {
    background-color: var(--color-success-light);
    color: var(--color-success);
  }
  
  &.error {
    background-color: var(--color-error-light);
    color: var(--color-error);
  }
`;

const AttendanceInfo = styled.div`
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .label {
    font-weight: 500;
    color: var(--color-text-secondary);
  }
  
  .value {
    font-weight: 600;
  }
`;

const EmployeeAttendance = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [status, setStatus] = useState(null); // 'checked-in', 'checked-out', null
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  
  // Mock employee ID - In a real app, this would come from authentication
  const employeeId = 1;
  
  useEffect(() => {
    // Update clock every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Check if employee already has attendance record for today
    checkTodayAttendance();
    
    return () => clearInterval(timer);
  }, []);
  
  const checkTodayAttendance = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await attendanceApi.getByEmployee(employeeId, {
        start_date: today,
        end_date: today
      });
      
      if (response.data && response.data.length > 0) {
        setTodayAttendance(response.data[0]);
        
        if (response.data[0].end_time) {
          setStatus('checked-out');
        } else {
          setStatus('checked-in');
        }
      }
    } catch (error) {
      console.error('Error checking today\'s attendance:', error);
    }
  };
  
  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const response = await attendanceApi.create({
        employee_id: employeeId,
        date: format(now, 'yyyy-MM-dd'),
        start_time: format(now, 'HH:mm:ss'),
      });
      
      setTodayAttendance(response.data);
      setStatus('checked-in');
      setMessage({ type: 'success', text: 'Successfully checked in!' });
    } catch (error) {
      console.error('Error checking in:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to check in. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCheckOut = async () => {
    setLoading(true);
    try {
      if (!todayAttendance) {
        throw new Error('No check-in record found');
      }
      
      const now = new Date();
      const response = await attendanceApi.update(todayAttendance.id, {
        end_time: format(now, 'HH:mm:ss'),
      });
      
      setTodayAttendance(response.data);
      setStatus('checked-out');
      setMessage({ type: 'success', text: 'Successfully checked out!' });
    } catch (error) {
      console.error('Error checking out:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to check out. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };
  
  const formatTime = (date) => {
    return format(date, 'h:mm:ss a');
  };
  
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Employee Attendance
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Record your daily attendance
          </motion.p>
        </PageTitle>
      </PageHeader>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <AttendanceCard>
          <CurrentDate>
            <FiCalendar /> {format(currentTime, 'EEEE, MMMM d, yyyy')}
          </CurrentDate>
          
          <CurrentTime>
            {formatTime(currentTime)}
          </CurrentTime>
          
          {todayAttendance && (
            <AttendanceInfo>
              <InfoRow>
                <span className="label">Check-in Time:</span>
                <span className="value">
                  {todayAttendance.start_time ? format(new Date(`2025-01-01T${todayAttendance.start_time}`), 'h:mm:ss a') : 'N/A'}
                </span>
              </InfoRow>
              
              {todayAttendance.end_time && (
                <>
                  <InfoRow>
                    <span className="label">Check-out Time:</span>
                    <span className="value">
                      {format(new Date(`2025-01-01T${todayAttendance.end_time}`), 'h:mm:ss a')}
                    </span>
                  </InfoRow>
                  
                  <InfoRow>
                    <span className="label">Total Hours:</span>
                    <span className="value">
                      {todayAttendance.total_hours ? `${todayAttendance.total_hours} hours` : 'Calculating...'}
                    </span>
                  </InfoRow>
                </>
              )}
            </AttendanceInfo>
          )}
          
          {message && (
            <StatusMessage className={message.type}>
              {message.type === 'success' ? <FiCheck /> : <FiAlertCircle />}
              {message.text}
            </StatusMessage>
          )}
          
          <ButtonContainer>
            {status === null && (
              <Button 
                onClick={handleCheckIn} 
                disabled={loading}
                fullWidth
              >
                <FiClock /> Check In
              </Button>
            )}
            
            {status === 'checked-in' && (
              <Button 
                onClick={handleCheckOut} 
                disabled={loading}
                fullWidth
              >
                <FiClock /> Check Out
              </Button>
            )}
            
            {status === 'checked-out' && (
              <Button 
                disabled
                fullWidth
              >
                <FiCheck /> Attendance Recorded
              </Button>
            )}
          </ButtonContainer>
        </AttendanceCard>
      </motion.div>
    </PageContainer>
  );
};

export default EmployeeAttendance;
