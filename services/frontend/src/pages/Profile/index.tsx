import React, { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { getProfile, updateProfile } from '../../app/api/profile';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Avatar,
  Button,
  TextField,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Tooltip,
  Stack,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  ContentCopy as ContentCopyIcon,
  AccountBalanceWallet as WalletIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import { config } from '@/config';
import { MDXEditor, MDXEditorMethods } from '@mdxeditor/editor';
import { headingsPlugin, listsPlugin, quotePlugin, thematicBreakPlugin, markdownShortcutPlugin, linkPlugin, linkDialogPlugin, toolbarPlugin, UndoRedo, BoldItalicUnderlineToggles, CodeToggle, CreateLink, InsertThematicBreak, ListsToggle, Separator } from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import ReactMarkdown from 'react-markdown';

interface Wallet {
  id: number;
  address: string;
  walletType: string;
  createdAt: string;
}

interface Profile {
  id: number;
  username: string;
  email: string;
  bio: string;
  avatar: string;
  wallets: Wallet[];
}

const MDXEditorWrapper = styled(Box)(({ theme }) => ({
  '& .mdxeditor': {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
  },
  '& .mdxeditor-toolbar': {
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.default,
    borderTopLeftRadius: theme.shape.borderRadius,
    borderTopRightRadius: theme.shape.borderRadius,
  },
  '& .mdxeditor-root-contenteditable': {
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(2),
    minHeight: '150px',
  },
}));

const Profile = () => {
  const { address } = useAccount();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [copyNotification, setCopyNotification] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    avatar: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profileData = await getProfile();
      setProfile(profileData);
      setFormData({
        username: profileData.username || '',
        email: profileData.email || '',
        bio: profileData.bio || '',
        avatar: profileData.avatar || ''
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'No authentication token found') {
        navigate('/');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      await fetchProfile();
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    // You might want to add a notification here
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress />
    </Box>
  );

  if (error) return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Alert severity="error">{error}</Alert>
    </Container>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {isEditing ? (
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
            Edit Profile
          </Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Box sx={{ width: '100%' }}>
                <TextField
                  fullWidth
                  label="Avatar URL"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <Avatar
                        src={formData.avatar}
                        sx={{ width: 24, height: 24, mr: 1 }}
                      />
                    ),
                  }}
                />
              </Box>
              <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Box>
              <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Box>
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                  <DescriptionIcon sx={{ mr: 1, color: 'action.active' }} />
                  Bio
                </Typography>
                <MDXEditorWrapper>
                  <MDXEditor
                    markdown={formData.bio}
                    onChange={(value: string) => handleInputChange({ target: { name: 'bio', value } } as any)}
                    plugins={[
                      headingsPlugin(),
                      listsPlugin(),
                      quotePlugin(),
                      thematicBreakPlugin(),
                      markdownShortcutPlugin(),
                      linkPlugin(),
                      linkDialogPlugin(),
                      toolbarPlugin({
                        toolbarContents: () => (
                          <>
                            <UndoRedo />
                            <Separator />
                            <BoldItalicUnderlineToggles />
                            <CodeToggle />
                            <Separator />
                            <ListsToggle />
                            <Separator />
                            <CreateLink />
                            <InsertThematicBreak />
                          </>
                        )
                      })
                    ]}
                  />
                </MDXEditorWrapper>
              </Box>
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => setIsEditing(false)}
                    size="large"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    type="submit"
                    size="large"
                  >
                    Save Changes
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Box>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          <Box sx={{ width: { xs: '100%', md: '100%' } }}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                  <Avatar
                    src={profile?.avatar}
                    alt={profile?.username}
                    sx={{ 
                      width: 150, 
                      height: 150,
                      mb: 2,
                      boxShadow: 3
                    }}
                  />
                  <Typography variant="h5" gutterBottom>
                    {profile?.username || 'No username set'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    {profile?.email || 'No email set'}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditing(true)}
                    fullWidth
                  >
                    Edit Profile
                  </Button>
                </Box>
                {profile?.bio && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                      <Box sx={{ width: { xs: '100%', md: '66.67%' } }}>
                        <Card elevation={3}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                              <WalletIcon sx={{ mr: 1 }} />
                              <Typography variant="h5">
                                Connected Wallets
                              </Typography>
                            </Box>
                            <Stack spacing={2}>
                              {profile?.wallets.map((wallet) => (
                                <Paper
                                  key={wallet.id}
                                  sx={{
                                    p: 3,
                                    background: wallet.address === address ? 'rgba(46, 125, 50, 0.04)' : 'inherit'
                                  }}
                                  variant="outlined"
                                >
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>
                                          {`${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`}
                                        </Typography>
                                        <Tooltip title="Copy address">
                                          <IconButton 
                                            size="small" 
                                            onClick={() => copyToClipboard(wallet.address)}
                                            sx={{ ml: 1 }}
                                          >
                                            <ContentCopyIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      </Box>
                                      <Chip
                                        label={wallet.walletType}
                                        size="small"
                                        sx={{ mr: 1 }}
                                      />
                                      {wallet.address === address && (
                                        <Chip
                                          label="Current"
                                          color="success"
                                          size="small"
                                        />
                                      )}
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        Added
                                      </Typography>
                                      <Typography variant="body2">
                                        {new Date(wallet.createdAt).toLocaleDateString(undefined, {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric'
                                        })}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Paper>
                              ))}
                            </Stack>
                          </CardContent>
                        </Card>
                      </Box>
                      <Box sx={{ width: { xs: '100%', md: '100%' } }}>
                        <Card elevation={3}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                              <DescriptionIcon sx={{ mr: 1 }} />
                              <Typography variant="h5">
                                About
                              </Typography>
                            </Box>
                            <Box data-color-mode="light" sx={{ 
                              '& .w-md-editor': { 
                                boxShadow: 'none',
                                border: 'none',
                                width: '100%'
                              },
                              '& .w-md-editor-preview': {
                                padding: '16px !important',
                                width: '100%'
                              },
                              '& .w-md-editor-preview *': {
                                maxWidth: '100%'
                              }
                            }}>
                              <ReactMarkdown>
                                {profile.bio}
                              </ReactMarkdown>
                            </Box>
                          </CardContent>
                        </Card>
                      </Box>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Box>
        </Grid>
      )}
    </Container>
  );
};

export default Profile;

