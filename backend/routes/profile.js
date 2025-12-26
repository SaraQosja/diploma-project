// backend/routes/profile.js 
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getUserProfile,
  updateBasicProfile,
  updateExtendedProfile,
  changePassword,
  getProfileCompletion,
  markProfileCompleted
} = require('../controllers/profileController');

const auth = require('../middleware/auth').auth;


router.use(auth);

router.get('/', getUserProfile);

router.get('/completion', getProfileCompletion);


router.post('/complete', markProfileCompleted);


router.put('/basic', [
  body('emri')
    .notEmpty()
    .withMessage('Emri është i detyrueshëm')
    .isLength({ min: 2, max: 50 })
    .withMessage('Emri duhet të jetë mes 2 dhe 50 karaktere')
    .matches(/^[a-zA-ZÀ-ÿëçËÇ\s]+$/)
    .withMessage('Emri mund të përmbajë vetëm shkronja dhe hapësira'),
  body('mbiemri')
    .notEmpty()
    .withMessage('Mbiemri është i detyrueshëm')
    .isLength({ min: 2, max: 50 })
    .withMessage('Mbiemri duhet të jetë mes 2 dhe 50 karaktere')
    .matches(/^[a-zA-ZÀ-ÿëçËÇ\s]+$/)
    .withMessage('Mbiemri mund të përmbajë vetëm shkronja dhe hapësira'),
  body('email')
    .isEmail()
    .withMessage('Email i pavlefshëm')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email-i nuk mund të jetë më shumë se 100 karaktere')
], updateBasicProfile);


router.put('/extended', [
  body('education_level')
    .optional()
    .isIn(['Shkolla e Mesme', 'Universiteti', 'Master', 'Doktoraturë', 'Tjetër'])
    .withMessage('Niveli arsimor duhet të jetë një nga opsionet e vlefshme'),
  body('current_school')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Shkolla aktuale nuk mund të jetë më shumë se 255 karaktere'),
  body('interests')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Interesat nuk mund të jenë më shumë se 1000 karaktere'),
  body('goals')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Qëllimet nuk mund të jenë më shumë se 1000 karaktere'),
  body('strengths')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Pikat e forta nuk mund të jenë më shumë se 1000 karaktere'),
  body('skills')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Aftësitë nuk mund të jenë më shumë se 1000 karaktere'),
  body('personality_type')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Tipi i personalitetit nuk mund të jetë më shumë se 50 karaktere')
], updateExtendedProfile);


router.put('/password', [
  body('currentPassword')
    .notEmpty()
    .withMessage('Fjalëkalimi aktual është i detyrueshëm'),
  body('newPassword')
    .isLength({ min: 6, max: 100 })
    .withMessage('Fjalëkalimi i ri duhet të jetë të paktën 6 karaktere')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Fjalëkalimi duhet të përmbajë të paktën një shkronjë të vogël, të madhe dhe një numër'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Konfirmimi i fjalëkalimit nuk përputhet');
      }
      return true;
    })
], changePassword);

module.exports = router;