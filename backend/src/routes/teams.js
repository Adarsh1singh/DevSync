const express = require('express');
const {
  createTeam,
  getUserTeams,
  getTeamById,
  updateTeam,
  addTeamMember,
  removeTeamMember,
} = require('../controllers/teamController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  validateTeamCreation,
  handleValidationErrors,
} = require('../middleware/validation');
const { body, param } = require('express-validator');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/teams
 * @desc    Create a new team
 * @access  Private
 */
router.post('/', validateTeamCreation, createTeam);

/**
 * @route   GET /api/teams
 * @desc    Get all teams for the current user
 * @access  Private
 */
router.get('/', getUserTeams);

/**
 * @route   GET /api/teams/:teamId
 * @desc    Get team by ID
 * @access  Private
 */
router.get('/:teamId', [
  param('teamId').isUUID().withMessage('teamId must be a valid UUID'),
  handleValidationErrors,
], getTeamById);

/**
 * @route   PUT /api/teams/:teamId
 * @desc    Update team
 * @access  Private (Team Admin only)
 */
router.put('/:teamId', [
  param('teamId').isUUID().withMessage('teamId must be a valid UUID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Team name must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  handleValidationErrors,
], updateTeam);

/**
 * @route   POST /api/teams/:teamId/members
 * @desc    Add member to team
 * @access  Private (Team Admin only)
 */
router.post('/:teamId/members', [
  param('teamId').isUUID().withMessage('teamId must be a valid UUID'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('role')
    .optional()
    .isIn(['ADMIN', 'MANAGER', 'DEVELOPER'])
    .withMessage('Role must be ADMIN, MANAGER, or DEVELOPER'),
  handleValidationErrors,
], addTeamMember);

/**
 * @route   DELETE /api/teams/:teamId/members/:memberId
 * @desc    Remove member from team
 * @access  Private (Team Admin only)
 */
router.delete('/:teamId/members/:memberId', [
  param('teamId').isUUID().withMessage('teamId must be a valid UUID'),
  param('memberId').isUUID().withMessage('memberId must be a valid UUID'),
  handleValidationErrors,
], removeTeamMember);

module.exports = router;
