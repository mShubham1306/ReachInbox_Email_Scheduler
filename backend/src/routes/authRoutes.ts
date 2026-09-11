import { Router } from 'express';
import { authController } from '../controllers/authController';

const router = Router();

// OAuth endpoints
router.get('/google/status', authController.getGoogleStatus);
router.post('/google/configure', authController.configureGoogle);
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

// Dev login for local testing without Google credentials
router.post('/dev-login', authController.devLogin);

// Me & Logout
router.get('/me', authController.getMe);
router.post('/logout', authController.logout);

export default router;
