import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { FiHome, FiUsers, FiCalendar, FiDollarSign, FiMenu, FiX, FiFileText, FiCreditCard } from 'react-icons/fi';

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
  const location = useLocation();
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const closeSidebar = () => {
    setIsSidebarOpen(false);
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
            <NavItem>
              <StyledNavLink to="/employees" onClick={closeSidebar}>
                <FiUsers /> Employees
              </StyledNavLink>
            </NavItem>
            <NavItem>
              <StyledNavLink to="/attendance" onClick={closeSidebar}>
                <FiCalendar /> Attendance
              </StyledNavLink>
            </NavItem>
            <NavItem>
              <StyledNavLink to="/payroll" onClick={closeSidebar}>
                <FiDollarSign /> Payroll
              </StyledNavLink>
            </NavItem>
            <NavItem>
              <StyledNavLink to="/salary-structures" onClick={closeSidebar}>
                <FiFileText /> Salary Structures
              </StyledNavLink>
            </NavItem>
            <NavItem>
              <StyledNavLink to="/payslips" onClick={closeSidebar}>
                <FiCreditCard /> Payslips
              </StyledNavLink>
            </NavItem>
          </ul>
        </NavMenu>
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
