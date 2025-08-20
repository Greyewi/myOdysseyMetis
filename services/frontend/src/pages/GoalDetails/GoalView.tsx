import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { GoalDifficulty, GoalStatus, GoalWithWallet } from '../../types/goals';
import { useGoals } from '../../provider/goalProvider';
import GoalInfoTab from './GoalInfoTab';
import GoalAITab from './GoalAITab';
import GoalWalletsTab from './GoalWalletsTab';
import GoalTasksTab from './GoalTasksTab';
import GoalEditTab from './GoalEditTab';
import GoalContract from './GoalContract';
import { 
  Button as MuiButton,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Toolbar,
  Typography,
  IconButton,
  AppBar,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Info as InfoIcon,
  Psychology as AIIcon,
  AccountBalanceWallet as WalletIcon,
  Assignment as TasksIcon,
  ArrowBack as BackIcon,
  Menu as MenuIcon,
  ContentCopy as CopyIcon,
  Storage as ContractIcon
} from '@mui/icons-material';

const DRAWER_WIDTH = 320;

const MainContainer = styled(Box)`
  display: flex;
  background-color: #f5f5f5;
  margin: 0 auto;
`;

const LogoContainer = styled(Box)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 12px 32px;
  cursor: pointer;
  
  &:hover {
    opacity: 0.8;
  }
`;

const LogoImage = styled.img`
  height: 33px;
  width: auto;
`;

const BackButtonContainer = styled(Box)`
  padding: 16px;
  border-top: 1px solid #e0e0e0;
  margin-top: auto;
`;

const MobileAppBar = styled(AppBar)`
  && {
    z-index: 1300;
    background-color: #fff;
    color: #333;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
`;

const Sidebar = styled(Drawer)<{ isMobile?: boolean }>`
  width: ${DRAWER_WIDTH}px;
  flex-shrink: 0;
  
  .MuiDrawer-paper {
    width: ${DRAWER_WIDTH}px;
    box-sizing: border-box;
    background-color: #fff;
    border-right: 1px solid #e0e0e0;
    display: flex;
    flex-direction: column;
    ${({ isMobile }) => isMobile && `
      margin-top: 54px;
      height: calc(100% - 54px);
    `}
  }
`;

const ContentArea = styled(Box)<{ isMobile?: boolean }>`
  flex-grow: 1;
`;



interface GoalViewProps {
  goal: GoalWithWallet;
  onDelete: () => void;
  onStatusUpdate: (status: GoalStatus) => void;
  onBack: () => void;
  onGoalUpdate: () => void;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

type TabType = 'info' | 'ai-evaluation' | 'wallets' | 'tasks' | 'edit' | 'contract';

interface TabItem {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

const GoalView: React.FC<GoalViewProps> = ({ 
  goal,  
  onDelete, 
  onStatusUpdate, 
  onBack,
  onGoalUpdate,
  activeTab,
  onTabChange
}) => {
  const { getTotalBalanceInUSD, generateShareToken, revokeShareToken } = useGoals();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const canEditGoal = (goal.status === GoalStatus.PENDING || goal.status === GoalStatus.FUNDED || goal.status === GoalStatus.ACTIVE) && (goal.difficulty === GoalDifficulty.EASY || goal.difficulty === GoalDifficulty.UNSET);
  // Calculate total balance for delete permission logic
  const totalBalance = goal.wallets && goal.wallets.length > 0 
    ? getTotalBalanceInUSD(goal.wallets) 
    : 0;
  
  // Allow deletion if:
  // 1. Goal is PENDING and not MEDIUM/HARD/HARDCORE difficulty, OR
  // 2. Goal is EASY difficulty with no funds (regardless of status)
  const canDeleteGoal = (goal.status === GoalStatus.PENDING && 
    goal.difficulty !== 'MEDIUM' && 
    goal.difficulty !== 'HARD' && 
    goal.difficulty !== 'HARDCORE') ||
    (goal.difficulty === 'EASY' && totalBalance === 0);
  const [totalBalanceUSD, setTotalBalanceUSD] = useState<number>(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Share functionality state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [shareToken, setShareToken] = useState<string>('');
  const [shareLoading, setShareLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    // Use the synchronous getTotalBalanceInUSD from context
    if (goal.wallets && goal.wallets.length > 0) {
      const total = getTotalBalanceInUSD(goal.wallets);
      setTotalBalanceUSD(total);
    } else {
      setTotalBalanceUSD(0);
    }
  }, [goal.wallets, getTotalBalanceInUSD]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleTabChange = (tabId: TabType) => {
    onTabChange(tabId);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const tabs: TabItem[] = [
    { id: 'info' as TabType, label: 'Goal Information', icon: <InfoIcon /> },
    { id: 'ai-evaluation' as TabType, label: 'AI Evaluation', icon: <AIIcon /> },
    { id: 'wallets' as TabType, label: 'Custodial Wallet', icon: <WalletIcon /> },
    { id: 'tasks' as TabType, label: 'Task Management', icon: <TasksIcon /> },
    { 
      id: 'contract' as TabType, 
      label: 'Contract Management', 
      icon: <ContractIcon />,
      disabled: goal.difficulty !== 'MEDIUM' && goal.difficulty !== 'HARD' && goal.difficulty !== 'HARDCORE'
    },
  ];



  // Share functionality
  const handleShareClick = async () => {
    setShareDialogOpen(true);
    
    // Check if goal already has a share token
    if ((goal as any).shareToken) {
      setShareToken((goal as any).shareToken);
      setShareUrl(`${process.env.REACT_APP_SHOWCASE_URL || 'https://myodyssey.me'}/goals/${(goal as any).shareToken}`);
    } else {
      // Generate new share token
      try {
        setShareLoading(true);
        const response = await generateShareToken(goal.id);
        setShareToken(response.shareToken);
        setShareUrl(`${process.env.REACT_APP_SHOWCASE_URL || 'https://myodyssey.me'}/goals/${response.shareToken}`);
      } catch (error) {
        console.error('Failed to generate share token:', error);
        setSnackbarMessage('Failed to generate share link');
        setSnackbarOpen(true);
        setShareDialogOpen(false);
      } finally {
        setShareLoading(false);
      }
    }
  };

  const handleCopyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setSnackbarMessage('Share link copied to clipboard!');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setSnackbarMessage('Failed to copy link');
      setSnackbarOpen(true);
    }
  };

  const handleRevokeShareToken = async () => {
    try {
      setShareLoading(true);
      await revokeShareToken(goal.id);
      setShareToken('');
      setShareUrl('');
      setShareDialogOpen(false);
      setSnackbarMessage('Share link revoked successfully');
      setSnackbarOpen(true);
      onGoalUpdate(); // Refresh goal data
    } catch (error) {
      console.error('Failed to revoke share token:', error);
      setSnackbarMessage('Failed to revoke share link');
      setSnackbarOpen(true);
    } finally {
      setShareLoading(false);
    }
  };

  const handleCloseShareDialog = () => {
    setShareDialogOpen(false);
    setShareToken('');
    setShareUrl('');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <GoalInfoTab
            goal={goal}
            totalBalanceUSD={totalBalanceUSD}
            canDeleteGoal={canDeleteGoal}
            canEditGoal={canEditGoal}
            onStatusUpdate={onStatusUpdate}
            onDelete={onDelete}
            onShareClick={handleShareClick}
            onTabChange={onTabChange}
          />
        );

      case 'ai-evaluation':
        return (
          <GoalAITab
            goal={goal}
            totalBalanceUSD={totalBalanceUSD}
            onGoalUpdate={onGoalUpdate}
          />
        );

      case 'wallets':
        return (
          <GoalWalletsTab
            goal={goal}
            onGoalUpdate={onGoalUpdate}
          />
        );

      case 'tasks':
        return (
          <GoalTasksTab
            goalId={goal.id}
            goalDeadline={goal.deadline}
            onTabChange={onTabChange}
          />
        );

      case 'edit':
        return (
          <GoalEditTab
            goal={goal}
            onGoalUpdate={onGoalUpdate}
            onTabChange={onTabChange}
          />
        );

      case 'contract':
        return (
          <GoalContract
            goal={goal}
            onGoalUpdate={onGoalUpdate}
          />
        );

      default:
        return null;
    }
  };

  const drawerContent = (
    <>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <a href="https://myodyssey.me" rel="noopener noreferrer" target="_self" style={{ textDecoration: 'none' }}>
          <LogoContainer>
            <LogoImage src="/assets/logo-2.svg" alt="My Odyssey Logo" />
          </LogoContainer>
        </a>
      </Box>
      <List sx={{ px: 1, flex: 1 }}>
      <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.1rem', md: '1.25rem' },
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
            mb: 1,
            paddingLeft: 2,
            margin: 1,
          }}
          title={goal.title}
        >
          {goal.title}
        </Typography>
        {tabs.map((tab) => (
          <ListItem key={tab.id} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
              disabled={tab.disabled}
              sx={{
                borderRadius: '12px',
                margin: '2px 8px',
                minHeight: 48,
                opacity: tab.disabled ? 0.5 : 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  backgroundColor: tab.disabled ? 'transparent' : 'rgba(25, 118, 210, 0.08)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{tab.icon}</ListItemIcon>
              <ListItemText 
                primary={tab.label} 
                primaryTypographyProps={{
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  fontWeight: activeTab === tab.id ? 600 : 500
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <BackButtonContainer>
        <MuiButton
          startIcon={<BackIcon />}
          onClick={onBack}
          variant="text"
          fullWidth
          sx={{ 
            justifyContent: 'flex-start',
            textTransform: 'none',
            fontWeight: 500,
            fontSize: isMobile ? '0.875rem' : '1rem'
          }}
        >
          Back to Goals
        </MuiButton>
      </BackButtonContainer>
    </>
  );

  return (
    <MainContainer>
      {isMobile && (
        <MobileAppBar position="fixed">
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              {tabs.find(tab => tab.id === activeTab)?.label}
            </Typography>
          </Toolbar>
        </MobileAppBar>
      )}

      <Sidebar
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={handleDrawerToggle}
        isMobile={isMobile}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
      >
        {drawerContent}
      </Sidebar>

      <ContentArea isMobile={isMobile}>
        {renderTabContent()}
      </ContentArea>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={handleCloseShareDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Share Goal</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Anyone with this link can view your goal details, including progress and wallets for donations.
          </Typography>
          {shareUrl && (
            <TextField
              fullWidth
              label="Share Link"
              value={shareUrl}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <IconButton onClick={handleCopyShareUrl} edge="end">
                    <CopyIcon />
                  </IconButton>
                )
              }}
              margin="normal"
            />
          )}
        </DialogContent>
        <DialogActions>
          {shareToken && (
            <MuiButton 
              onClick={handleRevokeShareToken} 
              color="error"
              disabled={shareLoading}
            >
              Revoke Link
            </MuiButton>
          )}
          <MuiButton onClick={handleCloseShareDialog}>Close</MuiButton>
          <MuiButton 
            onClick={handleCopyShareUrl} 
            variant="contained"
            disabled={!shareUrl || shareLoading}
          >
            Copy Link
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </MainContainer>
  );
};

export default GoalView; 