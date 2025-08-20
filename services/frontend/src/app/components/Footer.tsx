import React from 'react';
import { Box, Container, Typography, Link, Stack, IconButton } from '@mui/material';
import TelegramIcon from '@mui/icons-material/Telegram';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import { Link as RouterLink } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.background.paper,
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 2, sm: 4 }}
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: '0.875rem' }}
          >
            © {new Date().getFullYear()} CryptoGoals. All rights reserved.
          </Typography>

          <Stack direction="row" spacing={2}>
            <Link
              component={RouterLink}
              to="/"
              color="text.secondary"
              sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
            >
              New Goal
            </Link>
            <Link
              component={RouterLink}
              to="/my-goals"
              color="text.secondary"
              sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
            >
              Manage Goals
            </Link>
            <Link
              component={RouterLink}
              to="/profile"
              color="text.secondary"
              sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
            >
              Profile
            </Link>
            <Link
              component={RouterLink}
              to="/how-it-works"
              color="text.secondary"
              sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
            >
              How it works
            </Link>
          </Stack>

          <Stack direction="row" spacing={1}>
            <IconButton
              component="a"
              href="https://www.instagram.com/myodyssey.me"
              target="_blank"
              rel="noopener noreferrer"
              color="primary"
              size="small"
            >
              <InstagramIcon />
            </IconButton>
            <IconButton
              component="a"
              href="https://t.me/cryptogoals"
              target="_blank"
              rel="noopener noreferrer"
              color="primary"
              size="small"
            >
              <TelegramIcon />
            </IconButton>
            <IconButton
              component="a"
              href="https://www.linkedin.com/company/my-odyssey/"
              target="_blank"
              rel="noopener noreferrer"
              color="primary"
              size="small"
            >
              <LinkedInIcon />
            </IconButton>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}; 