const express = require('express');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { query, param } = require('express-validator');

// Custom CUID validator
const isCuid = (value) => {
  return /^c[a-z0-9]{24}$/.test(value);
};

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  query('unreadOnly')
    .optional()
    .isBoolean()
    .withMessage('unreadOnly must be a boolean'),
  handleValidationErrors,
], getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', getUnreadCount);

/**
 * @route   PUT /api/notifications/:notificationId/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:notificationId/read', [
  param('notificationId').custom(isCuid).withMessage('notificationId must be a valid ID'),
  handleValidationErrors,
], markAsRead);

/**
 * @route   PUT /api/notifications/mark-all-read
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/mark-all-read', markAllAsRead);

module.exports = router;
