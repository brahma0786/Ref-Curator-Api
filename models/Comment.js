import mongoose from 'mongoose';

const CommentCategory = {
  GENERAL_FEEDBACK: 'GENERAL_FEEDBACK',
  FEATURE_REQUEST: 'FEATURE_REQUEST',
  INTEGRATION: 'INTEGRATION',
  BUG_REPORT: 'BUG_REPORT'
};

const subCommentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const commentSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxLength: 200
  },
  description: { 
    type: String, 
    required: true,
    trim: true
  },
  recordId: { type: String, required: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: Object.values(CommentCategory),
    required: true,
    default: CommentCategory.GENERAL_FEEDBACK
  },
  status: {
    type: String,
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
    default: 'OPEN'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  metadata: {
    browser: String,
    os: String,
    version: String
  },
  subComments: [subCommentSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export { CommentCategory };
export default mongoose.model('Comment', commentSchema);
