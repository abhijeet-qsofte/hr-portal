import React from 'react';
import styled from 'styled-components';

const BadgeContainer = styled.span`
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
  
  ${props => {
    if (props.variant === 'success' || props.variant === 'active') {
      return `
        background-color: rgba(52, 199, 89, 0.1);
        color: var(--color-success);
      `;
    } else if (props.variant === 'error' || props.variant === 'inactive' || props.variant === 'terminated') {
      return `
        background-color: rgba(255, 59, 48, 0.1);
        color: var(--color-error);
      `;
    } else if (props.variant === 'warning' || props.variant === 'on_leave') {
      return `
        background-color: rgba(255, 149, 0, 0.1);
        color: var(--color-warning);
      `;
    } else {
      return `
        background-color: rgba(134, 134, 139, 0.1);
        color: var(--color-secondary);
      `;
    }
  }}
`;

const Badge = ({ children, variant }) => {
  return (
    <BadgeContainer variant={variant}>
      {children}
    </BadgeContainer>
  );
};

// Default props
Badge.defaultProps = {
  variant: 'default'
};

export default Badge;
