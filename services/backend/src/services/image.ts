import sharp from 'sharp';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit (reduced from 5MB)
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export const compressImage = async (filePath: string): Promise<string> => {
  const outputPath = filePath + '.compressed.jpg';
  
  await sharp(filePath)
    .resize(800, 800, { // Reduced from 1200x1200 to 800x800
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ 
      quality: 80, // Reduced from 90 to 80
      mozjpeg: true 
    })
    .toFile(outputPath);

  // Delete original file
  fs.unlinkSync(filePath);

  return outputPath;
}; 