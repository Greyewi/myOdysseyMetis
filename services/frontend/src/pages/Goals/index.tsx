import { Box, Container } from '@mui/material';
import { styled } from '@mui/material/styles';
import Goals from './components/PublishedGoals';
import Hero from './components/Hero';

const Section = styled(Box)(({ theme }) => ({
  // padding: theme.spacing(10, 0),
  scrollMarginTop: '64px', // For smooth scrolling with AppBar
}));

const LandingPage = () => {
  return (
    <Box>
      <Hero />

      <Section id="goals">
        <Container maxWidth="lg">
          <Goals />
        </Container>
      </Section>
    </Box>
  );
};

export default LandingPage; 