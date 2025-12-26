//backend/middleware/validation.js

const { body } = require('express-validator');


const registerValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2-50 characters')
    .matches(/^[a-zA-ZëËçÇ\s]+$/)
    .withMessage('First name can only contain letters'),
    
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2-50 characters')
    .matches(/^[a-zA-ZëËçÇ\s]+$/)
    .withMessage('Last name can only contain letters'),
    
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must be less than 255 characters'),
    
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
    
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['nxenes', 'counselor', 'admin'])
    .withMessage('Role must be one of: nxenes, counselor, admin'),
    
 
  body('specialization')
    .optional()
    .if(body('role').equals('counselor'))
    .notEmpty()
    .withMessage('Specialization is required for counselors')
    .isLength({ min: 3, max: 100 })
    .withMessage('Specialization must be between 3-100 characters'),
    
  body('counselorBio')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Bio must be less than 300 characters')
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
    
  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be a boolean value')
];


const updateProfileValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2-50 characters')
    .matches(/^[a-zA-ZëËçÇ\s]+$/)
    .withMessage('First name can only contain letters'),
    
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2-50 characters')
    .matches(/^[a-zA-ZëËçÇ\s]+$/)
    .withMessage('Last name can only contain letters'),
    
  body('specialization')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Specialization must be between 3-100 characters'),
    
  body('counselorBio')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Bio must be less than 300 characters')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
    
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
    
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];


const validateTestSubmission = [
  body('answers')
    .isObject()
    .withMessage('Answers must be an object')
    .custom((answers) => {
      if (Object.keys(answers).length === 0) {
        throw new Error('At least one answer is required');
      }
      return true;
    }),
  body('timeTaken')
    .optional()
    .isNumeric()
    .custom((value) => {
      const num = Number(value);
      if (num < 0 || num > 300) {
        throw new Error('Time taken must be between 0 and 300 minutes');
      }
      return true;
    })
];

const createUserValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2-50 characters')
    .matches(/^[a-zA-ZëËçÇ\s]+$/)
    .withMessage('First name can only contain letters'),
    
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2-50 characters')
    .matches(/^[a-zA-ZëËçÇ\s]+$/)
    .withMessage('Last name can only contain letters'),
    
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must be less than 255 characters'),
    
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
    
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['nxenes', 'counselor', 'admin'])
    .withMessage('Role must be one of: nxenes, counselor, admin'),
    
  body('isVerified')
    .optional()
    .isBoolean()
    .withMessage('Verified status must be boolean')
];


const updateUserValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2-50 characters')
    .matches(/^[a-zA-ZëËçÇ\s]+$/)
    .withMessage('First name can only contain letters'),
    
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2-50 characters')
    .matches(/^[a-zA-ZëËçÇ\s]+$/)
    .withMessage('Last name can only contain letters'),
    
  body('role')
    .optional()
    .isIn(['nxenes', 'counselor', 'admin'])
    .withMessage('Role must be one of: nxenes, counselor, admin'),
    
  body('isVerified')
    .optional()
    .isBoolean()
    .withMessage('Verified status must be boolean'),
    
  body('specialization')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Specialization must be less than 100 characters'),
    
  body('counselorBio')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Bio must be less than 300 characters')
];
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};



module.exports = {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  validateTestSubmission,
  createUserValidation,
  updateUserValidation,handleValidation 
};