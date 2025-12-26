const express = require('express');
const { query } = require('express-validator');
const router = express.Router();
const {
  getUserProgress,
  getTestProgress,
  getLearningPathProgress,
  getActivityTimeline,
  getPerformanceTrends,
  getAchievements,
  getPeerComparison,
  getWeeklyActivity,
  getDashboardSummary
} = require('../controllers/progressAnalyticsController');
const { authenticateToken, requireRole } = require('../middleware/auth');


const timeRangeValidation = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365'),
    
  query('months')
    .optional()
    .isInt({ min: 1, max: 24 })
    .withMessage('Months must be between 1 and 24'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// @route   GET /api/progress/overview
// @desc    Get user's overall progress summary
// @access  Private (Students only)
router.get('/overview', 
  authenticateToken, 
  requireRole(['nxenes']), 
  getUserProgress
);

// @route   GET /api/progress/tests
// @desc    Get detailed test progress
// @access  Private (Students only)
router.get('/tests', 
  authenticateToken, 
  requireRole(['nxenes']), 
  timeRangeValidation,
  getTestProgress
);

// @route   GET /api/progress/learning-paths
// @desc    Get learning path progress by category
// @access  Private (Students only)
router.get('/learning-paths', 
  authenticateToken, 
  requireRole(['nxenes']), 
  getLearningPathProgress
);

// @route   GET /api/progress/timeline
// @desc    Get activity timeline
// @access  Private (Students only)
router.get('/timeline', 
  authenticateToken, 
  requireRole(['nxenes']), 
  timeRangeValidation,
  getActivityTimeline
);

// @route   GET /api/progress/trends
// @desc    Get performance trends over time
// @access  Private (Students only)
router.get('/trends', 
  authenticateToken, 
  requireRole(['nxenes']), 
  timeRangeValidation,
  getPerformanceTrends
);

// @route   GET /api/progress/achievements
// @desc    Get user achievements and milestones
// @access  Private (Students only)
router.get('/achievements', 
  authenticateToken, 
  requireRole(['nxenes']), 
  getAchievements
);

// @route   GET /api/progress/peer-comparison
// @desc    Get progress comparison with peers
// @access  Private (Students only)
router.get('/peer-comparison', 
  authenticateToken, 
  requireRole(['nxenes']), 
  getPeerComparison
);

// @route   GET /api/progress/weekly-activity
// @desc    Get weekly activity summary
// @access  Private (Students only)
router.get('/weekly-activity', 
  authenticateToken, 
  requireRole(['nxenes']), 
  getWeeklyActivity
);

// @route   GET /api/progress/dashboard
// @desc    Get dashboard summary with all key metrics
// @access  Private (Students only)
router.get('/dashboard', 
  authenticateToken, 
  requireRole(['nxenes']), 
  getDashboardSummary
);

module.exports = router;