import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 20px;
  text-align: center;
`;

const ErrorCard = styled(motion.div)`
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  padding: 40px;
  width: 100%;
  max-width: 500px;
`;

const ErrorIcon = styled.div`
  font-size: 64px;
  color: #e74c3c;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 28px;
  color: #333;
  margin-bottom: 10px;
`;

const Message = styled.p`
  color: #666;
  margin-bottom: 30px;
  line-height: 1.6;
`;

const Button = styled(Link)`
  display: inline-block;
  background: #4a90e2;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 16px;
  transition: background 0.3s ease;
  
  &:hover {
    background: #3a80d2;
  }
`;

const Unauthorized = () => {
  return (
    <Container>
      <ErrorCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ErrorIcon>🔒</ErrorIcon>
        <Title>Access Denied</Title>
        <Message>
          You don't have permission to access this page. 
          If you believe this is an error, please contact your administrator.
        </Message>
        <Button to="/">Return to Dashboard</Button>
      </ErrorCard>
    </Container>
  );
};

export default Unauthorized;
