import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Auth Provider
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layout components
import Layout from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmployeeDetail from './pages/EmployeeDetail';
import Attendance from './pages/Attendance';
import EmployeeAttendance from './pages/EmployeeAttendance';
import Payroll from './pages/Payroll';
import SalaryStructures from './pages/SalaryStructures';
import Payslips from './pages/Payslips';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import UserManagement from './pages/UserManagement';
import UserProfile from './pages/UserProfile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <AuthProvider>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            
            {/* HR and Admin only routes */}
            <Route path="employees" element={
              <ProtectedRoute roles={['admin', 'hr']}>
                <Employees />
              </ProtectedRoute>
            } />
            <Route path="employees/:id" element={
              <ProtectedRoute roles={['admin', 'hr']}>
                <EmployeeDetail />
              </ProtectedRoute>
            } />
            
            {/* HR, Admin, and Manager routes */}
            <Route path="attendance" element={
              <ProtectedRoute roles={['admin', 'hr', 'manager']}>
                <Attendance />
              </ProtectedRoute>
            } />
            
            {/* Employee attendance can be accessed by all authenticated users */}
            <Route path="employee-attendance" element={<EmployeeAttendance />} />
            
            {/* HR and Admin only routes */}
            <Route path="payroll" element={
              <ProtectedRoute roles={['admin', 'hr']}>
                <Payroll />
              </ProtectedRoute>
            } />
            <Route path="salary-structures" element={
              <ProtectedRoute roles={['admin', 'hr']}>
                <SalaryStructures />
              </ProtectedRoute>
            } />
            <Route path="payslips" element={
              <ProtectedRoute roles={['admin', 'hr']}>
                <Payslips />
              </ProtectedRoute>
            } />
            
            {/* Admin only route */}
            <Route path="users" element={
              <ProtectedRoute roles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            } />
            
            {/* User profile route - accessible to all authenticated users */}
            <Route path="profile" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </AuthProvider>
  );
}

export default App;
