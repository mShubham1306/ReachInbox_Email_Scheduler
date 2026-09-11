import { Router } from 'express';
import { campaignController } from '../controllers/campaignController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

// Campaigns
router.get('/campaigns', campaignController.getAll);
router.get('/campaigns/:id', campaignController.getById);

// Senders
router.get('/senders', campaignController.getSenders);
router.post('/senders', campaignController.createSender);

export default router;
