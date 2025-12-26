
const oracledb = require('oracledb');
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USER || 'diploma',
  password: process.env.DB_PASSWORD || '',
  connectString: process.env.DB_CONNECTION_STRING || 'localhost:1521/xe'
};

let isInitialized = false;

async function initializeDatabase() {
  try {
    if (isInitialized) {
      console.log('✅ Database already initialized');
      return;
    }

    console.log('🔄 Initializing Oracle Database...');
    console.log(`📊 Connecting as user: ${dbConfig.user}`);
    console.log(`🔗 Connection string: ${dbConfig.connectString}`);
    if (!dbConfig.password) {
      console.error('❌ Database password not provided in environment variables');
      process.exit(1);
    }

    await oracledb.createPool({
      user: dbConfig.user,
      password: dbConfig.password,
      connectString: dbConfig.connectString,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1,
      poolTimeout: 300,
      queueTimeout: 60000,
      poolPingInterval: 60
    });

    isInitialized = true;
    console.log('✅ Oracle Database connected successfully');
    console.log(`📊 Connected as user: ${dbConfig.user}`);
    
    await testConnection();

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('💡 Check your database credentials and connection string');
    
    if (error.message.includes('ORA-01017')) {
      console.error('🔑 Invalid username/password');
    } else if (error.message.includes('ORA-12541')) {
      console.error('🔗 Could not connect to database server');
    } else if (error.message.includes('ORA-12154')) {
      console.error('📍 Connection string not found');
    }
    
    process.exit(1);
  }
}

async function testConnection() {
  let connection;
  try {
    console.log('🧪 Testing database connection...');
    connection = await getConnection();
    
    const result = await connection.execute('SELECT SYSDATE FROM DUAL');
    console.log('✅ Database test successful:', result.rows[0]);
    
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('Error closing test connection:', closeError);
      }
    }
  }
}

async function getConnection() {
  try {
    if (!isInitialized) {
      throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    
    return await oracledb.getConnection();
  } catch (error) {
    console.error('❌ Error getting database connection:', error);
    
    if (error.message.includes('pool is draining') || error.message.includes('pool is closed')) {
      console.log('🔄 Pool closed, reinitializing...');
      isInitialized = false;
      await initializeDatabase();
      return await oracledb.getConnection();
    }
    
    throw error;
  }
}

async function executeQuery(sql, binds = [], options = {}) {
  let connection;
  const startTime = Date.now();
  
  try {
    console.log(`🔍 Executing query: ${sql.substring(0, 100)}${sql.length > 100 ? '...' : ''}`);
    console.log('📝 Binds:', binds);
    
    connection = await getConnection();
    
    const result = await connection.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      maxRows: 1000, 
      ...options
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ Query executed successfully in ${duration}ms. Rows: ${result.rows?.length || 0}`);
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Database query error after ${duration}ms:`, error);
    console.error('📝 Failed SQL:', sql);
    console.error('📝 Failed Binds:', binds);
    
    
    if (error.message.includes('ORA-00942')) {
      console.error('🗂️ Table or view does not exist');
    } else if (error.message.includes('ORA-00904')) {
      console.error('🏷️ Invalid column name');
    } else if (error.message.includes('ORA-01722')) {
      console.error('🔢 Invalid number format');
    }
    
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('❌ Error closing connection:', closeError);
      }
    }
  }
}

async function closeDatabase() {
  try {
    console.log('🔄 Closing database pool...');
    await oracledb.getPool().close(10);
    isInitialized = false;
    console.log('✅ Database pool closed successfully');
  } catch (error) {
    console.error('❌ Error closing database pool:', error);
  }
}

process.on('SIGINT', async () => {
  console.log('📴 Received SIGINT, closing database...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('📴 Received SIGTERM, closing database...');
  await closeDatabase();
  process.exit(0);
});

module.exports = {
  initializeDatabase,
  getConnection,
  executeQuery,
  execute: executeQuery,
  testConnection,
  closeDatabase,
  oracledb,
  isInitialized: () => isInitialized
};