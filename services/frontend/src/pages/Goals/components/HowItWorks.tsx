import { Box, Stack, Typography, Avatar, useTheme, useMediaQuery } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { useInView } from 'react-intersection-observer';
import {
  AddCircle as AddCircleIcon,
  Public as PublicIcon,
  Favorite as FavoriteIcon,
  CheckCircle as CheckCircleIcon,
  Hiking as HikingIcon,
} from '@mui/icons-material';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const StepContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isRightAligned',
})<{ isRightAligned?: boolean }>(({ theme, isRightAligned }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(2),
  position: 'relative',
  padding: theme.spacing(2),
  maxWidth: '80%',
  flexDirection: isRightAligned ? 'row-reverse' : 'row',
  alignSelf: isRightAligned ? 'flex-end' : 'flex-start',
}));

const StepContent = styled(Box)(({ theme }) => ({
  flex: 1,
}));

const StepNumber = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: theme.palette.primary.contrastText,
  boxShadow: `0 4px 20px 0 ${theme.palette.primary.main}40`,
}));

const RouteBackground = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  overflow: 'hidden',
  '& svg': {
    width: '100%',
    height: '100%',
  },
}));

const path = "M20,20 C40,20 60,30 80,30 C100,30 80,50 60,50 C40,50 60,70 80,70 C100,70 100,90 80,90";

const StaticHiker = styled(HikingIcon)(({ theme }) => ({
  position: 'absolute',
  width: '24px',
  height: '24px',
  color: theme.palette.primary.main,
  opacity: 0.9,
  filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.2))',
  transform: 'translate(-50%, -50%)',
  left: '20%',
  top: '20%',
  zIndex: 1,
}));

const HowItWorks = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const steps = [
    {
      label: 'Create Goal',
      description: 'Set your crypto savings target and start your journey.',
      icon: <AddCircleIcon />,
    },
    {
      label: 'Stake Deposit',
      description: 'Lock a deposit to show your commitment and unlock accountability.',
      icon: <FavoriteIcon />,
    },
    {
      label: 'Get Support',
      description: 'Share your goal and receive encouragement or donations from the community.',
      icon: <PublicIcon />,
    },
    {
      label: 'Achieve & Withdraw',
      description: 'Reach your goal, reclaim your deposit, and keep all support received.',
      icon: <CheckCircleIcon />,
    },
  ];

  return (
    <Box ref={ref} sx={{ py: 12, px: { xs: 2, sm: 4, md: 6 }, position: 'relative' }}>
      <Typography 
        variant="h2" 
        component="h2" 
        align="center" 
        gutterBottom
        sx={{ 
          mb: 6,
          fontWeight: 700,
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        How It Works
      </Typography>
      
      <Box sx={{ position: 'relative', minHeight: '600px' }}>
        <RouteBackground>
          <Box sx={{ 
            position: 'relative', 
            width: '100%', 
            height: '100%',
            overflow: 'hidden',
            '& .MuiSvgIcon-root': {
              width: '24px',
              height: '24px',
            }
          }}>
            <StaticHiker />
            <svg 
              viewBox="0 0 100 100" 
              preserveAspectRatio="xMidYMid meet"
              style={{ 
                position: 'relative', 
                width: '100%', 
                height: '100%',
                maxWidth: '600px',
                maxHeight: '600px'
              }}
            >
              <path
                d={path}
                fill="none"
                stroke={theme.palette.primary.main}
                strokeWidth="0.5"
                strokeOpacity="0.2"
                strokeDasharray="2,2"
              />
              {[
                { x: 20, y: 20 },
                { x: 80, y: 30 },
                { x: 80, y: 70 },
                { x: 80, y: 90 }
              ].map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r="1"
                  fill={theme.palette.primary.main}
                  opacity="0.5"
                />
              ))}
            </svg>
          </Box>
        </RouteBackground>
        <Stack
          direction="column"
          spacing={8}
        >
          {steps.map((step, index) => (
            <StepContainer 
              key={step.label}
              isRightAligned={index % 2 === 1}
              sx={{
                animation: inView ? `${fadeIn} 0.6s ease-out ${index * 0.2}s forwards` : 'none',
                opacity: 0,
              }}
            >
              <StepNumber>{index + 1}</StepNumber>
              <StepContent>
                <Typography variant="h6" gutterBottom>
                  {step.label}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {step.description}
                </Typography>
              </StepContent>
            </StepContainer>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default HowItWorks; 