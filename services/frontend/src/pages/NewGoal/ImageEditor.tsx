import { useState, useRef } from 'react';
import styled from 'styled-components';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { compressImage, formatFileSize } from '../../utils/imageCompression';

const ImageEditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
`;

const ImageInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #666;
`;

interface ImageEditorProps {
  imagePreview: string;
  onImageEdited: (file: File) => void;
}

export const ImageEditor = ({ imagePreview, onImageEdited }: ImageEditorProps) => {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5
  });
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const [imageSize, setImageSize] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop({
      unit: '%',
      width: 90,
      height: 90,
      x: 5,
      y: 5
    });
  };

  const handleCropComplete = (crop: Crop) => {
    setCompletedCrop(crop);
    getEditedImage();
  };

  const getEditedImage = async () => {
    if (!completedCrop || !previewCanvasRef.current || !imgRef.current) {
      return;
    }

    const canvas = previewCanvasRef.current;
    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );

    canvas.toBlob(async (blob) => {
      if (!blob) {
        throw new Error('Canvas is empty');
      }
      
      // Create initial file from blob
      const initialFile = new File([blob], 'edited-image.jpg', { type: 'image/jpeg' });
      
      try {
        // Compress the image to reduce size
        const compressedFile = await compressImage(initialFile, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.7, // Reduced quality for smaller file size
          format: 'jpeg'
        });
        
        // Update size information
        setImageSize(formatFileSize(compressedFile.size));
        
        // Pass the compressed file to parent
        onImageEdited(compressedFile);
      } catch (error) {
        console.error('Image compression failed:', error);
        // Fallback to original file if compression fails
        onImageEdited(initialFile);
      }
    }, 'image/jpeg', 0.8); // Reduced quality from 0.95 to 0.8
  };

  return (
    <ImageEditorContainer>
      <ReactCrop
        crop={crop}
        onChange={c => setCrop(c)}
        onComplete={handleCropComplete}
      >
        <img
          ref={imgRef}
          src={imagePreview}
          onLoad={onImageLoad}
          alt="Preview"
          style={{ maxWidth: '100%' }}
        />
      </ReactCrop>
      {imageSize && (
        <ImageInfo>
          <span>Image size: {imageSize}</span>
          <span>Optimized for web</span>
        </ImageInfo>
      )}
      <canvas
        ref={previewCanvasRef}
        style={{ display: 'none' }}
      />
    </ImageEditorContainer>
  );
}; 