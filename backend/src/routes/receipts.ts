import { Router } from 'express';
import { parseReceipt, checkOcrHealth, upload } from '../controllers/receiptController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All receipt routes require authentication
router.use(requireAuth);

// Parse receipt from uploaded image
router.post('/parse', upload.single('receipt'), parseReceipt);

// Health check for OCR functionality
router.get('/health', checkOcrHealth);

export default router;
