import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem, Paper, Alert, SelectChangeEvent, CircularProgress, LinearProgress, Grid, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { InfoOutlined } from '@mui/icons-material';
import { GoalCategory } from '@/types/goals';
import CategorySelector from '../../components/CategorySelector';
import { MDXEditor } from '@mdxeditor/editor';
import { headingsPlugin, listsPlugin, quotePlugin, thematicBreakPlugin, markdownShortcutPlugin, linkPlugin, linkDialogPlugin, toolbarPlugin, UndoRedo, BoldItalicUnderlineToggles, CodeToggle, CreateLink, InsertThematicBreak, ListsToggle, Separator } from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import 'react-image-crop/dist/ReactCrop.css';
import { ImageEditor } from './ImageEditor';
import { config } from '@/config';
import { useAppKit } from '@/app/config';
import { getSupportedNetworks } from '../../utils/networkFilter';
import { compressImage, needsCompression, isValidImage } from '../../utils/imageCompression';

const TOKEN_KEY = 'cryptogoals_auth_token';
const DRAFT_GOAL_KEY = 'cryptogoals_draft_goal';

// Define supported networks
export enum WalletNetwork {
  ERC20 = 'ERC20',
  ARBITRUM = 'ARBITRUM',
  OPTIMISM = 'OPTIMISM',
  POLYGON = 'POLYGON',
  BSC = 'BSC',
  METIS = 'METIS',
}

const ALL_NETWORKS = Object.values(WalletNetwork);

const SUPPORTED_NETWORKS = getSupportedNetworks();

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
  borderRadius: 16,
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
}));

const StyledForm = styled('form')({
  display: 'flex',
  flexDirection: 'column',
});

const EditorWrapper = styled('div')(({ theme }) => ({
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
  },
  // Fallback for older class names if they exist
  '& .w-md-editor': {
    boxShadow: 'none',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
  },
  '& .w-md-editor-toolbar': {
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.default,
    borderTopLeftRadius: theme.shape.borderRadius,
    borderTopRightRadius: theme.shape.borderRadius,
  },
  '& .w-md-editor-content': {
    backgroundColor: theme.palette.background.paper,
  },
  '& .w-md-editor-preview': {
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(2),
    '& *': {
      maxWidth: '100%',
    },
  },
  '& .wmde-markdown-color': {
    color: theme.palette.text.primary,
  },
  '& .wmde-markdown-color code': {
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.text.primary,
  },
  '& .wmde-markdown-color pre': {
    backgroundColor: theme.palette.action.hover,
  },
  '& .wmde-markdown-color blockquote': {
    borderLeftColor: theme.palette.primary.main,
    color: theme.palette.text.secondary,
  },
}));

const ImageInput = styled('input')({
  display: 'none',
});

const ImageLabel = styled('label')({
  display: 'inline-block',
  padding: '0.75rem 1.5rem',
  backgroundColor: '#f5f5f5',
  border: '1px solid #ddd',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: '#e0e0e0',
  },
});

const ImageContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
});

const FieldTip = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1),
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(1),
  [theme.breakpoints.up('md')]: {
    marginBottom: 0,
    marginRight: theme.spacing(2),
  },
}));

const FieldWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(3),
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
}));

const FieldContent = styled(Box)(({ theme }) => ({
  flex: 1,
  [theme.breakpoints.up('md')]: {
    flex: 2,
  },
}));

const TipContent = styled(Box)(({ theme }) => ({
  flex: 1,
  [theme.breakpoints.up('md')]: {
    flex: 1,
    maxWidth: '300px',
  },
}));

interface FormData {
  title: string;
  description: string;
  deadline: string;
  network: WalletNetwork;
  category: GoalCategory;
  weeklyTimeCommitment?: number;
  currentExperience?: string;
  availableResources?: string;
  startingPoint?: string;
}

const Title = styled(Typography)(({ theme }) => ({
  fontSize: '2.5rem',
  fontWeight: 700,
  marginBottom: theme.spacing(4),
  textAlign: 'center',
  background: '#2196F3',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  letterSpacing: '-0.025em',
  lineHeight: 1.2,
}));

const NewGoal = () => {
  const navigate = useNavigate();
  const modal = useAppKit();
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [creationStep, setCreationStep] = useState(0);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [formData, setFormData] = useState(() => {
    const savedDraft = localStorage.getItem(DRAFT_GOAL_KEY);
    return savedDraft ? JSON.parse(savedDraft) : {
      title: '',
      description: '',
      deadline: '',
      network: SUPPORTED_NETWORKS[0],
      category: GoalCategory.PERSONAL,
      weeklyTimeCommitment: undefined,
      currentExperience: '',
      availableResources: '',
      startingPoint: ''
    };
  });
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    deadline: '',
    network: '',
    category: '',
    image: ''
  });

  // Animation steps for goal creation
  const creationSteps = [
    'Evaluating goal...',
    'Creating tasks...',
    'Checking correction...',
    'Fixed tasks...',
    'Reevaluating goal...',
  ];

  // Cycle through creation steps during the creation process
  useEffect(() => {
    if (!isCreating) {
      setCreationStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCreationStep((prev) => (prev + 1) % creationSteps.length);
    }, 5000); // Change step every 2 seconds

    return () => clearInterval(interval);
  }, [isCreating, creationSteps.length]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(DRAFT_GOAL_KEY, JSON.stringify(formData));
  }, [formData]);

  const validateForm = () => {
    const newErrors = {
      title: '',
      description: '',
      deadline: '',
      network: '',
      category: '',
      image: ''
    };

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 150) {
      newErrors.title = 'Title must be 150 characters or less';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required';
    }
    if (!formData.network) {
      newErrors.network = 'Network is required';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate that it's an image file
      if (!isValidImage(file)) {
        setError('Please select a valid image file');
        return;
      }

      setIsCompressing(true);
      try {
        // Compress image if it's large
        let processedFile = file;
        if (needsCompression(file, 1)) { // Compress if larger than 1MB
          processedFile = await compressImage(file, {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.7,
            format: 'jpeg'
          });
        }
        
        setSelectedImage(processedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
          setEditedImage(processedFile);
          setIsCompressing(false);
        };
        reader.readAsDataURL(processedFile);
      } catch (error) {
        console.error('Error processing image:', error);
        setError('Failed to process image. Please try again.');
        setIsCompressing(false);
      }
    }
  };

  const handleImageEdited = (file: File) => {
    setEditedImage(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      modal.open();
      return;
    }

    setIsCreating(true);
    setError(null);
    setCreationStep(0);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('deadline', new Date(formData.deadline).toISOString());
      formDataToSend.append('network', formData.network);
      formDataToSend.append('category', formData.category);
      
      // Add AI-related fields if they exist
      if (formData.weeklyTimeCommitment) {
        formDataToSend.append('weeklyTimeCommitment', formData.weeklyTimeCommitment.toString());
      }
      if (formData.currentExperience) {
        formDataToSend.append('currentExperience', formData.currentExperience);
      }
      if (formData.availableResources) {
        formDataToSend.append('availableResources', formData.availableResources);
      }
      if (formData.startingPoint) {
        formDataToSend.append('startingPoint', formData.startingPoint);
      }
      
      const imageToSend = editedImage || selectedImage;
      if (imageToSend) {
        formDataToSend.append('image', imageToSend);
      }

      const response = await fetch(`${config.apiUrl}/goals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = 'Failed to create goal';
        
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (response.status === 413) {
          errorMessage = 'Image file is too large. Please choose a smaller image.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (response.status >= 400) {
          errorMessage = 'Invalid request. Please check your input and try again.';
        }
        
        throw new Error(errorMessage);
      }

      // Reset form state
      const initialFormData = {
        title: '',
        description: '',
        deadline: '',
        network: SUPPORTED_NETWORKS[0],
        category: GoalCategory.PERSONAL,
        weeklyTimeCommitment: undefined,
        currentExperience: '',
        availableResources: '',
        startingPoint: ''
      };
      
      setFormData(initialFormData);
      setSelectedImage(null);
      setImagePreview(null);
      setEditedImage(null);
      setErrors({
        title: '',
        description: '',
        deadline: '',
        network: '',
        category: '',
        image: ''
      });
      
      localStorage.removeItem(DRAFT_GOAL_KEY);
      const createdGoal = await response.json();
      navigate('/goals/' + createdGoal.id + '/difficulty');
    } catch (error) {
      console.error('Error creating goal:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsCreating(false);
      setCreationStep(0);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: FormData) => ({
      ...prev,
      [name]: name === 'weeklyTimeCommitment' ? (value ? parseInt(value, 10) : undefined) : value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData((prev: FormData) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDescriptionChange = (value?: string) => {
    setFormData((prev: FormData) => ({
      ...prev,
      description: value || ''
    }));
  };

  const handleCategoryChange = (category: GoalCategory) => {
    setFormData((prev: FormData) => ({
      ...prev,
      category
    }));
  };

  // Field tip component
  const FieldTipComponent = ({ title, description, tips }: { title: string; description: string; tips?: string[] }) => (
    <TipContent>
      <FieldTip>
        <InfoOutlined color="primary" sx={{ mt: 0.5, fontSize: '1.2rem' }} />
        <Box>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: tips ? 1 : 0 }}>
            {description}
          </Typography>
          {tips && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {tips.map((tip, index) => (
                <Chip
                  key={index}
                  label={tip}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem', height: '24px' }}
                />
              ))}
            </Box>
          )}
        </Box>
      </FieldTip>
    </TipContent>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Title variant="h1">
          Create New Goal
        </Title>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <StyledPaper>
          <StyledForm onSubmit={handleSubmit}>
            <FieldWrapper>
              <FieldTipComponent
                title="Goal Title"
                description="Clear, specific title that inspires and measures progress."
                tips={["Start with action verbs", "Can include numbers/timeframes", "Avoid vague words like 'better'"]}
              />
              <FieldContent>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  error={!!errors.title}
                  helperText={errors.title || `${formData.title.length}/150 characters`}
                  placeholder="e.g., Learn React and build 3 projects"
                  inputProps={{
                    maxLength: 150
                  }}
                />
              </FieldContent>
            </FieldWrapper>

            <FieldWrapper>
              <FieldTipComponent
                title="Goal Description"
                description="Start with your WHY, then describe WHAT success looks like. Include requirements and preferences for better AI task creation."
                tips={["Start with personal motivation", "List specific requirements", "Include learning preferences"]}
              />
              <FieldContent>
                <Typography variant="subtitle1" gutterBottom>
                  Description
                </Typography>
                <EditorWrapper>
                  <MDXEditor
                    markdown={formData.description}
                    onChange={handleDescriptionChange}
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
                    placeholder="Example: I want to learn React because I'm passionate about building web applications that solve real problems. Success means completing 3 portfolio projects and landing a frontend developer role. I have 2 hours daily, prefer video tutorials, and need to learn TypeScript alongside React. My constraint is a limited budget for courses..."
                  />
                </EditorWrapper>
                {errors.description && (
                  <Typography color="error" variant="caption">
                    {errors.description}
                  </Typography>
                )}
              </FieldContent>
            </FieldWrapper>

            <FieldWrapper>
              <FieldTipComponent
                title="Goal Category"
                description="Choose the best category for relevant resources and insights."
                tips={["Think primary focus area"]}
              />
              <FieldContent>
                <Typography variant="subtitle1" gutterBottom>
                  Category
                </Typography>
                <CategorySelector
                  value={formData.category}
                  onChange={handleCategoryChange}
                />
                {errors.category && (
                  <Typography color="error" variant="caption">
                    {errors.category}
                  </Typography>
                )}
              </FieldContent>
            </FieldWrapper>

            <FieldWrapper>
              <FieldTipComponent
                title="Deadline"
                description="Set realistic deadline with buffer time."
                tips={["Add ~20% buffer time", "Consider your experience level"]}
              />
              <FieldContent>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      fullWidth
                      label="Deadline"
                      name="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={handleInputChange}
                      error={!!errors.deadline}
                      helperText={errors.deadline}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{
                        min: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <FormControl fullWidth error={!!errors.network}>
                      <InputLabel>Network</InputLabel>
                      <Select
                        name="network"
                        value={formData.network}
                        onChange={handleSelectChange}
                        label="Network"
                      >
                        {SUPPORTED_NETWORKS.map(network => (
                          <MenuItem key={network} value={network}>
                            {network}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.network && (
                        <Typography color="error" variant="caption">
                          {errors.network}
                        </Typography>
                      )}
                    </FormControl>
                  </Box>
                </Box>
              </FieldContent>
            </FieldWrapper>

            <FieldWrapper>
              <FieldTipComponent
                title="Goal Image"
                description="Upload inspiring image representing your goal. Visualization boosts motivation and serves as daily reminder."
                tips={["Show your end result", "Use bright, positive imagery", "Avoid cluttered photos", "Think vision board style"]}
              />
              <FieldContent>
                <Typography variant="subtitle1" gutterBottom>
                  Image (Optional)
                </Typography>
                <ImageContainer>
                  <ImageLabel htmlFor="image">
                    {isCompressing ? 'Compressing Image...' : (selectedImage ? 'Change Image' : 'Select Image')}
                  </ImageLabel>
                  <ImageInput
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isCompressing}
                  />
                  {isCompressing && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="caption" color="text.secondary">
                        Optimizing image for upload...
                      </Typography>
                    </Box>
                  )}
                  {imagePreview && !isCompressing && (
                    <ImageEditor
                      imagePreview={imagePreview}
                      onImageEdited={handleImageEdited}
                    />
                  )}
                </ImageContainer>
                {errors.image && (
                  <Typography color="error" variant="caption">
                    {errors.image}
                  </Typography>
                )}
              </FieldContent>
            </FieldWrapper>

            <Box sx={{ 
              position: 'sticky', 
              bottom: 0, 
              backgroundColor: 'background.paper',
              p: 2,
              mt: 3,
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <Button
                type="submit"
                variant="contained"
                size="medium"
                disabled={isCreating}
                sx={{ 
                  minWidth: 'fit-content',
                  px: 3,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  backgroundColor: '#2196F3',
                }}
              >
                {isCreating ? 'Creating Goal...' : 'Create Goal'}
              </Button>
            </Box>
          </StyledForm>
        </StyledPaper>
      </Box>
    </Container>
  );
};

export default NewGoal;