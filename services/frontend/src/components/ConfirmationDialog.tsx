import React from 'react';
import styled, { keyframes } from 'styled-components';

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const ConfirmationOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin-bottom: 1rem;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1300;
`;

const ConfirmationDialogBox = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
  margin: 1rem;
`;

const ConfirmationTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #f44336;
  font-size: 1.25rem;
`;

const ConfirmationMessage = styled.p`
  margin: 0 0 1.5rem 0;
  color: #666;
  line-height: 1.5;
`;

const ConfirmationActions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: ${rotate} 1s linear infinite;
  margin-right: 0.5rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary', isLoading?: boolean }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  background-color: ${props => props.variant === 'secondary' ? '#9e9e9e' : '#2196F3'};
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  transition: all 0.3s ease;
  gap: 0.5rem;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const DangerButton = styled(Button)`
  background-color: #f44336;
  
  &:hover {
    background-color: #d32f2f;
  }
`;

const ButtonContent = styled.span`
  display: inline-flex;
  align-items: center;
`;

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'primary';
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  onConfirm,
  onCancel,
  variant = 'primary'
}) => {
  if (!isOpen) return null;

  const ConfirmButton = variant === 'danger' ? DangerButton : Button;

  return (
    <ConfirmationOverlay onClick={onCancel}>
      <ConfirmationDialogBox onClick={(e) => e.stopPropagation()}>
        <ConfirmationTitle>{title}</ConfirmationTitle>
        <ConfirmationMessage>{message}</ConfirmationMessage>
        <ConfirmationActions>
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <ConfirmButton
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <LoadingSpinner />}
            <ButtonContent>{confirmText}</ButtonContent>
          </ConfirmButton>
        </ConfirmationActions>
      </ConfirmationDialogBox>
    </ConfirmationOverlay>
  );
};

export default ConfirmationDialog; 