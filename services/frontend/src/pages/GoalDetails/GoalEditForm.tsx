import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { GoalStatus, GoalCategory } from '../../types/goals';
import CategorySelector from '../../components/CategorySelector';
import { MDXEditor } from '@mdxeditor/editor';
import { headingsPlugin, listsPlugin, quotePlugin, thematicBreakPlugin, markdownShortcutPlugin, linkPlugin, linkDialogPlugin, imagePlugin, tablePlugin, codeBlockPlugin, codeMirrorPlugin, directivesPlugin, frontmatterPlugin, diffSourcePlugin, toolbarPlugin, UndoRedo, BoldItalicUnderlineToggles, CodeToggle, CreateLink, InsertImage, InsertTable, InsertThematicBreak, ListsToggle, Separator } from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { ImageEditor } from '../NewGoal/ImageEditor';
import { config } from '@/config';
import { compressImage, needsCompression, isValidImage } from '../../utils/imageCompression';

const EditForm = styled.div`
  background: #f5f5f5;
  padding: 2rem;
  border-radius: 8px;
  margin-top: 1rem;
  position: relative;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Form = styled.form<{ hasSticky: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: ${props => props.hasSticky ? '80px' : '0'};
  transition: padding-bottom 0.3s ease;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
`;

const Label = styled.label`
  font-weight: 500;
  color: #666;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-height: 80px;
  resize: vertical;
`;

const CharacterCounter = styled.div`
  font-size: 0.75rem;
  color: #666;
  text-align: right;
  margin-top: 0.25rem;
`;

const CharacterCounterWarning = styled(CharacterCounter)`
  color: #f57c00;
`;

const CharacterCounterError = styled(CharacterCounter)`
  color: #d32f2f;
`;

const ButtonGroup = styled.div<{ 
  isSticky: boolean; 
  stickyLeft: number; 
}>`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  
  ${props => props.isSticky ? `
    position: fixed;
    bottom: 0;
    left: 320px;
    width: 100%;
    padding: 1.25rem 3rem;
    background: white;
    border-top: 1px solid #e0e0e0;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    box-sizing: border-box;
    
    @media (max-width: 768px) {
      gap: 0.5rem;
      padding: 0.75rem;
      left: 0;
      width: 100vw;
    }
  ` : `
    position: static;
    padding: 0;
    background: transparent;
    border: none;
    box-shadow: none;
  `}
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  background-color: ${props => {
    switch (props.variant) {
      case 'secondary':
        return '#9e9e9e';
      case 'danger':
        return '#f44336';
      default:
        return '#2196F3';
    }
  }};
  color: white;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #f44336;
  margin-top: 1rem;
  padding: 0.5rem;
  background: #ffebee;
  border-radius: 4px;
`;

const RestrictionMessage = styled.div`
  color: #f57c00;
  margin-top: 1rem;
  padding: 1rem;
  background: #fff3e0;
  border: 1px solid #ffb74d;
  border-radius: 4px;
  text-align: center;
  font-weight: 500;
`;

const PreviewSection = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const PreviewLabel = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #666;
`;

const EditorWrapper = styled.div`
  & .mdxeditor {
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #ffffff;
  }
  
  & .mdxeditor-toolbar {
    border-bottom: 1px solid #ddd;
    background-color: #f5f5f5;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }
  
  & .mdxeditor-root-contenteditable {
    background-color: #ffffff;
    padding: 12px;
  }

  [data-color-mode='light'] {
    --color-canvas-default: #ffffff;
    --color-border-default: #d0d7de;
  }
`;

const ImageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ImageInput = styled.input`
  display: none;
`;

const ImageLabel = styled.label`
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #e0e0e0;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

interface FormData {
  title: string;
  description: string;
  status: GoalStatus;
  category: GoalCategory;
  image?: File | string;
  weeklyTimeCommitment?: number;
  currentExperience?: string;
  availableResources?: string;
  startingPoint?: string;
}

interface GoalEditFormProps {
  initialData: FormData;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  error?: string;
  goalId: number;
  difficulty?: string;
}

const GoalEditForm: React.FC<GoalEditFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel, 
  error,
  goalId,
  difficulty 
}) => {
  const [formData, setFormData] = React.useState<FormData>(initialData);
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [isNewImage, setIsNewImage] = React.useState(false);
  const [isCompressing, setIsCompressing] = React.useState(false);
  const [isButtonsSticky, setIsButtonsSticky] = React.useState(false);
  const [stickyStyles, setStickyStyles] = React.useState<{
    left: number;
  }>({ left: 0 });
  const buttonGroupRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const TITLE_MAX_LENGTH = 150;
  const titleLength = formData.title.length;
  const titleRemaining = TITLE_MAX_LENGTH - titleLength;

  React.useEffect(() => {
    if (initialData.image) {
      setImagePreview(`${config.backendUrl}/${initialData.image}`);
    }
  }, [initialData.image]);

  React.useEffect(() => {
    const handleScroll = () => {
      if (buttonGroupRef.current && formRef.current) {
        const buttonGroupRect = buttonGroupRef.current.getBoundingClientRect();
        const formRect = formRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Make buttons sticky when they would be below the visible area
        // Add some buffer (80px) so they stick before completely disappearing
        const shouldBeSticky = buttonGroupRect.bottom > windowHeight - 80;
        
        setIsButtonsSticky(shouldBeSticky);
        
        // Update sticky positioning to match form width and position
        if (shouldBeSticky) {
          setStickyStyles({
            left: formRect.left - 50,
          });
        }
      }
    };

    // Use throttling to improve performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    
    // Initial check
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate title length
    if (formData.title.length > TITLE_MAX_LENGTH) {
      return; // Don't submit if title is too long
    }
    
    const dataToSubmit = {
      ...formData,
      image: selectedImage || formData.image
    };
    onSubmit(dataToSubmit);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'weeklyTimeCommitment' ? (value ? parseInt(value, 10) : undefined) : value
    }));
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDescriptionChange = (value?: string) => {
    setFormData(prev => ({
      ...prev,
      description: value || ''
    }));
  };

  const handleCategoryChange = (category: GoalCategory) => {
    setFormData(prev => ({
      ...prev,
      category
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate that it's an image file
      if (!isValidImage(file)) {
        alert('Please select a valid image file');
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
          setIsNewImage(true);
          setIsCompressing(false);
        };
        reader.readAsDataURL(processedFile);
      } catch (error) {
        console.error('Error processing image:', error);
        alert('Failed to process image. Please try again.');
        setIsCompressing(false);
      }
    }
  };

  const handleImageEdited = (file: File) => {
    setSelectedImage(file);
    setFormData(prev => ({
      ...prev,
      image: file
    }));
  };

  return (
    <EditForm>
      <Form ref={formRef} hasSticky={isButtonsSticky} onSubmit={handleSubmit}>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        {/* Show restriction message for MEDIUM+ difficulties */}
        {(difficulty === 'MEDIUM' || difficulty === 'HARD' || difficulty === 'HARDCORE') && (
          <RestrictionMessage>
            ⚠️ Goals with {difficulty} difficulty cannot be edited. Please contact an administrator for changes.
          </RestrictionMessage>
        )}
        <FormGroup>
          <Label>Title</Label>
          <Input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            maxLength={TITLE_MAX_LENGTH}
            required
          />
          {titleLength > 0 && (
            titleRemaining <= 0 ? (
              <CharacterCounterError>
                Character limit exceeded ({titleLength}/{TITLE_MAX_LENGTH})
              </CharacterCounterError>
            ) : titleRemaining <= 20 ? (
              <CharacterCounterWarning>
                {titleRemaining} characters remaining
              </CharacterCounterWarning>
            ) : (
              <CharacterCounter>
                {titleRemaining} characters remaining
              </CharacterCounter>
            )
          )}
        </FormGroup>
        <FormGroup>
          <Label>Description</Label>
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
            />
          </EditorWrapper>
        </FormGroup>
        <FormGroup>
          <Label>Category</Label>
          <CategorySelector
            value={formData.category}
            onChange={handleCategoryChange}
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Image</Label>
          <ImageContainer>
            {!isNewImage && initialData?.image && (
              <img
                src={`${config.backendUrl}/${initialData.image}`}
                alt="Current goal"
                style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
              />
            )}
            <ImageLabel htmlFor="image">
              {isCompressing ? 'Compressing Image...' : (isNewImage ? 'Change Image' : 'Upload New Image')}
            </ImageLabel>
            <ImageInput
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isCompressing}
            />
            {isCompressing && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                marginTop: '0.5rem',
                fontSize: '0.875rem',
                color: '#666'
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #f3f3f3',
                  borderTop: '2px solid #2196F3',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span>Optimizing image for upload...</span>
              </div>
            )}
            {isNewImage && imagePreview && !isCompressing && (
              <ImageEditor
                imagePreview={imagePreview}
                onImageEdited={handleImageEdited}
              />
            )}
          </ImageContainer>
        </FormGroup>
        <ButtonGroup 
          ref={buttonGroupRef} 
          isSticky={isButtonsSticky}
          stickyLeft={stickyStyles.left}
        >
          <Button 
            type="submit" 
            disabled={difficulty === 'MEDIUM' || difficulty === 'HARD' || difficulty === 'HARDCORE'}
          >
            Save
          </Button>
          <Button type="button" onClick={onCancel}>
            Cancel
          </Button>
        </ButtonGroup>
      </Form>
    </EditForm>
  );
};

export default GoalEditForm; 