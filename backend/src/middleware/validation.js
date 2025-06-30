const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      })),
    });
  }
  
  next();
};

/**
 * User registration validation
 */
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('role')
    .optional()
    .isIn(['ADMIN', 'MANAGER', 'DEVELOPER'])
    .withMessage('Role must be ADMIN, MANAGER, or DEVELOPER'),
  handleValidationErrors,
];

/**
 * User login validation
 */
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

// Custom CUID validator
const isCuid = (value) => {
  return /^c[a-z0-9]{24}$/.test(value);
};

/**
 * Project creation validation
 */
const validateProjectCreation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Project name must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('teamId')
    .custom(isCuid)
    .withMessage('Valid team ID is required'),
  handleValidationErrors,
];

/**
 * Task creation validation
 */
const validateTaskCreation = [
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
];

/**
 * Comment creation validation
 */
const validateCommentCreation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content must be between 1 and 1000 characters'),
  handleValidationErrors,
];

/**
 * Team creation validation
 */
const validateTeamCreation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Team name must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  handleValidationErrors,
];

/**
 * CUID parameter validation
 */
const validateCUIDParam = (paramName) => [
  param(paramName)
    .custom(isCuid)
    .withMessage(`${paramName} must be a valid ID`),
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateProjectCreation,
  validateTaskCreation,
  validateCommentCreation,
  validateTeamCreation,
  validateCUIDParam,
};
