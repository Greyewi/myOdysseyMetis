import { Box, Stack, Typography, Paper } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { useInView } from 'react-intersection-observer';
import {
  TrendingUp as TrendingUpIcon,
  Groups as GroupsIcon,
  Savings as SavingsIcon,
  RocketLaunch as RocketLaunchIcon,
} from '@mui/icons-material';

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const BenefitCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(3),
  transition: 'all 0.3s ease-in-out',
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
    borderColor: theme.palette.primary.main,
  },
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  width: 48,
  height: 48,
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: theme.palette.primary.contrastText,
  boxShadow: `0 4px 20px 0 ${theme.palette.primary.main}40`,
  flexShrink: 0,
}));

const PlatformBenefits = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const benefits = [
    {
      icon: <TrendingUpIcon />,
      title: 'Motivation & Discipline',
      description: 'Stay committed to your financial goals with our structured approach and progress tracking.',
    },
    {
      icon: <GroupsIcon />,
      title: 'Community Support',
      description: 'Get inspired and supported by a community of like-minded individuals working towards their goals.',
    },
    {
      icon: <SavingsIcon />,
      title: 'Financial Responsibility',
      description: 'Develop healthy financial habits through regular savings and goal-oriented investing.',
    },
    {
      icon: <RocketLaunchIcon />,
      title: 'Simplicity & Accessibility',
      description: 'Easy-to-use platform that makes cryptocurrency savings accessible to everyone.',
    },
  ];

  return (
    <Box ref={ref} sx={{ py: 12, px: { xs: 2, sm: 4, md: 6 } }}>
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
        Platform Benefits
      </Typography>
      <Stack 
        spacing={3} 
        sx={{ 
          maxWidth: 800,
          mx: 'auto',
          opacity: inView ? 1 : 0,
        }}
      >
        {benefits.map((benefit, index) => (
          <BenefitCard 
            key={benefit.title}
            elevation={0}
            sx={{
              animation: inView ? `${fadeInUp} 0.6s ease-out ${index * 0.1}s forwards` : 'none',
              opacity: 0,
            }}
          >
            <IconWrapper>
              {benefit.icon}
            </IconWrapper>
            <Box>
              <Typography 
                variant="h6" 
                component="h3" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  mb: 1,
                }}
              >
                {benefit.title}
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ 
                  lineHeight: 1.6,
                }}
              >
                {benefit.description}
              </Typography>
            </Box>
          </BenefitCard>
        ))}
      </Stack>
    </Box>
  );
};

export default PlatformBenefits; 