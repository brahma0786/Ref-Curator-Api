import Comment from '../models/Comment.js';
import { validationResult } from 'express-validator';

export const createComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const commentData = {
      ...req.body,
      userId: req.user._id
    };
    
    const comment = await Comment.create(commentData);
    await comment.populate('userId', 'name email');
    
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getComments = async (req, res) => {
  try {
    const { category, status } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    
    if (req.user.role !== 'ADMIN') {
      filter.userId = req.user._id;
    }
    
    const comments = await Comment.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate('subComments.userId', 'name email');
      
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCommentById = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('subComments.userId', 'name email');
      
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.userId._id.toString() !== req.user._id.toString() && 
        req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.userId.toString() !== req.user._id.toString() && 
        req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    )
    .populate('userId', 'name email')
    .populate('subComments.userId', 'name email');

    res.json(updatedComment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.userId.toString() !== req.user._id.toString() && 
        req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await comment.remove();
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addSubComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    comment.subComments.push({
      content: req.body.content,
      userId: req.user._id
    });

    await comment.save();
    await comment.populate('subComments.userId', 'name email');

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSubComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const subComment = comment.subComments.id(req.params.subCommentId);
    if (!subComment) {
      return res.status(404).json({ error: 'Sub-comment not found' });
    }

    if (subComment.userId.toString() !== req.user._id.toString() && 
        req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    subComment.content = req.body.content;
    subComment.updatedAt = Date.now();

    await comment.save();
    await comment.populate('subComments.userId', 'name email');

    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteSubComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const subComment = comment.subComments.id(req.params.subCommentId);
    if (!subComment) {
      return res.status(404).json({ error: 'Sub-comment not found' });
    }

    if (subComment.userId.toString() !== req.user._id.toString() && 
        req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    comment.subComments.pull(req.params.subCommentId);
    await comment.save();

    res.json({ message: 'Sub-comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await Comment.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          openIssues: {
            $sum: { $cond: [{ $eq: ['$status', 'OPEN'] }, 1, 0] }
          },
          resolvedIssues: {
            $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] }
          },
          totalSubComments: { $sum: { $size: '$subComments' } }
        }
      }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
