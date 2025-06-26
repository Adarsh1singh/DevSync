const express = require('express');
const {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  addProjectMember,
  removeProjectMember,
} = require('../controllers/projectController');
const { authenticate } = require('../middleware/auth');
const {
  validateProjectCreation,
  handleValidationErrors,
} = require('../middleware/validation');
const { body, query, param } = require('express-validator');

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
    .isUUID()
    .withMessage('Team ID must be a valid UUID'),
  handleValidationErrors,
], getUserProjects);

/**
 * @route   GET /api/projects/:projectId
 * @desc    Get project by ID
 * @access  Private
 */
router.get('/:projectId', [
  param('projectId').isUUID().withMessage('projectId must be a valid UUID'),
  handleValidationErrors,
], getProjectById);

/**
 * @route   PUT /api/projects/:projectId
 * @desc    Update project
 * @access  Private (Project Admin/Manager only)
 */
router.put('/:projectId', [
  param('projectId').isUUID().withMessage('projectId must be a valid UUID'),
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
 * @route   POST /api/projects/:projectId/members
 * @desc    Add member to project
 * @access  Private (Project Admin/Manager only)
 */
router.post('/:projectId/members', [
  param('projectId').isUUID().withMessage('projectId must be a valid UUID'),
  body('userId')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
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
  param('projectId').isUUID().withMessage('projectId must be a valid UUID'),
  param('memberId').isUUID().withMessage('memberId must be a valid UUID'),
  handleValidationErrors,
], removeProjectMember);

module.exports = router;
