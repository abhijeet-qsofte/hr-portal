import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

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

function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="employees" element={<Employees />} />
          <Route path="employees/:id" element={<EmployeeDetail />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="employee-attendance" element={<EmployeeAttendance />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="salary-structures" element={<SalaryStructures />} />
          <Route path="payslips" element={<Payslips />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default App;
