import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getGeneralStats,
  getUserStats,
  getTimeBasedStats
} from '../controllers/stats.js';

const router = express.Router();

// All stats routes require authentication and admin role
router.use(protect, authorize('ADMIN'));

router.get('/general', getGeneralStats);
router.get('/users', getUserStats);
router.get('/timeline', getTimeBasedStats);

export default router;
