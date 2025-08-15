import { Router } from 'express';
import { parseReceipt, checkOcrHealth, upload } from '../controllers/receiptController';
import { limitPin } from '../middleware/security';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All receipt routes require authentication
router.use(requireAuth);

// Parse receipt from uploaded image
// Reuse a limiter (20/15min per IP) to throttle OCR calls; adjust if needed later
router.post('/parse', limitPin, upload.single('receipt'), parseReceipt);

// Health check for OCR functionality
router.get('/health', checkOcrHealth);

export default router;
