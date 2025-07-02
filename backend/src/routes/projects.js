const express = require('express');
const {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  getProjectActivity,
} = require('../controllers/projectController');
const { authenticate } = require('../middleware/auth');
const {
  validateProjectCreation,
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
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private
 */
router.post('/', validateProjectCreation, createProject);

/**
 * @route   GET /api/projects
 * @desc    Get all projects for the current user
 * @access  Private
 */
router.get('/', [
  query('teamId')
    .optional()
    .custom(isCuid)
    .withMessage('Team ID must be a valid ID'),
  handleValidationErrors,
], getUserProjects);

/**
 * @route   GET /api/projects/:projectId
 * @desc    Get project by ID
 * @access  Private
 */
router.get('/:projectId', [
  param('projectId').custom(isCuid).withMessage('projectId must be a valid ID'),
  handleValidationErrors,
], getProjectById);

/**
 * @route   PUT /api/projects/:projectId
 * @desc    Update project
 * @access  Private (Project Admin/Manager only)
 */
router.put('/:projectId', [
  param('projectId').custom(isCuid).withMessage('projectId must be a valid ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Project name must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  handleValidationErrors,
], updateProject);

/**
 * @route   DELETE /api/projects/:projectId
 * @desc    Delete project
 * @access  Private (Project Admin/Lead or Team Admin only)
 */
router.delete('/:projectId', [
  param('projectId').custom(isCuid).withMessage('projectId must be a valid ID'),
  handleValidationErrors,
], deleteProject);

/**
 * @route   POST /api/projects/:projectId/members
 * @desc    Add member to project
 * @access  Private (Project Admin/Manager only)
 */
router.post('/:projectId/members', [
  param('projectId').custom(isCuid).withMessage('projectId must be a valid ID'),
  body('userId')
    .custom(isCuid)
    .withMessage('User ID must be a valid ID'),
  body('role')
    .optional()
    .isIn(['ADMIN', 'MANAGER', 'DEVELOPER'])
    .withMessage('Role must be ADMIN, MANAGER, or DEVELOPER'),
  handleValidationErrors,
], addProjectMember);

/**
 * @route   DELETE /api/projects/:projectId/members/:memberId
 * @desc    Remove member from project
 * @access  Private (Project Admin/Manager only)
 */
router.delete('/:projectId/members/:memberId', [
  param('projectId').custom(isCuid).withMessage('projectId must be a valid ID'),
  param('memberId').custom(isCuid).withMessage('memberId must be a valid ID'),
  handleValidationErrors,
], removeProjectMember);

/**
 * @route   GET /api/projects/:projectId/activity
 * @desc    Get project activity
 * @access  Private (Project Member only)
 */
router.get('/:projectId/activity', [
  param('projectId').custom(isCuid).withMessage('projectId must be a valid ID'),
  handleValidationErrors,
], getProjectActivity);

// Label routes
const {
  getProjectLabels,
  createProjectLabel,
  deleteProjectLabel,
} = require('../controllers/labelController');

/**
 * @route   GET /api/projects/:projectId/labels
 * @desc    Get labels for a project
 * @access  Private (Project Member only)
 */
router.get('/:projectId/labels', [
  param('projectId').custom(isCuid).withMessage('projectId must be a valid ID'),
  handleValidationErrors,
], getProjectLabels);

/**
 * @route   POST /api/projects/:projectId/labels
 * @desc    Create a label for a project
 * @access  Private (Project Admin/Manager only)
 */
router.post('/:projectId/labels', [
  param('projectId').custom(isCuid).withMessage('projectId must be a valid ID'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Label name must be between 1 and 50 characters'),
  body('color')
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color'),
  handleValidationErrors,
], createProjectLabel);

/**
 * @route   DELETE /api/projects/:projectId/labels/:labelId
 * @desc    Delete a project label
 * @access  Private (Project Admin/Manager only)
 */
router.delete('/:projectId/labels/:labelId', [
  param('projectId').custom(isCuid).withMessage('projectId must be a valid ID'),
  param('labelId').custom(isCuid).withMessage('labelId must be a valid ID'),
  handleValidationErrors,
], deleteProjectLabel);

module.exports = router;
