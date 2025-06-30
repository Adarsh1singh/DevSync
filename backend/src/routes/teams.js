const express = require('express');
const {
  createTeam,
  getUserTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  getTeamActivity,
  getGlobalTeamActivity,
} = require('../controllers/teamController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  validateTeamCreation,
  handleValidationErrors,
} = require('../middleware/validation');
const { body, param } = require('express-validator');

// Custom CUID validator
const isCuid = (value) => {
  return /^c[a-z0-9]{24}$/.test(value);
};

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
 * @route   GET /api/teams/activity
 * @desc    Get global team activity for user
 * @access  Private
 */
router.get('/activity', getGlobalTeamActivity);

/**
 * @route   GET /api/teams/:teamId
 * @desc    Get team by ID
 * @access  Private
 */
router.get('/:teamId', [
  param('teamId').custom(isCuid).withMessage('teamId must be a valid ID'),
  handleValidationErrors,
], getTeam);

/**
 * @route   PUT /api/teams/:teamId
 * @desc    Update team
 * @access  Private (Team Admin only)
 */
router.put('/:teamId', [
  param('teamId').custom(isCuid).withMessage('teamId must be a valid ID'),
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
  param('teamId').custom(isCuid).withMessage('teamId must be a valid ID'),
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
  param('teamId').custom(isCuid).withMessage('teamId must be a valid ID'),
  param('memberId').custom(isCuid).withMessage('memberId must be a valid ID'),
  handleValidationErrors,
], removeTeamMember);

/**
 * @route   GET /api/teams/:teamId/activity
 * @desc    Get team activity
 * @access  Private (Team Member only)
 */
router.get('/:teamId/activity', [
  param('teamId').custom(isCuid).withMessage('teamId must be a valid ID'),
  handleValidationErrors,
], getTeamActivity);

/**
 * @route   DELETE /api/teams/:teamId
 * @desc    Delete team
 * @access  Private (Team Admin only)
 */
router.delete('/:teamId', [
  param('teamId').custom(isCuid).withMessage('teamId must be a valid ID'),
  handleValidationErrors,
], deleteTeam);

module.exports = router;
