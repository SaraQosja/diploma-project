// backend/routes/recommendations.js
const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();

const {
  getRecommendations,
  getSmartRecommendations,
  generateCareerRecommendations,
  generateUniversityRecommendations,
  regenerateAllRecommendations,
  getRecommendationStats
} = require('../controllers/recommendationController');

const { authenticateToken } = require('../middleware/auth');


const universityRecommendationValidation = [
  body('source')
    .optional()
    .isIn(['tests', 'grades', 'both'])
    .withMessage('Source must be: tests, grades, or both'),
  
  body('programs')
    .optional()
    .isArray()
    .withMessage('Programs must be an array'),
    
  body('minGrade')
    .optional()
    .isFloat({ min: 5.0, max: 10.0 })
    .withMessage('Minimum grade must be between 5.0 and 10.0'),
    
  body('preferences.preferredLocation')
    .optional()
    .isString()
    .withMessage('Preferred location must be a string'),
    
  body('preferences.maxTuitionFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max tuition fee must be a positive number'),
    
  body('preferences.preferredLanguage')
    .optional()
    .isString()
    .withMessage('Preferred language must be a string')
];

const queryValidation = [
  query('type')
    .optional()
    .isIn(['all', 'career', 'university'])
    .withMessage('Type must be: all, career, or university'),
    
  query('source')
    .optional()
    .isIn(['auto', 'tests', 'grades', 'both'])
    .withMessage('Source must be: auto, tests, grades, or both'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

// @route   GET /api/recommendations
// @desc    Get personalized recommendations based on available data
// @access  Private
// @params  ?type=all|career|university&source=auto|tests|grades|both&limit=10
router.get('/', 
  authenticateToken, 
  queryValidation, 
  getRecommendations
);

// @route   GET /api/recommendations/career
// @desc    Get career recommendations (requires 2+ tests)
// @access  Private
router.get('/career', 
  authenticateToken, 
  queryValidation,
  generateCareerRecommendations
);
 
// @route   GET /api/recommendations/university
// @desc    Get university recommendations  
// @access  Private
// @params  ?source=tests|grades|both (default: both)
router.get('/university', 
  authenticateToken, 
  queryValidation,
  (req, res, next) => {
   
    req.body = {
      source: req.query.source || 'both',
      programs: req.query.programs ? req.query.programs.split(',') : [],
      minGrade: req.query.minGrade ? parseFloat(req.query.minGrade) : 6.0,
      preferences: {
        preferredLocation: req.query.location,
        maxTuitionFee: req.query.maxTuition ? parseFloat(req.query.maxTuition) : undefined,
        preferredLanguage: req.query.language,
        maxDuration: req.query.maxDuration ? parseInt(req.query.maxDuration) : undefined
      }
    };
    next();
  },
  generateUniversityRecommendations
);


// @route   POST /api/recommendations/regenerate
// @desc    Regenerate all recommendations for user
// @access  Private
router.post('/regenerate', 
  authenticateToken, 
  regenerateAllRecommendations
);


// @route   GET /api/recommendations/stats
// @desc    Get recommendation statistics and capabilities
// @access  Private
router.get('/stats', 
  authenticateToken, 
  getRecommendationStats
);

// @route   POST /api/recommendations/university
// @desc    Generate university recommendations with detailed preferences
// @access  Private
router.post('/university', 
  authenticateToken, 
  universityRecommendationValidation,
  generateUniversityRecommendations
);

// @route   GET /api/recommendations/smart
// @desc    Get smart recommendations (auto-detects best source)
// @access  Private
router.get('/smart', 
  authenticateToken, 
  queryValidation,
  getSmartRecommendations
);

module.exports = router;