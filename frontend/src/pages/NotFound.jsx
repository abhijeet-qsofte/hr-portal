import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

import Button from '../components/Button';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 60vh;
  padding: var(--spacing-xl);
`;

const ErrorCode = styled(motion.h1)`
  font-size: 8rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
`;

const Title = styled(motion.h2)`
  font-size: 2rem;
  margin-bottom: var(--spacing-lg);
`;

const Description = styled(motion.p)`
  color: var(--color-text-secondary);
  max-width: 500px;
  margin-bottom: var(--spacing-xl);
`;

const NotFound = () => {
  return (
    <Container>
      <ErrorCode
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        404
      </ErrorCode>
      
      <Title
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Page Not Found
      </Title>
      
      <Description
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        The page you are looking for might have been removed, had its name changed, 
        or is temporarily unavailable.
      </Description>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Button as={Link} to="/">
          <FiArrowLeft /> Back to Dashboard
        </Button>
      </motion.div>
    </Container>
  );
};

export default NotFound;
