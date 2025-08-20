import { Box, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const MissionPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6),
  textAlign: 'center',
  maxWidth: 800,
  margin: '0 auto',
  backgroundColor: theme.palette.background.default,
}));

const Mission = () => {
  return (
    <Box>
      <Typography variant="h2" component="h2" align="center" gutterBottom>
        Our Mission
      </Typography>
      <MissionPaper elevation={0}>
        <Typography variant="h5" component="p" paragraph>
        "I believe every goal deserves a journey — one that's visible, accountable, and meaningful."
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
        Odyssey is built for those who want more than promises. It’s for people ready to stake their word, walk their path, and prove their commitment — not just to others, but to themselves.
        </Typography>
        <Typography variant="body1" color="text.secondary">
        With every goal published and every deposit staked, we're creating a public record of intention — and honoring those who follow through.
        </Typography>
      </MissionPaper>
    </Box>
  );
};

export default Mission; 