import { Box, Container, Typography, List, ListItem, ListItemIcon, ListItemText, Button } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { useInView } from 'react-intersection-observer';
import {
  CheckCircle as CheckCircleIcon,
  AddCircle as AddCircleIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useAppKit, useAppKitAccount } from '../../../app/config';
import { useNavigate } from 'react-router-dom';

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

const MissionText = styled(Typography)(({ theme }) => ({
  fontSize: '1.25rem',
  lineHeight: 1.8,
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(6),
  textAlign: 'center',
  maxWidth: 800,
  marginLeft: 'auto',
  marginRight: 'auto',
}));

const TOKEN_KEY = 'cryptogoals_auth_token';

const OdysseyCTA = ({ onClick }: { onClick: () => void }) => (
  <Button
    variant="contained"
    color="primary"
    size="large"
    endIcon={<ArrowForwardIcon />}
    sx={{
      width: '100%',
      maxWidth: 320,
      fontWeight: 700,
      fontSize: '1.1rem',
      borderRadius: 2,
      textTransform: 'none',
      boxShadow: '0 2px 8px 0 rgba(33,150,243,0.10)',
      mt: 2,
      py: 1.5,
      letterSpacing: '0.02em',
    }}
    onClick={onClick}
  >
    Create Goal
  </Button>
);

const ProjectGoals = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  const modal = useAppKit();
  const { isConnected, address } = useAppKitAccount();
  const navigate = useNavigate();
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

  const handleClick = () => {
    if (isConnected && address && token) {
      navigate('/new');
    } else {
      modal.open();
    }
  };

  return (
    <Box 
      ref={ref} 
      sx={{ 
        py: 12,
        background: 'linear-gradient(180deg, rgba(33, 150, 243, 0.05) 0%, rgba(33, 150, 243, 0) 100%)',
      }}
    >
      <Container maxWidth="md">
        <MissionText
          sx={{
            animation: inView ? `${fadeIn} 0.6s ease-out 0.2s forwards` : 'none',
            opacity: 0,
            fontFamily: "'Times New Roman', Times, serif",
            fontStyle: 'italic',
            fontSize: { xs: '1.1rem', md: '1.25rem' },
            color: '#222',
            mb: 2,
            lineHeight: 1.6,
          }}
        >
          I believe every goal deserves a journey — one you can reserve, embark on, and celebrate every step of the way.
          <br /><br />
          <b>Odyssey</b> is your personal booking platform for ambition. Secure your spot, set your intentions in stone, and turn aspirations into confirmed reservations — not just for others to see, but for yourself to believe.
          <br /><br />
          With every goal you list and every deposit you stake, you're not just making a plan — you're booking your adventure in a public ledger of dreams, and earning recognition for every milestone you check off.
        </MissionText>

        <Typography
          variant="h6"
          align="center"
          sx={{
            fontWeight: 700,
            mb: 2,
            color: '#2196F3',
          }}
        >
          Ready to make your mark? Start your journey now.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <OdysseyCTA onClick={handleClick} />
        </Box>
      </Container>
    </Box>
  );
};

export default ProjectGoals; 