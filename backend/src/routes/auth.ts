import { Router } from 'express';
import { 
  signup, 
  login, 
  logout, 
  me, 
  setupPin, 
  loginWithPin, 
  trustDevice, 
  getTrustedDevices, 
  removeTrustedDevice, 
  disablePin,
  requireAuth 
} from '../controllers/authController';
import { limitLogin, limitPin } from '../middleware/security';

const router = Router();

// Auth routes
router.post('/signup', signup);
router.post('/login', limitLogin, login);
router.post('/logout', logout);
router.get('/me', me);

// PIN and device management routes (require authentication)
router.post('/setup-pin', requireAuth, setupPin);
router.post('/login-pin', limitPin, loginWithPin);
router.post('/trust-device', requireAuth, trustDevice);
router.get('/trusted-devices', requireAuth, getTrustedDevices);
router.post('/remove-device', requireAuth, removeTrustedDevice);
router.post('/disable-pin', requireAuth, disablePin);

export default router;
