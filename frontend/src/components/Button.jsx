import React from 'react';
import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';

const StyledButton = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.size === 'small' ? 'var(--spacing-xs) var(--spacing-md)' : 
    props.size === 'large' ? 'var(--spacing-md) var(--spacing-xl)' : 
    'var(--spacing-sm) var(--spacing-lg)'};
  border-radius: var(--radius-full);
  font-weight: 500;
  font-size: ${props => props.size === 'small' ? '0.875rem' : 
    props.size === 'large' ? '1.125rem' : '1rem'};
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  outline: none;
  
  ${props => props.variant === 'primary' && css`
    background-color: var(--color-primary);
    color: white;
    
    &:hover {
      background-color: var(--color-primary-light);
    }
  `}
  
  ${props => props.variant === 'secondary' && css`
    background-color: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    
    &:hover {
      background-color: var(--color-background);
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
  `}
  
  ${props => props.variant === 'text' && css`
    background-color: transparent;
    color: var(--color-primary);
    padding-left: var(--spacing-sm);
    padding-right: var(--spacing-sm);
    
    &:hover {
      background-color: rgba(0, 113, 227, 0.05);
    }
  `}
  
  ${props => props.fullWidth && css`
    width: 100%;
  `}
  
  ${props => props.disabled && css`
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  `}
  
  svg {
    margin-right: ${props => props.iconOnly ? '0' : 'var(--spacing-sm)'};
    font-size: ${props => props.size === 'small' ? '1rem' : 
      props.size === 'large' ? '1.5rem' : '1.25rem'};
  }
`;

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  fullWidth = false,
  disabled = false,
  iconOnly = false,
  ...props 
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      iconOnly={iconOnly}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

export default Button;
