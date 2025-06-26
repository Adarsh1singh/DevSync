const express = require('express');
const {
  createComment,
  getTaskComments,
  updateComment,
  deleteComment,
} = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');
const {
  handleValidationErrors,
} = require('../middleware/validation');
const { body, param } = require('express-validator');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/comments/task/:taskId
 * @desc    Create a new comment on a task
 * @access  Private
 */
router.post('/task/:taskId', [
  param('taskId').isUUID().withMessage('taskId must be a valid UUID'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content must be between 1 and 1000 characters'),
  handleValidationErrors,
], createComment);

/**
 * @route   GET /api/comments/task/:taskId
 * @desc    Get comments for a task
 * @access  Private
 */
router.get('/task/:taskId', [
  param('taskId').isUUID().withMessage('taskId must be a valid UUID'),
  handleValidationErrors,
], getTaskComments);

/**
 * @route   PUT /api/comments/:commentId
 * @desc    Update a comment
 * @access  Private (Comment author only)
 */
router.put('/:commentId', [
  param('commentId').isUUID().withMessage('commentId must be a valid UUID'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content must be between 1 and 1000 characters'),
  handleValidationErrors,
], updateComment);

/**
 * @route   DELETE /api/comments/:commentId
 * @desc    Delete a comment
 * @access  Private (Comment author, Admin, or Manager)
 */
router.delete('/:commentId', [
  param('commentId').isUUID().withMessage('commentId must be a valid UUID'),
  handleValidationErrors,
], deleteComment);

module.exports = router;
