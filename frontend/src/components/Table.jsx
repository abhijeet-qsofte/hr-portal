import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  background: var(--color-background);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9375rem;
`;

const TableHead = styled.thead`
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  
  th {
    padding: var(--spacing-md);
    text-align: left;
    font-weight: 600;
    color: var(--color-text-secondary);
    white-space: nowrap;
    position: relative;
    
    &:after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background: var(--color-primary);
      transform: scaleX(0);
      transition: transform 0.3s ease;
    }
    
    &:hover:after {
      transform: scaleX(1);
    }
  }
`;

const TableBody = styled.tbody`
  tr {
    border-bottom: 1px solid var(--color-border);
    transition: background-color 0.2s ease;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      background-color: var(--color-surface);
    }
  }
  
  td {
    padding: var(--spacing-md);
    color: var(--color-text);
    vertical-align: middle;
  }
`;

const TableRow = styled(motion.tr)``;

const EmptyState = styled.div`
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--color-text-secondary);
  
  p {
    margin-bottom: var(--spacing-md);
  }
`;

const Table = ({ columns, data, emptyMessage = "No data available" }) => {
  const tableVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <TableContainer>
      <StyledTable>
        <TableHead>
          <tr>
            {columns.map((column) => (
              <th key={column.accessor}>{column.header}</th>
            ))}
          </tr>
        </TableHead>
        
        <TableBody as={motion.tbody} variants={tableVariants} initial="hidden" animate="show">
          {data.length > 0 ? (
            data.map((row, index) => (
              <TableRow key={row.id || index} variants={rowVariants}>
                {columns.map((column) => (
                  <td key={`${row.id || index}-${column.accessor}`}>
                    {column.render ? column.render(row[column.accessor], row) : (row[column.accessor] !== undefined && row[column.accessor] !== null ? row[column.accessor] : '-')}
                  </td>
                ))}
              </TableRow>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState>
                  <p>{emptyMessage}</p>
                </EmptyState>
              </td>
            </tr>
          )}
        </TableBody>
      </StyledTable>
    </TableContainer>
  );
};

export default Table;
