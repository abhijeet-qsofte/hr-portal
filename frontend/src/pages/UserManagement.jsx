import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiUserPlus, FiEdit2, FiTrash2, FiUserCheck } from 'react-icons/fi';
import { authApi } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

// Styled components
const PageContainer = styled.div`
  padding: var(--spacing-md);
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  
  h1 {
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: var(--color-primary-dark);
  }
  
  &:disabled {
    background-color: var(--color-disabled);
    cursor: not-allowed;
  }
`;

const Card = styled(motion.div)`
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: var(--spacing-md);
    text-align: left;
    border-bottom: 1px solid var(--color-border);
  }
  
  th {
    font-weight: 600;
    color: var(--color-text-secondary);
    background-color: var(--color-background-light);
  }
  
  tr:last-child td {
    border-bottom: none;
  }
  
  tr:hover td {
    background-color: var(--color-background-hover);
  }
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background-color: ${props => props.$color ? `var(--color-${props.$color})` : 'var(--color-surface)'};
  color: ${props => props.$color ? 'white' : 'var(--color-text)'};
  margin-right: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
  }
`;

const Badge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${props => {
    switch(props.$role) {
      case 'admin': return 'var(--color-primary-light)';
      case 'hr': return 'var(--color-success-light)';
      case 'manager': return 'var(--color-warning-light)';
      default: return 'var(--color-background-light)';
    }
  }};
  color: ${props => {
    switch(props.$role) {
      case 'admin': return 'var(--color-primary-dark)';
      case 'hr': return 'var(--color-success-dark)';
      case 'manager': return 'var(--color-warning-dark)';
      default: return 'var(--color-text-secondary)';
    }
  }};
  margin-right: 4px;
  margin-bottom: 4px;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  width: 100%;
  max-width: 500px;
  box-shadow: var(--shadow-lg);
  
  h2 {
    margin-top: 0;
    margin-bottom: var(--spacing-lg);
    font-size: 1.5rem;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  label {
    font-weight: 500;
    color: var(--color-text);
  }
  
  input, select {
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
`;

const CancelButton = styled(Button)`
  background-color: var(--color-background);
  color: var(--color-text);
  
  &:hover {
    background-color: var(--color-background-dark);
  }
`;

const RoleCheckboxes = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
`;

const RoleCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--border-radius);
  background-color: ${props => props.$checked ? 'var(--color-primary-light)' : 'var(--color-background-light)'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.$checked ? 'var(--color-primary-light)' : 'var(--color-background)'};
  }
  
  input {
    margin: 0;
  }
`;

const ErrorMessage = styled.div`
  color: var(--color-error);
  font-size: 0.875rem;
  margin-top: var(--spacing-xs);
`;

const UserManagement = () => {
  const { hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit' or 'role'
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    roles: []
  });
  
  // Available roles
  const availableRoles = [
    { id: 'admin', name: 'Administrator' },
    { id: 'hr', name: 'HR Staff' },
    { id: 'manager', name: 'Manager' },
    { id: 'employee', name: 'Employee' }
  ];
  
  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authApi.getAllUsers();
      setUsers(response.data);
    } catch (err) {
      setError('Failed to load users. Please try again later.');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle role checkbox change
  const handleRoleChange = (roleId) => {
    setFormData(prev => {
      const roles = [...prev.roles];
      
      if (roles.includes(roleId)) {
        // Remove role if already selected
        return {
          ...prev,
          roles: roles.filter(r => r !== roleId)
        };
      } else {
        // Add role if not selected
        return {
          ...prev,
          roles: [...roles, roleId]
        };
      }
    });
  };
  
  // Open modal for creating a new user
  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      email: '',
      password: '',
      full_name: '',
      roles: ['employee'] // Default role
    });
    setShowModal(true);
  };
  
  // Open modal for editing a user
  const openEditModal = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name,
      password: '', // Don't populate password for security
      roles: user.roles || []
    });
    setShowModal(true);
  };
  
  // Open modal for managing roles
  const openRoleModal = (user) => {
    setModalMode('role');
    setSelectedUser(user);
    setFormData({
      ...formData,
      roles: user.roles || []
    });
    setShowModal(true);
  };
  
  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setError(null);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (modalMode === 'create') {
        // Create new user
        await authApi.register(formData);
      } else if (modalMode === 'edit') {
        // Update existing user
        await authApi.updateCurrentUser({
          ...formData,
          id: selectedUser.id
        });
      } else if (modalMode === 'role') {
        // Update user roles
        // This is a simplified approach - in a real app, you might need to handle
        // adding/removing roles individually via the API
        for (const role of formData.roles) {
          if (!selectedUser.roles.includes(role)) {
            await authApi.assignRole(selectedUser.id, role);
          }
        }
      }
      
      // Refresh user list
      await fetchUsers();
      
      // Close modal
      closeModal();
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
      console.error('Error submitting form:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <PageContainer>
      <PageHeader>
        <h1>User Management</h1>
        <Button onClick={openCreateModal}>
          <FiUserPlus /> Add User
        </Button>
      </PageHeader>
      
      <Card
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {loading && !users.length ? (
          <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
            Loading users...
          </div>
        ) : error && !users.length ? (
          <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center', color: 'var(--color-error)' }}>
            {error}
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.full_name}</td>
                  <td>{user.email}</td>
                  <td>
                    {user.roles && user.roles.map(role => (
                      <Badge key={role} $role={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Badge>
                    ))}
                    {(!user.roles || user.roles.length === 0) && (
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                        No roles assigned
                      </span>
                    )}
                  </td>
                  <td>
                    <Badge $role={user.is_active ? 'hr' : ''}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td>
                    <ActionButton onClick={() => openEditModal(user)} title="Edit user">
                      <FiEdit2 size={16} />
                    </ActionButton>
                    <ActionButton 
                      $color="primary" 
                      onClick={() => openRoleModal(user)} 
                      title="Manage roles"
                    >
                      <FiUserCheck size={16} />
                    </ActionButton>
                  </td>
                </tr>
              ))}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                    No users found. Add a new user to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </Card>
      
      {/* User Modal */}
      {showModal && (
        <Modal>
          <ModalContent>
            <h2>
              {modalMode === 'create' ? 'Add New User' : 
               modalMode === 'edit' ? 'Edit User' : 'Manage User Roles'}
            </h2>
            
            <Form onSubmit={handleSubmit}>
              {(modalMode === 'create' || modalMode === 'edit') && (
                <>
                  <FormGroup>
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <label htmlFor="full_name">Full Name</label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      required
                    />
                  </FormGroup>
                  
                  {modalMode === 'create' && (
                    <FormGroup>
                      <label htmlFor="password">Password</label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required={modalMode === 'create'}
                      />
                    </FormGroup>
                  )}
                </>
              )}
              
              <FormGroup>
                <label>User Roles</label>
                <RoleCheckboxes>
                  {availableRoles.map(role => (
                    <RoleCheckbox 
                      key={role.id} 
                      $checked={formData.roles.includes(role.id)}
                    >
                      <input
                        type="checkbox"
                        id={`role-${role.id}`}
                        checked={formData.roles.includes(role.id)}
                        onChange={() => handleRoleChange(role.id)}
                      />
                      {role.name}
                    </RoleCheckbox>
                  ))}
                </RoleCheckboxes>
              </FormGroup>
              
              {error && <ErrorMessage>{error}</ErrorMessage>}
              
              <ModalActions>
                <CancelButton type="button" onClick={closeModal}>
                  Cancel
                </CancelButton>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Processing...' : 'Save'}
                </Button>
              </ModalActions>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </PageContainer>
  );
};

export default UserManagement;
