import { Box, Typography, Card, CardContent } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { useInView } from 'react-intersection-observer';
import {
  Flag as FlagIcon,
  Timeline as TimelineIcon,
  EmojiEvents as TrophyIcon,
  Groups as CommunityIcon,
  Security as SecurityIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const FeatureCard = styled(Card)(({ theme }) => ({
  border: 'none',
  borderRadius: '16px',
  background: theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.05)' 
    : 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #2196F3, #21CBF3)',
  },
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
    '&::before': {
      background: 'linear-gradient(90deg, #21CBF3, #2196F3)',
    },
  },
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(3),
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  width: 80,
  height: 80,
  borderRadius: '50%',
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
    : 'linear-gradient(135deg, #f6f9fc 0%, #eef2f7 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(3),
  color: theme.palette.primary.main,
  fontSize: 40,
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    border: '2px solid',
    borderColor: theme.palette.primary.main,
    opacity: 0.2,
  },
}));

const FeaturesGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: theme.spacing(4),
  marginTop: theme.spacing(4),
  maxWidth: 1200,
  margin: '0 auto',
  padding: theme.spacing(0, 2),
  [theme.breakpoints.up('sm')]: {
    gridTemplateColumns: 'repeat(2, 1fr)',
  },
  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: 'repeat(4, 1fr)',
  },
}));

const PlatformFeatures = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const features = [
    {
      icon: <FlagIcon fontSize="large" />,
      title: 'Set Your Odyssey Goals',
      description: 'Define your journey with clear, achievable milestones. Track your progress as you navigate through your personal Odyssey.',
    },
    {
      icon: <TimelineIcon fontSize="large" />,
      title: 'Progress Tracking',
      description: 'Visualize your journey with detailed progress tracking. See how far you`ve come and what lies ahead in your Odyssey.',
    },
    {
      icon: <TrophyIcon fontSize="large" />,
      title: 'Achievement Rewards',
      description: 'Earn rewards and recognition as you complete milestones. Celebrate your victories along your Odyssey journey.',
    },
    {
      icon: <CommunityIcon fontSize="large" />,
      title: 'Community Support',
      description: 'Join fellow travelers on their Odysseys. Share experiences, get motivated, and support each other\'s journeys.',
    },
    {
      icon: <SecurityIcon fontSize="large" />,
      title: 'Secure Staking',
      description: 'Stake your commitment on-chain. Your goals are secured by blockchain technology, ensuring transparency and trust.',
    },
    {
      icon: <WalletIcon fontSize="large" />,
      title: 'Smart Rewards',
      description: 'Automated rewards through smart contracts. Your achievements are recognized and rewarded instantly.',
    },
  ];

  return (
    <Box ref={ref} sx={{ 
      py: 10, 
      px: { xs: 2, sm: 4, md: 6 },
      background: theme => theme.palette.mode === 'dark'
        ? 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 100%)'
        : 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 100%)',
    }}>
      <Typography 
        variant="h2" 
        component="h2" 
        align="center" 
        gutterBottom
        sx={{ 
          mb: 6,
          fontWeight: 800,
          fontSize: { xs: '2.5rem', md: '3.5rem' },
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 2px 10px rgba(0,0,0,0.1)',
          position: 'relative'
        }}
      >
        Your Odyssey Journey
      </Typography>
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, 
        gap: 4,
        maxWidth: 1400,
        margin: '0 auto',
      }}>
        {features.map((feature, idx) => (
          <FeatureCard key={idx}>
            <IconWrapper>{feature.icon}</IconWrapper>
            <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 0 }}>
              <Typography 
                variant="h6" 
                component="h3" 
                gutterBottom 
                sx={{ 
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  mb: 2,
                  color: theme => theme.palette.text.primary,
                }}
              >
                {feature.title}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  opacity: 0.9,
                }}
              >
                {feature.description}
              </Typography>
            </CardContent>
          </FeatureCard>
        ))}
      </Box>
    </Box>
  );
};

export default PlatformFeatures; 