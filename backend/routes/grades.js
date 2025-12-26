// backend/routes/grades.js 
const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();


const {
  getUserGrades,
  addGrade,
  updateGrade,
  deleteGrade,
  getGradeStats,
  bulkSaveGrades
} = require('../controllers/gradeController');

const { authenticateToken } = require('../middleware/auth');
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Gabime në validim',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};


const addGradeValidation = [
  body('subjectName')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Emri i lëndës duhet të jetë midis 1 dhe 200 karaktere'),
  
  body('grade')
    .isFloat({ min: 4, max: 10 })
    .withMessage('Nota duhet të jetë midis 4 dhe 10'),
  
  body('yearTaken')
    .optional()
    .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
    .withMessage('Viti duhet të jetë i vlefshëm'),
  
  body('gradeType')
    .optional()
    .isIn(['vkm', 'average', 'matura', 'yearly', 'subject'])
    .withMessage('Lloji i notës nuk është i vlefshëm'),
  
  body('isMaturaSubject')
    .optional()
    .isIn([0, 1])
    .withMessage('Indikatori i maturës duhet të jetë 0 ose 1')
];


const updateGradeValidation = [
  param('gradeId')
    .isInt({ min: 1 })
    .withMessage('ID e notës duhet të jetë një numër i vlefshëm'),
  
  ...addGradeValidation
];

const deleteGradeValidation = [
  param('gradeId')
    .isInt({ min: 1 })
    .withMessage('ID e notës duhet të jetë një numër i vlefshëm')
];

const bulkSaveValidation = [
  body('grades')
    .isArray({ min: 1, max: 50 })
    .withMessage('Lista e notave duhet të ketë midis 1 dhe 50 elemente'),
  
  body('grades.*.subjectName')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Emri i lëndës duhet të jetë midis 1 dhe 200 karaktere'),
  
  body('grades.*.grade')
    .isFloat({ min: 4, max: 10 })
    .withMessage('Nota duhet të jetë midis 4 dhe 10')
];


router.get('/', 
  authenticateToken, 
  getUserGrades
);


router.get('/stats', 
  authenticateToken, 
  getGradeStats
);

// @route   POST /api/grades
// @desc    Add a new grade
// @access  Private
router.post('/', 
  authenticateToken, 
  addGradeValidation, 
  handleValidationErrors, 
  addGrade
);

// @route   POST /api/grades/bulk
// @desc    Bulk save multiple grades
// @access  Private
router.post('/bulk', 
  authenticateToken, 
  bulkSaveValidation, 
  handleValidationErrors, 
  bulkSaveGrades
);

// @route   PUT /api/grades/:gradeId
// @desc    Update an existing grade
// @access  Private
router.put('/:gradeId', 
  authenticateToken, 
  updateGradeValidation, 
  handleValidationErrors, 
  updateGrade
);

// @route   DELETE /api/grades/:gradeId
// @desc    Delete a grade
// @access  Private
router.delete('/:gradeId', 
  authenticateToken, 
  deleteGradeValidation, 
  handleValidationErrors, 
  deleteGrade
);

// @route   GET /api/grades/types
// @desc    Get available grade types
// @access  Private
router.get('/types', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      'vkm': { name: 'VKM', description: 'Vendimi i Komitetit të Maturës', range: '4.0-10.0' },
      'average': { name: 'VKM', description: 'Vendimi i Komitetit të Maturës', range: '4.0-10.0' },
      'matura': { name: 'Matura', description: 'Nota e Maturës', range: '4.0-10.0' },
      'yearly': { name: 'Vjetore', description: 'Mesatarja Vjetore', range: '5.0-10.0' },
      'subject': { name: 'Lëndë', description: 'Nota e Lëndës', range: '4.0-10.0' }
    },
    message: 'Llojet e notave u ngarkuan me sukses'
  });
});

// @route   GET /api/grades/summary
// @desc    Get a summary of grades with analytics
// @access  Private
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
   
    const gradesQuery = `
      SELECT 
        SUBJECT_NAME as subjectName,
        GRADE as grade,
        GRADE_TYPE as gradeType,
        IS_MATURA_SUBJECT as isMaturaSubject,
        YEAR_TAKEN as yearTaken
      FROM USER_GRADES 
      WHERE USER_ACCOUNT_ID = :userId 
      ORDER BY CREATED_AT DESC
    `;

    const { executeQuery } = require('../config/database');
const result = await executeQuery(gradesQuery, [userId]);
    
    const grades = result.rows.map(row => ({
      subjectName: row.subjectName,
      grade: parseFloat(row.grade),
      gradeType: row.gradeType,
      isMaturaSubject: row.isMaturaSubject,
      yearTaken: row.yearTaken
    }));

    
    const maturaGrades = grades.filter(g => g.isMaturaSubject === 1);
    const yearlyGrades = grades.filter(g => g.gradeType === 'yearly');
    const vkmGrades = grades.filter(g => g.gradeType === 'vkm' || g.gradeType === 'average');

    const summary = {
      totalGrades: grades.length,
      grades: grades,
      averages: {
        overall: grades.length > 0 ? grades.reduce((sum, g) => sum + g.grade, 0) / grades.length : 0,
        matura: maturaGrades.length > 0 ? maturaGrades.reduce((sum, g) => sum + g.grade, 0) / maturaGrades.length : 0,
        yearly: yearlyGrades.length > 0 ? yearlyGrades.reduce((sum, g) => sum + g.grade, 0) / yearlyGrades.length : 0,
        vkm: vkmGrades.length > 0 ? vkmGrades.reduce((sum, g) => sum + g.grade, 0) / vkmGrades.length : 0
      },
      counts: {
        total: grades.length,
        matura: maturaGrades.length,
        yearly: yearlyGrades.length,
        vkm: vkmGrades.length
      },
      recommendations: {
        eligible: grades.length >= 3 && (maturaGrades.length >= 3 || vkmGrades.length >= 1),
        reason: grades.length < 3 
          ? 'Duhen të paktën 3 nota për rekomandime'
          : maturaGrades.length < 3 && vkmGrades.length < 1
          ? 'Duhen nota maturë ose VKM për rekomandime të sakta'
          : 'I gatshëm për rekomandime'
      }
    };

    res.json({
      success: true,
      data: summary,
      message: 'Përmbledhja e notave u ngarku me sukses'
    });

  } catch (error) {
    console.error('Error fetching grade summary:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në marrjen e përmbledhjes së notave',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Grade API është aktiv',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

module.exports = router;