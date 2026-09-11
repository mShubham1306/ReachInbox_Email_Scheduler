import { Router } from 'express';
import multer from 'multer';
import { emailController, scheduleEmailSchema } from '../controllers/emailController';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

// Protect all email endpoints with authentication
router.use(authenticate);

router.post('/schedule', validate(scheduleEmailSchema), emailController.schedule);
router.post('/send-test', emailController.sendTestEmail);
router.get('/scheduled', emailController.getScheduled);
router.get('/sent', emailController.getSent);
router.get('/search', emailController.search);
router.get('/:id', emailController.getById);
router.post('/parse-leads', upload.single('file'), emailController.parseLeads);

export default router;
