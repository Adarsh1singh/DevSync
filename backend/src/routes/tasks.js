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
    .isUUID()
    .withMessage('Project ID must be a valid UUID'),
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
    .isUUID()
    .withMessage('Assignee ID must be a valid UUID'),
  handleValidationErrors,
], createTask);

/**
 * @route   GET /api/tasks
 * @desc    Get user's assigned tasks
 * @access  Private
 */
router.get('/', [
  query('status')
    .optional()
    .isIn(['TODO', 'IN_PROGRESS', 'DONE'])
    .withMessage('Status must be TODO, IN_PROGRESS, or DONE'),
  query('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Priority must be LOW, MEDIUM, HIGH, or URGENT'),
  handleValidationErrors,
], getUserTasks);

/**
 * @route   GET /api/tasks/project/:projectId
 * @desc    Get tasks for a project
 * @access  Private
 */
router.get('/project/:projectId', [
  param('projectId').isUUID().withMessage('projectId must be a valid UUID'),
  query('status')
    .optional()
    .isIn(['TODO', 'IN_PROGRESS', 'DONE'])
    .withMessage('Status must be TODO, IN_PROGRESS, or DONE'),
  query('assigneeId')
    .optional()
    .isUUID()
    .withMessage('Assignee ID must be a valid UUID'),
  query('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Priority must be LOW, MEDIUM, HIGH, or URGENT'),
  handleValidationErrors,
], getProjectTasks);

/**
 * @route   GET /api/tasks/:taskId
 * @desc    Get task by ID
 * @access  Private
 */
router.get('/:taskId', [
  param('taskId').isUUID().withMessage('taskId must be a valid UUID'),
  handleValidationErrors,
], getTaskById);

/**
 * @route   PUT /api/tasks/:taskId
 * @desc    Update task
 * @access  Private
 */
router.put('/:taskId', [
  param('taskId').isUUID().withMessage('taskId must be a valid UUID'),
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
    .isUUID()
    .withMessage('Assignee ID must be a valid UUID'),
  handleValidationErrors,
], updateTask);

/**
 * @route   DELETE /api/tasks/:taskId
 * @desc    Delete task
 * @access  Private
 */
router.delete('/:taskId', [
  param('taskId').isUUID().withMessage('taskId must be a valid UUID'),
  handleValidationErrors,
], deleteTask);

module.exports = router;
