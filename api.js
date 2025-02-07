import Comment, { CommentCategory } from './models/Comment.js';
import dotenv from 'dotenv';

dotenv.config();

export const adminEmail = process.env.ADMIN_EMAIL;
export const adminName = process.env.ADMIN_NAME;
export const AppName = 'TG Feedbacks';

export const createComment = async (commentData) => {
  try {
    const comment = new Comment(commentData);
    return await comment.save();
  } catch (error) {
    console.error("Error creating comment:", error);
    throw error;
  }
};

export const getComments = async (filter = {}) => {
  try {
    return await Comment.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate('subComments.userId', 'name email');
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw error;
  }
};

export const getCommentsByCategory = async (filter) => {
  try {
    return await Comment.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate('subComments.userId', 'name email');
  } catch (error) {
    console.error("Error fetching comments by category:", error);
    throw error;
  }
};

export const getCommentById = async (id) => {
  try {
    return await Comment.findById(id)
      .populate('userId', 'name email')
      .populate('subComments.userId', 'name email');
  } catch (error) {
    console.error("Error fetching comment:", error);
    throw error;
  }
};

export const updateComment = async (id, updateData) => {
  try {
    updateData.updatedAt = new Date();
    return await Comment.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    )
    .populate('userId', 'name email')
    .populate('subComments.userId', 'name email');
  } catch (error) {
    console.error("Error updating comment:", error);
    throw error;
  }
};

export const deleteComment = async (id) => {
  try {
    return await Comment.findByIdAndDelete(id);
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
};

export const addSubComment = async (commentId, subCommentData) => {
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('Comment not found');

    comment.subComments.push(subCommentData);
    await comment.save();

    return await comment.populate('subComments.userId', 'name email');
  } catch (error) {
    console.error("Error adding sub-comment:", error);
    throw error;
  }
};

export const updateSubComment = async (commentId, subCommentId, updateData) => {
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('Comment not found');

    const subComment = comment.subComments.id(subCommentId);
    if (!subComment) throw new Error('Sub-comment not found');

    Object.assign(subComment, { ...updateData, updatedAt: new Date() });
    await comment.save();

    return await comment.populate('subComments.userId', 'name email');
  } catch (error) {
    console.error("Error updating sub-comment:", error);
    throw error;
  }
};

export const deleteSubComment = async (commentId, subCommentId) => {
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('Comment not found');

    comment.subComments.pull(subCommentId);
    return await comment.save();
  } catch (error) {
    console.error("Error deleting sub-comment:", error);
    throw error;
  }
};

export const getCommentStats = async () => {
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
    return stats;
  } catch (error) {
    console.error("Error getting comment stats:", error);
    throw error;
  }
};
