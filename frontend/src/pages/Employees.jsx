import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiPlus, FiSearch, FiFilter, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

import { employeeApi } from '../utils/api';
import Table from '../components/Table';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import EditEmployeeForm from '../components/EditEmployeeForm';
import AddEmployeeForm from '../components/AddEmployeeForm';

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

const SearchFilterContainer = styled.div`
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const SearchInput = styled.div`
  position: relative;
  flex: 1;
  
  input {
    padding-left: 40px;
  }
  
  svg {
    position: absolute;
    left: var(--spacing-md);
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-secondary);
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

const ActionButtons = styled.div`
  display: flex;
  gap: var(--spacing-xs);
`;

// Badge component is imported from components

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

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const pageSize = 10;
  
  useEffect(() => {
    fetchEmployees();
  }, [currentPage, statusFilter]);
  
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = {
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
        status: statusFilter || undefined
      };
      
      const response = await employeeApi.getDetailed(params);
      setEmployees(response.data);
      setTotalEmployees(parseInt(response.headers['x-total-count'] || 0));
    } catch (error) {
      console.error('Error fetching employees:', error);
      // Use mock data if API fails
      const mockEmployees = [
        { id: 1, name: 'John Doe', email: 'john.doe@example.com', phone: '555-123-4567', designation: 'Farm Manager', location: 'Management', status: 'active', doj: '2024-01-15' },
        { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', phone: '555-987-6543', designation: 'HR Specialist', location: 'Human Resources', status: 'active', doj: '2024-02-03' },
        { id: 3, name: 'Michael Johnson', email: 'michael.j@example.com', phone: '555-456-7890', designation: 'Field Worker', location: 'Operations', status: 'active', doj: '2024-03-10' },
        { id: 4, name: 'Sarah Williams', email: 'sarah.w@example.com', phone: '555-789-0123', designation: 'Accountant', location: 'Finance', status: 'inactive', doj: '2024-04-22' },
        { id: 5, name: 'Robert Brown', email: 'robert.b@example.com', phone: '555-234-5678', designation: 'Equipment Operator', location: 'Operations', status: 'inactive', doj: '2024-05-18' }
      ];
      setEmployees(mockEmployees);
      setTotalEmployees(mockEmployees.length);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };
  
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };
  
  const handleEditClick = (employee) => {
    setCurrentEmployee(employee);
    setIsEditModalOpen(true);
  };
  
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentEmployee(null);
  };
  
  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };
  
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };
  
  const handleEmployeeUpdate = async () => {
    await fetchEmployees();
  };
  
  const handleEmployeeAdd = async () => {
    await fetchEmployees();
  };
  
  const filteredEmployees = employees.filter(employee => {
    const name = employee.name?.toLowerCase() || '';
    const email = employee.email?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    return name.includes(searchLower) || email.includes(searchLower);
  });
  
  const totalPages = Math.ceil(totalEmployees / pageSize);
  
  const columns = [
    { 
      accessor: 'name', 
      header: 'Name',
      render: (value, row) => (
        <Link to={`/employees/${row.id}`}>
          {value}
        </Link>
      )
    },
    { 
      accessor: 'designation', 
      header: 'Position'
    },
    { 
      accessor: 'location', 
      header: 'Location'
    },
    { 
      accessor: 'email', 
      header: 'Email'
    },
    { 
      accessor: 'phone', 
      header: 'Phone'
    },
    { 
      accessor: 'status', 
      header: 'Status',
      render: (value, row) => {
        const formattedStatus = value?.replace('_', ' ');
        return (
          <Badge variant={value}>{formattedStatus}</Badge>
        );
      }
    },
    { 
      accessor: 'doj', 
      header: 'Hire Date',
      render: (value) => value ? format(new Date(value), 'MMM d, yyyy') : 'No date'
    },
    { 
      accessor: 'id', 
      header: 'Actions',
      render: (value, row) => (
        <ActionButtons>
          <Button 
            variant="text" 
            size="small" 
            title="Edit"
            onClick={() => handleEditClick(row)}
          >
            <FiEdit2 />
          </Button>
          <Button 
            variant="text" 
            size="small" 
            title="Delete"
            onClick={() => console.log('Delete employee', row.id)}
          >
            <FiTrash2 />
          </Button>
        </ActionButtons>
      )
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
            Employees
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Manage your workforce
          </motion.p>
        </PageTitle>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Button onClick={handleOpenAddModal}>
            <FiPlus /> Add Employee
          </Button>
        </motion.div>
      </PageHeader>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <SearchFilterContainer>
          <SearchInput>
            <FiSearch />
            <input 
              type="text" 
              placeholder="Search employees..." 
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </SearchInput>
          
          <FilterDropdown>
            <FiFilter />
            <select value={statusFilter} onChange={handleStatusFilterChange}>
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>
          </FilterDropdown>
        </SearchFilterContainer>
        
        <Card>
          <Table 
            columns={columns} 
            data={filteredEmployees} 
            emptyMessage="No employees found"
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

      {/* Edit Employee Modal */}
      <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal}>
        {currentEmployee && (
          <EditEmployeeForm
            employee={currentEmployee}
            onClose={handleCloseEditModal}
            onUpdate={handleEmployeeUpdate}
          />
        )}
      </Modal>

      {/* Add Employee Modal */}
      <Modal isOpen={isAddModalOpen} onClose={handleCloseAddModal}>
        <AddEmployeeForm
          onClose={handleCloseAddModal}
          onAdd={handleEmployeeAdd}
        />
      </Modal>
    </PageContainer>
  );
};

export default Employees;
