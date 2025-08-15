import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/receipts');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `receipt-${uniqueSuffix}${extension}`);
  }
});

// File filter to only allow images
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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
}

export const parseReceipt = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No receipt image provided' });
      return;
    }

  const imagePath = req.file.path;
  const pythonScriptPath = path.join(__dirname, '../ocr/parseReceipt.py');

    try {
      // Check if Python script exists
      if (!fs.existsSync(pythonScriptPath)) {
        throw new Error('OCR script not found');
      }

      // Execute the Python OCR script
      // Choose python path cross-platform: prefer project .venv, else fallback to system python
      const venvPythonUnix = path.join(__dirname, '../../../.venv/bin/python');
      const venvPythonWin = path.join(__dirname, '..', '..', '..', '.venv', 'Scripts', 'python.exe');
      const isWindows = process.platform === 'win32';
      const candidate = isWindows ? venvPythonWin : venvPythonUnix;
      const pythonPath = fs.existsSync(candidate) ? candidate : (isWindows ? 'python' : 'python3');

      // Execute with timeout and hidden window on Windows
      const { stdout, stderr } = await execAsync(`"${pythonPath}" "${pythonScriptPath}" "${imagePath}"`, {
        timeout: 30000,
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024,
      });
      
      if (stderr) {
        console.warn('OCR Script stderr:', stderr);
      }

      // Parse the JSON output from Python script
      let parsedData: ParsedReceiptData;
      try {
        parsedData = JSON.parse(stdout);
      } catch (e) {
        throw new Error('Invalid OCR output format');
      }

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
          // Optional: include confidence indicators or alternative suggestions
          suggestions: {
            all_amounts: parsedData.all_amounts || [],
          }
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

      const isTimeout = execError?.killed || /ETIME|timed out/i.test(execError?.message || '');
      res.status(500).json({
        error: isTimeout ? 'OCR timed out' : 'Failed to process receipt image',
        details: execError.message,
        suggestion: isTimeout ? 'Try a smaller or clearer image' : 'Please ensure the image is clear and contains text'
      });
    }

  } catch (error: any) {
    console.error('Error in parseReceipt controller:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
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
    const pythonScriptPath = path.join(__dirname, '../ocr/parseReceipt.py');
    
    // Check if script exists
    const scriptExists = fs.existsSync(pythonScriptPath);
    
    // Check if Python and required packages are available
    let pythonAvailable = false;
    let packagesAvailable = false;
    
    try {
      const pythonPath = path.join(__dirname, '../../../.venv/bin/python');
      await execAsync(`"${pythonPath}" --version`);
      pythonAvailable = true;
      
      // Try to import required packages
      await execAsync(`"${pythonPath}" -c "import cv2, pytesseract; print(\\"OK\\")"`);
      packagesAvailable = true;
    } catch (checkError) {
      console.warn('Python/package check failed:', checkError);
    }

    res.json({
      ocr_ready: scriptExists && pythonAvailable && packagesAvailable,
      script_exists: scriptExists,
      python_available: pythonAvailable,
      packages_available: packagesAvailable,
      requirements: [
        'python3',
        'opencv-python (cv2)',
        'pytesseract',
        'tesseract-ocr (system package)'
      ]
    });
  } catch (error: any) {
    console.error('Error checking OCR health:', error);
    res.status(500).json({
      error: 'Failed to check OCR health',
      details: error.message
    });
  }
};
