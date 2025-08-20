import { Box, Grid, Typography, Card, CardContent } from '@mui/material';
import { styled } from '@mui/material/styles';

const BenefitCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.02)',
  },
}));

const Benefits = () => {
  const benefits = [
    {
      title: 'Accountability',
      description: 'Stay committed to your goals with public tracking',
    },
    {
      title: 'Transparency',
      description: 'All progress is verified on the blockchain',
    },
    {
      title: 'Motivation',
      description: "Get inspired by the community's success stories",
    },
    {
      title: 'Security',
      description: 'Your funds remain in your control at all times',
    },
  ];

  return (
    <Box>
      <Typography variant="h2" component="h2" align="center" gutterBottom>
        Benefits
      </Typography>
      <Grid container spacing={4} sx={{ mt: 4 }}>
        {benefits.map((benefit, index) => (
          <Grid key={index} sx={{ width: { xs: '100%', sm: '50%' } }}>
            <BenefitCard>
              <CardContent>
                <Typography variant="h5" component="h3" gutterBottom>
                  {benefit.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {benefit.description}
                </Typography>
              </CardContent>
            </BenefitCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Benefits; 