const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllTests,
  getTest,
  submitTest,
  getUserResults,
  getTestResult,
  resetTestResult
} = require('../controllers/testController');

console.log({
  getAllTests,
  getTest,
  submitTest,
  getUserResults,
  getTestResult,
  resetTestResult
});


const submitTestValidation = [
  body('answers')
    .notEmpty()
    .withMessage('Answers are required')
    .isObject()
    .withMessage('Answers must be an object'),
    
  body('timeTaken')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time taken must be a non-negative integer')
];

router.get('/', authenticateToken, getAllTests);

router.get('/results', authenticateToken, getUserResults);

router.get('/results/:resultId', authenticateToken, getTestResult);

router.get('/:testId', authenticateToken, getTest);


router.post('/:testId/submit', authenticateToken, submitTestValidation, submitTest);

// @route   DELETE /api/tests/:testId/reset
// @desc    Reset test result for retaking
// @access  Private
router.delete('/:testId/reset', authenticateToken, resetTestResult);

module.exports = router;