// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
console.log('adminController:', adminController);
console.log('getDashboardStats type:', typeof adminController.getDashboardStats);
console.log('getDashboardStats value:', adminController.getDashboardStats);




const adminAuth = require('../middleware/adminAuth');
const { body, query, param } = require('express-validator');
const { handleValidation: validation } = require('../middleware/validation');
// Apply admin authentication middleware to all routes
router.use(adminAuth);

// Dashboard Routes
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/analytics', 
    query('period').optional().isNumeric().withMessage('Period must be a number'),
    validation,
    adminController.getAnalytics
);

// User Management Routes
router.get('/users', 
    query('page').optional().isNumeric().withMessage('Page must be a number'),
    query('limit').optional().isNumeric().withMessage('Limit must be a number'),
    query('search').optional().trim(),
    query('role').optional().isIn(['user', 'counselor']).withMessage('Invalid role'),
    validation,
    adminController.getAllUsers
);

router.post('/users',
    body('emri').notEmpty().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('surname').notEmpty().trim().isLength({ min: 2, max: 50 }).withMessage('Surname must be 2-50 characters'),
    body('emaili').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('passwordi').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('roli').optional().isIn(['user', 'counselor']).withMessage('Invalid role'),
    body('isCounselor').optional().isBoolean().withMessage('isCounselor must be boolean'),
    body('specialization').optional().trim().isLength({ max: 100 }).withMessage('Specialization too long'),
    body('counselorBio').optional().trim().isLength({ max: 300 }).withMessage('Bio too long'),
    validation,
    adminController.createUser
);

router.put('/users/:id',
    param('id').isNumeric().withMessage('Invalid user ID'),
    body('emri').notEmpty().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('surname').notEmpty().trim().isLength({ min: 2, max: 50 }).withMessage('Surname must be 2-50 characters'),
    body('emaili').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('roli').optional().isIn(['user', 'counselor']).withMessage('Invalid role'),
    body('isCounselor').optional().isBoolean().withMessage('isCounselor must be boolean'),
    body('specialization').optional().trim().isLength({ max: 100 }).withMessage('Specialization too long'),
    body('counselorBio').optional().trim().isLength({ max: 300 }).withMessage('Bio too long'),
    body('isAvailable').optional().isBoolean().withMessage('isAvailable must be boolean'),
    validation,
    adminController.updateUser
);

router.delete('/users/:id',
    param('id').isNumeric().withMessage('Invalid user ID'),
    validation,
    adminController.deleteUser
);

router.post('/users/bulk-delete',
    body('userIds').isArray({ min: 1 }).withMessage('User IDs array required'),
    body('userIds.*').isNumeric().withMessage('All user IDs must be numeric'),
    validation,
    adminController.bulkDeleteUsers
);

// Test Management Routes
router.get('/tests',
    query('page').optional().isNumeric().withMessage('Page must be a number'),
    query('limit').optional().isNumeric().withMessage('Limit must be a number'),
    query('search').optional().trim(),
    validation,
    adminController.getAllTests
);

router.post('/tests',
    body('testName').notEmpty().trim().isLength({ min: 3, max: 255 }).withMessage('Test name must be 3-255 characters'),
    body('testDescription').optional().trim(),
    body('testType').notEmpty().trim().isLength({ max: 50 }).withMessage('Test type required'),
    body('durationMinutes').isNumeric().isInt({ min: 1, max: 300 }).withMessage('Duration must be 1-300 minutes'),
    body('totalQuestions').isNumeric().isInt({ min: 1, max: 100 }).withMessage('Questions must be 1-100'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
    validation,
    adminController.createTest
);

router.put('/tests/:id',
    param('id').isNumeric().withMessage('Invalid test ID'),
    body('testName').notEmpty().trim().isLength({ min: 3, max: 255 }).withMessage('Test name must be 3-255 characters'),
    body('testDescription').optional().trim(),
    body('testType').notEmpty().trim().isLength({ max: 50 }).withMessage('Test type required'),
    body('durationMinutes').isNumeric().isInt({ min: 1, max: 300 }).withMessage('Duration must be 1-300 minutes'),
    body('totalQuestions').isNumeric().isInt({ min: 1, max: 100 }).withMessage('Questions must be 1-100'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
    validation,
    adminController.updateTest
);

router.delete('/tests/:id',
    param('id').isNumeric().withMessage('Invalid test ID'),
    validation,
    adminController.deleteTest
);

// University Management Routes
router.get('/universities',
    query('page').optional().isNumeric().withMessage('Page must be a number'),
    query('limit').optional().isNumeric().withMessage('Limit must be a number'),
    query('search').optional().trim(),
    query('country').optional().trim(),
    validation,
    adminController.getAllUniversities
);

router.post('/universities',
    body('universityName').notEmpty().trim().isLength({ min: 3, max: 200 }).withMessage('University name must be 3-200 characters'),
    body('location').optional().trim().isLength({ max: 100 }).withMessage('Location too long'),
    body('country').optional().trim().isLength({ max: 50 }).withMessage('Country too long'),
    body('universityType').optional().isIn(['public', 'private', 'international']).withMessage('Invalid university type'),
    body('website').optional().isURL().withMessage('Invalid website URL'),
    body('contactInfo').optional().trim(),
    body('programs').optional().trim(),
    body('admissionRequirements').optional().trim(),
    body('tuitionFees').optional().isNumeric().isFloat({ min: 0 }).withMessage('Invalid tuition fees'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
    validation,
    adminController.createUniversity
);

router.put('/universities/:id',
    param('id').isNumeric().withMessage('Invalid university ID'),
    body('universityName').notEmpty().trim().isLength({ min: 3, max: 200 }).withMessage('University name must be 3-200 characters'),
    body('location').optional().trim().isLength({ max: 100 }).withMessage('Location too long'),
    body('country').optional().trim().isLength({ max: 50 }).withMessage('Country too long'),
    body('universityType').optional().isIn(['public', 'private', 'international']).withMessage('Invalid university type'),
    body('website').optional().isURL().withMessage('Invalid website URL'),
    body('contactInfo').optional().trim(),
    body('programs').optional().trim(),
    body('admissionRequirements').optional().trim(),
    body('tuitionFees').optional().isNumeric().isFloat({ min: 0 }).withMessage('Invalid tuition fees'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
    validation,
    adminController.updateUniversity
);

router.delete('/universities/:id',
    param('id').isNumeric().withMessage('Invalid university ID'),
    validation,
    adminController.deleteUniversity
);

// Career Management Routes
router.get('/careers',
    query('page').optional().isNumeric().withMessage('Page must be a number'),
    query('limit').optional().isNumeric().withMessage('Limit must be a number'),
    query('search').optional().trim(),
    query('category').optional().trim(),
    validation,
    adminController.getAllCareers
);

router.post('/careers',
    body('careerName').notEmpty().trim().isLength({ min: 3, max: 255 }).withMessage('Career name must be 3-255 characters'),
    body('careerDescription').optional().trim(),
    body('category').optional().trim().isLength({ max: 100 }).withMessage('Category too long'),
    body('requiredEducation').optional().trim().isLength({ max: 255 }).withMessage('Required education too long'),
    body('averageSalary').optional().isNumeric().isFloat({ min: 0 }).withMessage('Invalid average salary'),
    body('jobOutlook').optional().trim().isLength({ max: 100 }).withMessage('Job outlook too long'),
    body('skillsRequired').optional().trim(),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
    validation,
    adminController.createCareer
);

router.put('/careers/:id',
    param('id').isNumeric().withMessage('Invalid career ID'),
    body('careerName').notEmpty().trim().isLength({ min: 3, max: 255 }).withMessage('Career name must be 3-255 characters'),
    body('careerDescription').optional().trim(),
    body('category').optional().trim().isLength({ max: 100 }).withMessage('Category too long'),
    body('requiredEducation').optional().trim().isLength({ max: 255 }).withMessage('Required education too long'),
    body('averageSalary').optional().isNumeric().isFloat({ min: 0 }).withMessage('Invalid average salary'),
    body('jobOutlook').optional().trim().isLength({ max: 100 }).withMessage('Job outlook too long'),
    body('skillsRequired').optional().trim(),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
    validation,
    adminController.updateCareer
);

router.delete('/careers/:id',
    param('id').isNumeric().withMessage('Invalid career ID'),
    validation,
    adminController.deleteCareer
);

// Chat Management Routes
router.get('/chat-rooms',
    query('page').optional().isNumeric().withMessage('Page must be a number'),
    query('limit').optional().isNumeric().withMessage('Limit must be a number'),
    query('search').optional().trim(),
    query('type').optional().isIn(['public', 'private', 'counseling']).withMessage('Invalid room type'),
    validation,
    adminController.getAllChatRooms
);

router.delete('/chat-rooms/:id',
    param('id').isNumeric().withMessage('Invalid chat room ID'),
    validation,
    adminController.deleteChatRoom
);

router.get('/chat-rooms/:roomId/messages',
    param('roomId').isNumeric().withMessage('Invalid room ID'),
    query('page').optional().isNumeric().withMessage('Page must be a number'),
    query('limit').optional().isNumeric().withMessage('Limit must be a number'),
    validation,
    adminController.getChatMessages
);

router.delete('/messages/:messageId',
    param('messageId').isNumeric().withMessage('Invalid message ID'),
    validation,
    adminController.deleteMessage
);

// System Settings Routes
router.get('/settings', adminController.getSystemSettings);
router.put('/settings',
    body('siteName').optional().trim().isLength({ max: 100 }).withMessage('Site name too long'),
    body('enableRegistration').optional().isBoolean().withMessage('enableRegistration must be boolean'),
    body('enableChatRooms').optional().isBoolean().withMessage('enableChatRooms must be boolean'),
    body('maxTestDuration').optional().isNumeric().isInt({ min: 10, max: 300 }).withMessage('Invalid max test duration'),
    body('defaultTestQuestions').optional().isNumeric().isInt({ min: 5, max: 100 }).withMessage('Invalid default test questions'),
    body('maintenanceMode').optional().isBoolean().withMessage('maintenanceMode must be boolean'),
    body('emailNotifications').optional().isBoolean().withMessage('emailNotifications must be boolean'),
    body('allowGuestAccess').optional().isBoolean().withMessage('allowGuestAccess must be boolean'),
    validation,
    adminController.updateSystemSettings
);

// Admin Logs Routes
router.get('/logs',
    query('page').optional().isNumeric().withMessage('Page must be a number'),
    query('limit').optional().isNumeric().withMessage('Limit must be a number'),
    query('adminId').optional().isNumeric().withMessage('Admin ID must be numeric'),
    query('actionType').optional().trim(),
    validation,
    adminController.getAdminLogs
);

// Export Routes
router.get('/export',
    query('type').notEmpty().isIn(['users', 'tests', 'analytics']).withMessage('Invalid export type'),
    query('format').optional().isIn(['json', 'csv']).withMessage('Invalid export format'),
    validation,
    adminController.exportData
);

module.exports = router;