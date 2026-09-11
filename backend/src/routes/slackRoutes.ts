import { Router } from 'express';
import { slackController } from '../controllers/slackController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// OAuth initiation and callback (callback happens via redirect from Slack)
router.get('/connect', authenticate, slackController.connect);
router.get('/callback', slackController.callback);

// Management
router.get('/status', authenticate, slackController.getStatus);
router.post('/disconnect', authenticate, slackController.disconnect);

export default router;
