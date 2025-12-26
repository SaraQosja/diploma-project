// backend/routes/users.js
const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  getUserActivity
} = require('../controllers/userController');

const { auth, requireAdmin, checkUserAccess } = require('../middleware/auth');


router.use(auth);



router.get('/', requireAdmin, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Faqja duhet të jetë një numër pozitiv'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limiti duhet të jetë mes 1 dhe 100'),
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Kërkimi nuk mund të jetë më shumë se 100 karaktere'),
  query('role')
    .optional()
    .isIn(['all', 'admin', 'counselor', 'student'])
    .withMessage('Roli duhet të jetë: all, admin, counselor ose student'),
  query('status')
    .optional()
    .isIn(['all', 'active', 'inactive', 'pending'])
    .withMessage('Statusi duhet të jetë: all, active, inactive ose pending')
], getAllUsers);


router.get('/:userId', [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('ID e përdoruesit duhet të jetë një numër pozitiv')
], checkUserAccess, getUserById);

router.put('/:userId', [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('ID e përdoruesit duhet të jetë një numër pozitiv'),
  body('emri')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Emri duhet të jetë mes 2 dhe 50 karaktere')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Emri mund të përmbajë vetëm shkronja dhe hapësira'),
  body('mbiemri')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Mbiemri duhet të jetë mes 2 dhe 50 karaktere')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Mbiemri mund të përmbajë vetëm shkronja dhe hapësira'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email i pavlefshëm')
    .normalizeEmail(),
  body('telefoni')
    .optional()
    .isMobilePhone('any')
    .withMessage('Numri i telefonit është i pavlefshëm'),
  body('roli')
    .optional()
    .isIn(['admin', 'counselor', 'student'])
    .withMessage('Roli duhet të jetë: admin, counselor ose student')
    .custom((value, { req }) => {
      // Only admins can change roles
      if (value && req.user.role !== 'admin') {
        throw new Error('Vetëm administratorët mund të ndryshojnë rolet');
      }
      return true;
    }),
  body('statusi')
    .optional()
    .isIn(['active', 'inactive', 'pending'])
    .withMessage('Statusi duhet të jetë: active, inactive ose pending')
    .custom((value, { req }) => {
      
      if (value && req.user.role !== 'admin') {
        throw new Error('Vetëm administratorët mund të ndryshojnë statusin');
      }
      return true;
    })
], checkUserAccess, updateUser);

router.delete('/:userId', [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('ID e përdoruesit duhet të jetë një numër pozitiv')
], requireAdmin, deleteUser);


router.get('/:userId/stats', [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('ID e përdoruesit duhet të jetë një numër pozitiv')
], checkUserAccess, getUserStats);

router.get('/:userId/activity', [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('ID e përdoruesit duhet të jetë një numër pozitiv'),
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Ditët duhet të jenë mes 1 dhe 365')
], checkUserAccess, getUserActivity);


router.get('/me/profile', (req, res, next) => {
  req.params.userId = req.user.userId.toString();
  next();
}, getUserById);

router.put('/me/profile', (req, res, next) => {
  req.params.userId = req.user.userId.toString();
  next();
}, [
  body('emri')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Emri duhet të jetë mes 2 dhe 50 karaktere')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Emri mund të përmbajë vetëm shkronja dhe hapësira'),
  body('mbiemri')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Mbiemri duhet të jetë mes 2 dhe 50 karaktere')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Mbiemri mund të përmbajë vetëm shkronja dhe hapësira'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email i pavlefshëm')
    .normalizeEmail(),
  body('telefoni')
    .optional()
    .isMobilePhone('any')
    .withMessage('Numri i telefonit është i pavlefshëm')
], updateUser);


router.get('/me/stats', (req, res, next) => {
  req.params.userId = req.user.userId.toString();
  next();
}, getUserStats);


router.get('/me/activity', [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Ditët duhet të jenë mes 1 dhe 365')
], (req, res, next) => {
  req.params.userId = req.user.userId.toString();
  next();
}, getUserActivity);

module.exports = router;