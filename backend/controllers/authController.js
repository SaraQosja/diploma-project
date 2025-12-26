//backend/controllers/authController.js - I përditësuar për counselors

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const register = async (req, res) => {
  try {
    console.log('📝 Registration attempt started');
    console.log('📝 Request body:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      role,
      specialization,
      counselorBio 
    } = req.body;

    console.log('📝 User data:', { firstName, lastName, email, role });

    // Kontrollo që role është valid
    if (!role || !['nxenes', 'counselor', 'admin'].includes(role)) {
      console.log('❌ Invalid role:', role);
      return res.status(400).json({
        success: false,
        message: 'Please select a valid role'
      });
    }

    // Check if user already exists
    console.log('🔍 Checking if user exists...');
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.log('❌ User already exists');
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    console.log('👤 Creating new user...');
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      specialization: role === 'counselor' ? specialization : null,
      counselorBio: role === 'counselor' ? counselorBio : null
    });
    console.log('✅ User created:', newUser);

    // Generate verification token
    console.log('🔐 Generating tokens...');
    const verificationToken = generateRandomToken();
    await User.setVerificationToken(newUser.userId, verificationToken);

    // Generate JWT token
    const token = generateToken(newUser.userId);

    // Generate remember token
    const rememberToken = generateRandomToken();
    await User.setRememberToken(newUser.userId, rememberToken);

    console.log('✅ Registration successful!');
    
    const message = role === 'counselor' 
      ? 'Counselor registered successfully! You can now log in and start helping students.'
      : 'User registered successfully';

    res.status(201).json({
      success: true,
      message: message,
      data: {
        user: {
          id: newUser.userId,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role,
          isVerified: false,
          isCounselor: newUser.isCounselor,
          specialization: newUser.specialization
        },
        token,
        verificationToken
      }
    });

  } catch (error) {
    console.error('❌ Register error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed',
      debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password, rememberMe = false } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isPasswordValid = await User.verifyPassword(password, user.PASSWORDI);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

  
    const token = generateToken(user.ID);

    // Handle remember me functionality
    if (rememberMe) {
      const rememberToken = generateRandomToken();
      await User.setRememberToken(user.ID, rememberToken);
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.ID,
          firstName: user.EMRI,
          lastName: user.SURNAME,
          email: user.EMAILI,
          role: user.ROLI,
          isVerified: user.IS_VERIFIED === 1,
          isCounselor: user.IS_COUNSELOR === 1,
          specialization: user.SPECIALIZATION,
          isAvailable: user.IS_AVAILABLE === 1,
          counselorBio: user.COUNSELOR_BIO
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};


const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.ID,
          firstName: user.EMRI,
          lastName: user.SURNAME,
          email: user.EMAILI,
          role: user.ROLI,
          isVerified: user.IS_VERIFIED === 1,
          isCounselor: user.IS_COUNSELOR === 1,
          specialization: user.SPECIALIZATION,
          isAvailable: user.IS_AVAILABLE === 1,
          counselorBio: user.COUNSELOR_BIO,
          createdAt: user.CREATED_AT,
          updatedAt: user.UPDATED_AT,
          lastActive: user.LAST_ACTIVE
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { firstName, lastName, specialization, counselorBio } = req.body;
    const userId = req.user.userId;

    const updatedUser = await User.updateProfile(userId, {
      firstName,
      lastName,
      specialization,
      counselorBio
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser.ID,
          firstName: updatedUser.EMRI,
          lastName: updatedUser.SURNAME,
          email: updatedUser.EMAILI,
          role: updatedUser.ROLI,
          isVerified: updatedUser.IS_VERIFIED === 1,
          isCounselor: updatedUser.IS_COUNSELOR === 1,
          specialization: updatedUser.SPECIALIZATION,
          isAvailable: updatedUser.IS_AVAILABLE === 1,
          counselorBio: updatedUser.COUNSELOR_BIO
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

const verifyAccount = async (req, res) => {
  try {
    const { verificationToken } = req.params;
    const isVerified = await User.verifyAccount(verificationToken);

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    res.json({
      success: true,
      message: 'Account verified successfully'
    });

  } catch (error) {
    console.error('Verify account error:', error);
    res.status(500).json({
      success: false,
      message: 'Account verification failed'
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isCurrentPasswordValid = await User.verifyPassword(currentPassword, user.PASSWORDI);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    await User.updatePassword(userId, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

const logout = async (req, res) => {
  try {
    await User.clearRememberToken(req.user.userId);

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.json({
      success: true,
      message: 'Logout successful'
    });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.countUsersByRole('nxenes');
    const totalCounselors = await User.countCounselors();
    const availableCounselors = await User.countCounselors({ isAvailable: true });
    const totalAdmins = await User.countUsersByRole('admin');

    res.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          totalCounselors,
          availableCounselors,
          totalAdmins,
          totalUsers: totalStudents + totalCounselors + totalAdmins
        }
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard stats'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  verifyAccount,
  changePassword,
  logout,
  getDashboardStats
};