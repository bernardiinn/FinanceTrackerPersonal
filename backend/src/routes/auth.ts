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

const router = Router();

// Auth routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', me);

// PIN and device management routes (require authentication)
router.post('/setup-pin', requireAuth, setupPin);
router.post('/login-pin', loginWithPin);
router.post('/trust-device', requireAuth, trustDevice);
router.get('/trusted-devices', requireAuth, getTrustedDevices);
router.post('/remove-device', requireAuth, removeTrustedDevice);
router.post('/disable-pin', requireAuth, disablePin);

export default router;
