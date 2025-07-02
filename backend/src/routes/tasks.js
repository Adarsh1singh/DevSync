const express = require('express');
const {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getUserTasks,
} = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');
const {
  handleValidationErrors,
} = require('../middleware/validation');
const { body, query, param } = require('express-validator');

// Custom CUID validator
const isCuid = (value) => {
  return /^c[a-z0-9]{24}$/.test(value);
};

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private
 */
router.post('/', [
  body('projectId')
    .custom(isCuid)
    .withMessage('Project ID must be a valid ID'),
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Task title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Priority must be LOW, MEDIUM, HIGH, or URGENT'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('assigneeId')
    .optional()
    .custom(isCuid)
    .withMessage('Assignee ID must be a valid ID'),
  handleValidationErrors,
], createTask);

/**
 * @route   GET /api/tasks/user
 * @desc    Get user's assigned tasks with filters
 * @access  Private
 */
router.get('/user', [
  query('status')
    .optional()
    .isIn(['TODO', 'IN_PROGRESS', 'DONE'])
    .withMessage('Status must be TODO, IN_PROGRESS, or DONE'),
  query('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Priority must be LOW, MEDIUM, HIGH, or URGENT'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must not exceed 100 characters'),
  query('projectId')
    .optional()
    .custom(isCuid)
    .withMessage('Project ID must be a valid ID'),
  query('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  handleValidationErrors,
], getUserTasks);

/**
 * @route   GET /api/tasks/project/:projectId
 * @desc    Get tasks for a project
 * @access  Private
 */
router.get('/project/:projectId', [
  param('projectId').custom(isCuid).withMessage('projectId must be a valid ID'),
  query('status')
    .optional()
    .isIn(['TODO', 'IN_PROGRESS', 'DONE'])
    .withMessage('Status must be TODO, IN_PROGRESS, or DONE'),
  query('assigneeId')
    .optional()
    .custom(isCuid)
    .withMessage('Assignee ID must be a valid ID'),
  query('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Priority must be LOW, MEDIUM, HIGH, or URGENT'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must not exceed 100 characters'),
  query('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  handleValidationErrors,
], getProjectTasks);

/**
 * @route   GET /api/tasks/:taskId
 * @desc    Get task by ID
 * @access  Private
 */
router.get('/:taskId', [
  param('taskId').custom(isCuid).withMessage('taskId must be a valid ID'),
  handleValidationErrors,
], getTaskById);

/**
 * @route   PUT /api/tasks/:taskId
 * @desc    Update task
 * @access  Private
 */
router.put('/:taskId', [
  param('taskId').custom(isCuid).withMessage('taskId must be a valid ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Task title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('status')
    .optional()
    .isIn(['TODO', 'IN_PROGRESS', 'DONE'])
    .withMessage('Status must be TODO, IN_PROGRESS, or DONE'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Priority must be LOW, MEDIUM, HIGH, or URGENT'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('assigneeId')
    .optional()
    .custom(isCuid)
    .withMessage('Assignee ID must be a valid ID'),
  handleValidationErrors,
], updateTask);

/**
 * @route   DELETE /api/tasks/:taskId
 * @desc    Delete task
 * @access  Private
 */
router.delete('/:taskId', [
  param('taskId').custom(isCuid).withMessage('taskId must be a valid ID'),
  handleValidationErrors,
], deleteTask);

// Comment routes
const {
  getTaskComments,
  createTaskComment,
  deleteTaskComment,
} = require('../controllers/commentController');

/**
 * @route   GET /api/tasks/:taskId/comments
 * @desc    Get comments for a task
 * @access  Private
 */
router.get('/:taskId/comments', [
  param('taskId').custom(isCuid).withMessage('taskId must be a valid ID'),
  handleValidationErrors,
], getTaskComments);

/**
 * @route   POST /api/tasks/:taskId/comments
 * @desc    Create a comment on a task
 * @access  Private
 */
router.post('/:taskId/comments', [
  param('taskId').custom(isCuid).withMessage('taskId must be a valid ID'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content must be between 1 and 1000 characters'),
  handleValidationErrors,
], createTaskComment);

/**
 * @route   DELETE /api/tasks/:taskId/comments/:commentId
 * @desc    Delete a comment
 * @access  Private
 */
router.delete('/:taskId/comments/:commentId', [
  param('taskId').custom(isCuid).withMessage('taskId must be a valid ID'),
  param('commentId').custom(isCuid).withMessage('commentId must be a valid ID'),
  handleValidationErrors,
], deleteTaskComment);

// Label assignment routes
const {
  assignLabelToTask,
  removeLabelFromTask,
} = require('../controllers/taskLabelController');

/**
 * @route   POST /api/tasks/:taskId/labels/:labelId
 * @desc    Assign a label to a task
 * @access  Private
 */
router.post('/:taskId/labels/:labelId', [
  param('taskId').custom(isCuid).withMessage('taskId must be a valid ID'),
  param('labelId').custom(isCuid).withMessage('labelId must be a valid ID'),
  handleValidationErrors,
], assignLabelToTask);

/**
 * @route   DELETE /api/tasks/:taskId/labels/:labelId
 * @desc    Remove a label from a task
 * @access  Private
 */
router.delete('/:taskId/labels/:labelId', [
  param('taskId').custom(isCuid).withMessage('taskId must be a valid ID'),
  param('labelId').custom(isCuid).withMessage('labelId must be a valid ID'),
  handleValidationErrors,
], removeLabelFromTask);

// Analytics routes
const {
  getTaskAnalytics,
  getProjectTaskAnalytics,
} = require('../controllers/taskAnalyticsController');

/**
 * @route   GET /api/tasks/analytics
 * @desc    Get task analytics for the user
 * @access  Private
 */
router.get('/analytics', [
  query('period')
    .optional()
    .isIn(['week', 'month', 'quarter', 'year'])
    .withMessage('Period must be week, month, quarter, or year'),
  query('projectId')
    .optional()
    .custom(isCuid)
    .withMessage('Project ID must be a valid ID'),
  handleValidationErrors,
], getTaskAnalytics);

/**
 * @route   GET /api/tasks/project/:projectId/analytics
 * @desc    Get task analytics for a specific project
 * @access  Private
 */
router.get('/project/:projectId/analytics', [
  param('projectId').custom(isCuid).withMessage('projectId must be a valid ID'),
  query('period')
    .optional()
    .isIn(['week', 'month', 'quarter', 'year'])
    .withMessage('Period must be week, month, quarter, or year'),
  handleValidationErrors,
], getProjectTaskAnalytics);

module.exports = router;
