// backend/server.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initializeDatabase } = require('./config/database');
const WebSocketConfig = require('./config/websocket'); 

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: function (origin, callback) {
   
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001','http://localhost:5000'
    ];
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Accept',
    'Accept-Language', 
    'Content-Type',
    'Content-Language',
    'Authorization',
    'x-auth-token',
    'X-User-ID',
    'X-User-Name',
    'X-Requested-With',
    'Origin',
    'Referer',
    'User-Agent'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Auth-Token'],
  optionsSuccessStatus: 200, 
  maxAge: 86400, 
  preflightContinue: false
};

app.use(cors(corsOptions));
app.options('/api/chat/*', (req, res) => {
  console.log('🔄 Chat preflight for:', req.path);
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-auth-token,X-User-ID,X-User-Name');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

app.options('/api/counselor/*', (req, res) => {
  console.log('🔄 Counselor preflight for:', req.path);
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-auth-token,X-User-ID,X-User-Name');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});


app.use(helmet({
  contentSecurityPolicy: false, 
  crossOriginResourcePolicy: false, 
  crossOriginEmbedderPolicy: false 
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
  if (req.path.includes('/api/chat') || req.path.includes('/api/counselor')) {
    console.log(`📡 ${req.method} ${req.path}`);
    console.log('Origin:', req.headers.origin);
    console.log('Headers:', {
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization ? 'Present' : 'Missing',
      'x-user-id': req.headers['x-user-id'] || 'Missing',
      'x-user-name': req.headers['x-user-name'] || 'Missing'
    });
  }
  next();
});

let websocket = null;
try {
  websocket = new WebSocketConfig(server);
  console.log('✅ WebSocket initialized successfully');
} catch (error) {
  console.error('❌ WebSocket initialization failed:', error);
}

app.use((req, res, next) => {
  req.io = websocket ? websocket.io : null;
  req.websocket = websocket;
  next();
});


app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/tests', require('./routes/tests'));

app.use('/api/grades', require('./routes/grades'));
const gradesRoutes = require('./routes/grades');
app.use('/api/grades', gradesRoutes);
app.use('/api/profile', require('./routes/profile'));

app.use('/api/chat', require('./routes/chat'));
app.use('/api/progress', require('./routes/progressAnalytics'));
app.use('/api/counselor', require('./routes/counselor'));
const adminAuth = require('./middleware/adminAuth');
app.use('/api/admin', adminAuth, require('./routes/admin'));
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Career Counseling API is running',
    timestamp: new Date().toISOString(),
    cors: 'configured',
    features: {
      auth: 'active',
      users: 'active',
      tests: 'active',
      recommendations: 'active',
      profile: 'active',
      chat: 'active', 
      websocket: websocket ? 'active' : 'disabled', 
      progressAnalytics: 'active',
      counselor: 'active',
      admin: 'active'
    }
  });
});
app.get('/api/websocket/status', (req, res) => {
  if (!websocket) {
    return res.status(503).json({
      success: false,
      message: 'WebSocket not available'
    });
  }

  const stats = websocket.getStats();
  res.json({
    success: true,
    data: {
      connected: true,
      stats,
      timestamp: new Date().toISOString()
    }
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Career Counseling API',
    version: '1.0.0',
    cors: 'enabled',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      tests: '/api/tests',
      recommendations: '/api/recommendations',
      profile: '/api/profile',
      chat: '/api/chat', 
      progress: '/api/progress',
      counselor: '/api/counselor',
      admin: '/api/admin',
      health: '/api/health'
    }
  });
});


app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});


app.use((error, req, res, next) => {
  console.error('Global error:', error);

  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation',
      origin: req.headers.origin
    });
  }
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});


const startServer = async () => {
  try {
   
    await initializeDatabase();
    
    const PORT = process.env.PORT || 5000;
  
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API URL: http://localhost:${PORT}`);
      console.log(`🔐 CORS: Configured for localhost:3000`);
      console.log(`🔌 WebSocket: ${websocket ? 'enabled' : 'disabled'}`); 
      console.log(`👤 User Management: Enabled`);
      console.log(`📊 Progress Analytics: Enabled`);
      console.log(`👨‍🏫 Counselor System: Enabled`);
      console.log(`💬 Chat System: ${websocket ? 'Enabled' : 'Disabled'}`); 
      console.log(`⚙️ Admin Panel: Enabled`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});


process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('🔴 SIGTERM received, shutting down gracefully');
  if (websocket) {
    websocket.shutdown();
  }
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔴 SIGINT received, shutting down gracefully');
  if (websocket) {
    websocket.shutdown();
  }
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

startServer();