import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { FiHome, FiUsers, FiCalendar, FiDollarSign, FiMenu, FiX, FiFileText, FiCreditCard, FiUser, FiLogOut, FiSettings, FiUserPlus } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Sidebar = styled.aside`
  width: 250px;
  background: var(--color-background);
  border-right: 1px solid var(--color-border);
  padding: var(--spacing-lg) 0;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 10;
  transition: transform 0.3s ease;
  
  @media (max-width: 768px) {
    transform: ${({ $isOpen }) => $isOpen ? 'translateX(0)' : 'translateX(-100%)'};
    box-shadow: ${({ $isOpen }) => $isOpen ? 'var(--shadow-lg)' : 'none'};
  }
`;

const Logo = styled.div`
  padding: 0 var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  
  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-primary);
    letter-spacing: -0.025em;
  }
  
  span {
    display: block;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    font-weight: 400;
  }
`;

const NavMenu = styled.nav`
  flex: 1;
  
  ul {
    list-style: none;
  }
`;

const NavItem = styled.li`
  margin-bottom: var(--spacing-xs);
`;

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  color: var(--color-text);
  font-weight: 500;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  
  svg {
    margin-right: var(--spacing-md);
    font-size: 1.25rem;
  }
  
  &:hover {
    background-color: var(--color-surface);
    color: var(--color-primary);
  }
  
  &.active {
    color: var(--color-primary);
    background-color: var(--color-surface);
    border-left: 3px solid var(--color-primary);
  }
`;

const MainContent = styled.main`
  flex: 1;
  padding: var(--spacing-lg);
  margin-left: 250px;
  
  @media (max-width: 768px) {
    margin-left: 0;
    padding-top: 70px;
  }
`;

const UserSection = styled.div`
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--color-border);
  margin-top: auto;
`;

const UserMenu = styled.div`
  position: relative;
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--spacing-sm);
  background: transparent;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: var(--color-surface);
  }
  
  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: var(--color-primary);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: var(--spacing-sm);
    font-weight: 600;
  }
  
  .user-info {
    flex: 1;
    text-align: left;
    
    .name {
      font-weight: 500;
      color: var(--color-text);
      font-size: 0.875rem;
    }
    
    .role {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
    }
  }
`;

const UserMenuDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  width: 200px;
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  margin-top: var(--spacing-xs);
  overflow: hidden;
  z-index: 100;
  transform-origin: top right;
  opacity: ${({ $isOpen }) => ($isOpen ? '1' : '0')};
  transform: ${({ $isOpen }) => ($isOpen ? 'scale(1)' : 'scale(0.95)')};
  pointer-events: ${({ $isOpen }) => ($isOpen ? 'all' : 'none')};
  transition: transform 0.2s ease, opacity 0.2s ease;
`;

const UserMenuItem = styled.div`
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--color-text);
  transition: background-color 0.2s ease;
  cursor: pointer;
  text-decoration: none;
  
  svg {
    margin-right: var(--spacing-sm);
    font-size: 1rem;
  }
  
  &:hover {
    background-color: var(--color-surface);
  }
  
  &.logout {
    color: var(--color-error);
  }
`;

const UserMenuDivider = styled.div`
  height: 1px;
  background-color: var(--color-border);
  margin: var(--spacing-xs) 0;
`;

const UserDropdown = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  margin-bottom: var(--spacing-xs);
  overflow: hidden;
  z-index: 100;
  
  .dropdown-item {
    display: flex;
    align-items: center;
    padding: var(--spacing-sm) var(--spacing-md);
    color: var(--color-text);
    transition: background-color 0.2s ease;
    cursor: pointer;
    
    svg {
      margin-right: var(--spacing-sm);
      font-size: 1rem;
    }
    
    &:hover {
      background-color: var(--color-surface);
    }
    
    &.logout {
      color: var(--color-error);
    }
  }
`;

const MobileHeader = styled.header`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md) var(--spacing-lg);
    background-color: var(--color-background);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 5;
    box-shadow: var(--shadow-sm);
  }
  
  h1 {
    font-size: 1.25rem;
    margin: 0;
  }
  
  button {
    background: transparent;
    border: none;
    color: var(--color-text);
    font-size: 1.5rem;
    padding: var(--spacing-xs);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const Overlay = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: ${({ $isOpen }) => $isOpen ? 'block' : 'none'};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 5;
  }
`;

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasRole } = useAuth();
  const userMenuRef = useRef(null);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };
  
  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };
  
  const closeUserMenu = () => {
    setIsUserMenuOpen(false);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.full_name) return 'U';
    
    const names = user.full_name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    
    return names[0][0].toUpperCase();
  };
  
  // Get user's primary role for display
  const getUserRole = () => {
    if (!user || !user.roles || user.roles.length === 0) return 'User';
    
    const roleMap = {
      'admin': 'Administrator',
      'hr': 'HR Staff',
      'manager': 'Manager',
      'employee': 'Employee'
    };
    
    // Return the highest privilege role
    if (user.roles.includes('admin')) return roleMap.admin;
    if (user.roles.includes('hr')) return roleMap.hr;
    if (user.roles.includes('manager')) return roleMap.manager;
    if (user.roles.includes('employee')) return roleMap.employee;
    
    return 'User';
  };
  
  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.includes('/employees')) return 'Employees';
    if (path.includes('/attendance')) return 'Attendance';
    if (path.includes('/payroll')) return 'Payroll';
    if (path.includes('/salary-structures')) return 'Salary Structures';
    if (path.includes('/payslips')) return 'Payslips';
    return 'Asikh Farms HR Portal';
  };
  
  return (
    <LayoutContainer>
      <MobileHeader>
        <h1>{getPageTitle()}</h1>
        <button onClick={toggleSidebar}>
          <FiMenu />
        </button>
      </MobileHeader>
      
      <Overlay $isOpen={isSidebarOpen} onClick={closeSidebar} />
      
      <Sidebar $isOpen={isSidebarOpen}>
        <Logo>
          <h1>Asikh Farms</h1>
          <span>HR Portal</span>
        </Logo>
        
        <NavMenu>
          <ul>
            <NavItem>
              <StyledNavLink to="/" onClick={closeSidebar}>
                <FiHome /> Dashboard
              </StyledNavLink>
            </NavItem>
            
            {/* Show Employees link only to admin and HR */}
            {hasRole(['admin', 'hr']) && (
              <NavItem>
                <StyledNavLink to="/employees" onClick={closeSidebar}>
                  <FiUsers /> Employees
                </StyledNavLink>
              </NavItem>
            )}
            
            {/* Show Attendance link to admin, HR, and managers */}
            {hasRole(['admin', 'hr', 'manager']) && (
              <NavItem>
                <StyledNavLink to="/attendance" onClick={closeSidebar}>
                  <FiCalendar /> Attendance
                </StyledNavLink>
              </NavItem>
            )}
            
            {/* Employee Attendance visible to all */}
            <NavItem>
              <StyledNavLink to="/employee-attendance" onClick={closeSidebar}>
                <FiCalendar /> My Attendance
              </StyledNavLink>
            </NavItem>
            
            {/* Show Payroll link only to admin and HR */}
            {hasRole(['admin', 'hr']) && (
              <NavItem>
                <StyledNavLink to="/payroll" onClick={closeSidebar}>
                  <span style={{ fontSize: '1.25rem', marginRight: 'var(--spacing-md)', display: 'inline-flex', width: '1.25rem', justifyContent: 'center' }}>₹</span> Payroll
                </StyledNavLink>
              </NavItem>
            )}
            
            {/* Show Salary Structures link only to admin and HR */}
            {hasRole(['admin', 'hr']) && (
              <NavItem>
                <StyledNavLink to="/salary-structures" onClick={closeSidebar}>
                  <FiFileText /> Salary Structures
                </StyledNavLink>
              </NavItem>
            )}
            
            {/* Show Payslips link only to admin and HR */}
            {hasRole(['admin', 'hr']) && (
              <NavItem>
                <StyledNavLink to="/payslips" onClick={closeSidebar}>
                  <FiCreditCard /> Payslips
                </StyledNavLink>
              </NavItem>
            )}
            
            {/* Show User Management link only to admin */}
            {hasRole(['admin']) && (
              <NavItem>
                <StyledNavLink to="/users" onClick={closeSidebar}>
                  <FiUserPlus /> User Management
                </StyledNavLink>
              </NavItem>
            )}
          </ul>
        </NavMenu>
        
        {/* User section with dropdown menu */}
        <UserSection>
          <UserMenu ref={userMenuRef}>
            <UserButton onClick={toggleUserMenu}>
              <div className="user-avatar">{getUserInitials()}</div>
              <div className="user-info">
                <div className="name">{user?.full_name || 'User'}</div>
                <div className="role">{getUserRole()}</div>
              </div>
            </UserButton>
            <UserMenuDropdown $isOpen={isUserMenuOpen}>
              <UserMenuItem as={NavLink} to="/profile" onClick={closeUserMenu}>
                <FiUser size={16} />
                <span>Profile</span>
              </UserMenuItem>
              <UserMenuDivider />
              <UserMenuItem onClick={handleLogout}>
                <FiLogOut size={16} />
                <span>Logout</span>
              </UserMenuItem>
            </UserMenuDropdown>
          </UserMenu>
        </UserSection>
      </Sidebar>
      
      <MainContent>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </MainContent>
    </LayoutContainer>
  );
};

export default Layout;
