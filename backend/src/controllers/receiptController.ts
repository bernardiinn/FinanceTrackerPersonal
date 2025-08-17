import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
// OCR via tesseract.js (Python path fully removed)
import { parseReceiptImage, ensureOcrReady } from '../ocr/parseReceipt';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req: Request, _file: any, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = path.join(__dirname, '../uploads/receipts');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: any, cb: (error: Error | null, filename: string) => void) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `receipt-${uniqueSuffix}${extension}`);
  }
});

// File filter to only allow images
const fileFilter = (_req: any, file: any, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
  }
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Interface for parsed receipt data
interface ParsedReceiptData {
  success: boolean;
  error?: string;
  raw_text: string;
  merchant: string | null;
  total: number | null;
  date: string | null;
  all_amounts?: number[];
  warnings?: string[];
}

// Response interface preserved (warnings optional added downstream).

export const parseReceipt = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

  const uploaded = (req as any).file as any | undefined;
    if (!uploaded) {
      res.status(400).json({ error: 'No receipt image provided' });
      return;
    }
  const imagePath = uploaded.path;

    try {
  const parsedData: ParsedReceiptData = await parseReceiptImage(imagePath);

      // Clean up the uploaded file
      try {
        fs.unlinkSync(imagePath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file:', cleanupError);
      }

      if (!parsedData.success) {
        res.status(400).json({
          error: 'Failed to parse receipt',
          details: parsedData.error,
          raw_text: parsedData.raw_text
        });
        return;
      }

      // Return parsed data
      res.json({
        success: true,
        data: {
          merchant: parsedData.merchant,
          total: parsedData.total,
          date: parsedData.date,
          raw_text: parsedData.raw_text,
          suggestions: { all_amounts: parsedData.all_amounts || [] },
          warnings: parsedData.warnings || []
        }
      });

    } catch (execError: any) {
      console.error('Error executing OCR script:', execError);
      
      // Clean up the uploaded file
      try {
        fs.unlinkSync(imagePath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file:', cleanupError);
      }

      const isTimeout = /ETIME|timed out/i.test(execError?.message || '');
      res.status(500).json({
        error: isTimeout ? 'OCR timed out' : 'Failed to process receipt image',
        details: execError.message,
        suggestion: isTimeout ? 'Try a smaller or clearer image' : 'Ensure image is clear and readable.'
      });
    }

  } catch (error: any) {
    console.error('Error in parseReceipt controller:', error);
    
    // Clean up uploaded file if it exists
  const uploaded = (req as any).file as any | undefined;
  if (uploaded && uploaded.path) {
      try {
    fs.unlinkSync(uploaded.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file:', cleanupError);
      }
    }

    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Health check endpoint to verify OCR functionality
export const checkOcrHealth = async (_req: Request, res: Response): Promise<void> => {
  try {
    const ready = await ensureOcrReady();
    res.json({
      ocr_ready: ready,
      engine: 'tesseract.js',
      language: process.env.TESSERACT_LANG || 'eng'
    });
  } catch (error: any) {
    console.error('Error checking OCR health:', error);
    res.status(500).json({
      error: 'Failed to check OCR health',
      details: error.message
    });
  }
};
