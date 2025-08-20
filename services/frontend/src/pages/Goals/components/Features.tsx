import { Box, Grid, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const FeatureCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
}));

const Features = () => {
  const features = [
    {
      title: 'Smart Contract Integration',
      description: 'Secure and transparent goal tracking using blockchain technology',
    },
    {
      title: 'Multi-Chain Support',
      description: 'Set goals across different blockchain networks',
    },
    {
      title: 'Progress Tracking',
      description: 'Real-time monitoring of your cryptocurrency goals',
    },
    {
      title: 'Community Engagement',
      description: 'Share and inspire others with your financial objectives',
    },
  ];

  return (
    <Box>
      <Typography variant="h2" component="h2" align="center" gutterBottom>
        Platform Features
      </Typography>
      <Grid container spacing={4} sx={{ mt: 4 }}>
        {features.map((feature, index) => (
          <Grid key={index} sx={{ width: { xs: '100%', sm: '50%' } }}>
            <FeatureCard elevation={2}>
              <Typography variant="h5" component="h3" gutterBottom>
                {feature.title}
              </Typography>
              <Typography color="text.secondary">
                {feature.description}
              </Typography>
            </FeatureCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Features; 