import { Box, Typography, Button, Container, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAppKit } from '../../../app/config';

const HeroSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)'
    : 'linear-gradient(180deg, rgba(33,150,243,0.05) 0%, rgba(33,150,243,0) 100%)',
  padding: theme.spacing(4, 0),
}));

const HeroContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(8),
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    textAlign: 'center',
  },
}));

const HeroText = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  '& h1': {
    fontSize: '3.5rem',
    fontWeight: 800,
    lineHeight: 1.2,
    marginBottom: theme.spacing(2),
    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  '& p': {
    fontSize: '1.25rem',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(4),
    lineHeight: 1.6,
  },
}));

const HeroImage = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
}));

const Logo = styled('img')(({ theme }) => ({
  width: '100%',
  maxWidth: 350,
  height: 'auto',
  objectFit: 'contain',
}));

const ButtonContainer = styled(Stack)(({ theme }) => ({
  [theme.breakpoints.down('md')]: {
    justifyContent: 'center',
  },
}));

const Hero = () => {
  const navigate = useNavigate();

  const handleCreateGoal = () => {
    navigate('/new');
  };

  const handleHowItWorks = () => {
    navigate('/how-it-works');
  };

  return (
    <HeroSection>
      <Container maxWidth="lg">
        <HeroContent>
          <HeroText>
            <Typography variant="h1" component="h1">
              Own Your Journey
            </Typography>
            <Typography variant="body1">
              Prove your ambition on-chain.<br/>
              Create a goal, commit real value, and be rewarded when you succeed.
            </Typography>
            <ButtonContainer direction="row" spacing={2}>
              <Button
                variant="contained"
                size="large"
                onClick={handleCreateGoal}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  py: 1.5,
                  px: 4,
                }}
              >
                Create Goal
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={handleHowItWorks}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  py: 1.5,
                  px: 4,
                }}
              >
                How It Works
              </Button>
            </ButtonContainer>
          </HeroText>
          <HeroImage>
            <Logo src="assets/hero-map.png" alt="CryptoGoals Logo" />
          </HeroImage>
        </HeroContent>
      </Container>
    </HeroSection>
  );
};

export default Hero; 