//backend/routes/auth.js

const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getProfile,
  updateProfile,
  verifyAccount,
  changePassword,
  logout
} = require('../controllers/authController');

const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation
} = require('../middleware/validation');

// @route   POST /api/auth/register
// @desc    Register new user/counselor 
// @access  Public
router.post('/register', registerValidation, register);

// @route   POST /api/auth/login
// @desc    Login user/counselor
// @access  Public
router.post('/login', loginValidation, login);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticateToken, getProfile);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, updateProfileValidation, updateProfile);

// @route   GET /api/auth/verify/:verificationToken
// @desc    Verify user account
// @access  Public
router.get('/verify/:verificationToken', verifyAccount);

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authenticateToken, changePasswordValidation, changePassword);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, logout);

// @route   GET /api/auth/dashboard-stats
// @desc    Get dashboard statistics (admin only)
// @access  Private (Admin)
//router.get('/dashboard-stats', authenticateToken, requireRole(['admin']), getDashboardStats);

module.exports = router;