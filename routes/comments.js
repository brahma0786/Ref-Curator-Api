import express from 'express';
import { check } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import {
  createComment,
  getComments,
  getCommentById,
  updateComment,
  deleteComment,
  addSubComment,
  updateSubComment,
  deleteSubComment,
  getStats
} from '../controllers/comments.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post([
    check('title', 'Title is required').not().isEmpty().trim().isLength({ max: 200 }),
    check('description', 'Description is required').not().isEmpty().trim(),
    check('category', 'Valid category is required').isIn([
      'GENERAL_FEEDBACK',
      'FEATURE_REQUEST',
      'INTEGRATION',
      'BUG_REPORT'
    ])
  ], createComment)
  .get(getComments);

router.get('/stats', authorize('ADMIN'), getStats);

router.route('/:id')
  .get(getCommentById)
  .patch([
    check('title', 'Title cannot exceed 200 characters').optional().trim().isLength({ max: 200 }),
    check('description', 'Description is required if provided').optional().trim().not().isEmpty()
  ], updateComment)
  .delete(deleteComment);

router.route('/:commentId/subcomments')
  .post([
    check('content', 'Content is required').not().isEmpty().trim()
  ], addSubComment);

router.route('/:commentId/subcomments/:subCommentId')
  .patch([
    check('content', 'Content is required').not().isEmpty().trim()
  ], updateSubComment)
  .delete(deleteSubComment);

export default router;
