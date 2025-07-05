import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const StyledCard = styled(motion.div)`
  background-color: var(--color-background);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-lg);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => props.accentColor || 'var(--color-primary)'};
    opacity: ${props => props.showAccent ? 1 : 0};
  }
`;

const CardHeader = styled.div`
  margin-bottom: var(--spacing-md);
  
  h3 {
    font-size: 1.25rem;
    margin-bottom: var(--spacing-xs);
    color: var(--color-text);
  }
  
  p {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin: 0;
  }
`;

const CardBody = styled.div`
  flex: 1;
`;

const CardFooter = styled.div`
  margin-top: var(--spacing-md);
  display: flex;
  justify-content: flex-end;
`;

const Card = ({ 
  title, 
  subtitle, 
  children, 
  footer, 
  accentColor, 
  showAccent = true,
  ...props 
}) => {
  return (
    <StyledCard 
      accentColor={accentColor}
      showAccent={showAccent}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300 }}
      {...props}
    >
      {(title || subtitle) && (
        <CardHeader>
          {title && <h3>{title}</h3>}
          {subtitle && <p>{subtitle}</p>}
        </CardHeader>
      )}
      
      <CardBody>{children}</CardBody>
      
      {footer && <CardFooter>{footer}</CardFooter>}
    </StyledCard>
  );
};

// Export subcomponents as properties of Card
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
