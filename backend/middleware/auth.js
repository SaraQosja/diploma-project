// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');


const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; 

   // console.log('🔐 Auth check - Header present:', !!authHeader);
    //console.log('🎫 Token extracted:', !!token);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Qasje e mohuar. Token nuk u gjet.'
      });
    }

   
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    //console.log('✅ Token decoded successfully for userId:', decoded.userId, 'role:', decoded.role);
    
    let user = null;
    if (decoded.role === 'counselor') {
      console.log('🔍 Looking for counselor in COUNSELORS table...');
      const counselorQuery = `
        SELECT ID, EMRI, SURNAME, EMAILI, ROLI, IS_VERIFIED, IS_APPROVED, IS_ACTIVE
        FROM counselors 
        WHERE ID = :1
      `;
      
      const counselorResult = await executeQuery(counselorQuery, [decoded.userId]);
      
      if (counselorResult.rows.length > 0) {
        user = counselorResult.rows[0];
        //console.log('👨‍🏫 Counselor found:', { id: user.ID, email: user.EMAILI });
        
        req.user = {
          userId: user.ID,
          id: user.ID, 
          email: user.EMAILI,
          firstName: user.EMRI,
          lastName: user.SURNAME,
          role: user.ROLI,
          isVerified: user.IS_VERIFIED === 1,
          isApproved: user.IS_APPROVED === 1,
          isActive: user.IS_ACTIVE === 1
        };
      }
    } else {
      
      //.log('🔍 Looking for user in USERS table...');
      const userQuery = `
        SELECT ID, EMRI, SURNAME, EMAILI, ROLI, IS_VERIFIED
        FROM USERS 
        WHERE ID = :1
      `;
      
      const userResult = await executeQuery(userQuery, [decoded.userId]);
      
      if (userResult.rows.length > 0) {
        user = userResult.rows[0];
        //console.log('👤 User found:', { id: user.ID, email: user.EMAILI });

        req.user = {
          userId: user.ID,
          id: user.ID,
          email: user.EMAILI,
          firstName: user.EMRI,
          lastName: user.SURNAME,
          role: user.ROLI,
          isVerified: user.IS_VERIFIED === 1
        };
      }
    }

    if (!user) {
      //console.log('❌ User/Counselor not found in database for ID:', decoded.userId);
      return res.status(401).json({
        success: false,
        message: 'Përdoruesi nuk u gjet.'
      });
    }

   // console.log('✅ Authentication successful for:', req.user.email, 'role:', req.user.role);
    next();
  } catch (error) {
   // console.error('❌ Auth error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token i pavlefshëm.'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token ka skaduar.'
      });
    }

    //console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Autentifikimi dështoi.'
    });
  }
};


//const authenticateToken = auth;
//const protect = auth;


const checkUserAccess = (req, res, next) => {
  const requestedUserId = parseInt(req.params.userId);
  const currentUserId = req.user.userId;
  const isAdmin = req.user.role === 'admin';

  if (!isAdmin && requestedUserId !== currentUserId) {
    return res.status(403).json({
      success: false,
      message: 'Qasje e ndaluar. Mund të aksesoni vetëm të dhënat tuaja.'
    });
  }
  next();
};


const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Qasje e ndaluar. Duhet të jeni administrator.'
    });
  }
  next();
};


const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autentifikimi është i nevojshëm.'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    const hasPermission = allowedRoles.some(role => {
      return role.toLowerCase() === userRole.toLowerCase();
    });

    if (!hasPermission) {
     // console.log('❌ Role check failed. User role:', userRole, 'Allowed roles:', allowedRoles);
      return res.status(403).json({
        success: false,
        message: `Leje të pamjaftueshme. Kërkohet roli: ${allowedRoles.join(' ose ')}. Roli juaj: ${userRole}`
      });
    }

    //console.log('✅ Role check passed for:', userRole);
    next();
  };
};


const requireVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autentifikimi është i nevojshëm.'
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Verifikimi i llogarisë është i nevojshëm.'
    });
  }

  next();
};

const requireCounselor = (req, res, next) => {
  const userRole = req.user.role;
  
  if (userRole !== 'counselor' && userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Qasje e ndaluar. Duhet të jeni këshillues ose administrator.'
    });
  }
  
  next();
};


const requireStudentOrAbove = (req, res, next) => {
  const userRole = req.user.role;
  const allowedRoles = ['nxenes', 'student', 'counselor', 'admin'];
  
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Qasje e ndaluar. Duhet të jeni student, këshillues ose administrator.'
    });
  }
  
  next();
};


const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      let user = null;

      
      if (decoded.role === 'counselor') {
        const counselorQuery = `
          SELECT ID, EMRI, SURNAME, EMAILI, ROLI, IS_VERIFIED
          FROM counselors 
          WHERE ID = :1
        `;
        
        const counselorResult = await executeQuery(counselorQuery, [decoded.userId]);
        if (counselorResult.rows.length > 0) {
          user = counselorResult.rows[0];
        }
      } else {
        
        const userQuery = `
          SELECT ID, EMRI, SURNAME, EMAILI, ROLI, IS_VERIFIED
          FROM USERS 
          WHERE ID = :1
        `;
        
        const userResult = await executeQuery(userQuery, [decoded.userId]);
        if (userResult.rows.length > 0) {
          user = userResult.rows[0];
        }
      }
      
      if (user) {
        req.user = {
          userId: user.ID,
          id: user.ID,
          email: user.EMAILI,
          firstName: user.EMRI,
          lastName: user.SURNAME,
          role: user.ROLI,
          isVerified: user.IS_VERIFIED === 1
        };
      }
    }

    next();
  } catch (error) {
    
    next();
  }
};


const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();
  
  return (req, res, next) => {
    const userId = req.user?.userId;
    if (!userId) return next();
    
    const now = Date.now();
    const userKey = `${userId}`;
    
    if (!userRequests.has(userKey)) {
      userRequests.set(userKey, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const userData = userRequests.get(userKey);
    
    if (now > userData.resetTime) {
      userData.count = 1;
      userData.resetTime = now + windowMs;
    } else {
      userData.count++;
    }
    
    if (userData.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Shumë kërkesa. Provoni përsëri më vonë.'
      });
    }
    
    next();
  };
};


module.exports = {
  
  auth,
  authenticateToken: auth,
  protect: auth,
  requireRole,
  requireAdmin,
  requireCounselor,
  requireStudentOrAbove,
  requireVerification,
  checkUserAccess,
  optionalAuth,
  userRateLimit
};