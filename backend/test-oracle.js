//backend/test-oracle.js

const oracledb = require('oracledb');

async function testOracle() {
  let connection;
  try {
    console.log('🔄 Trying to connect to Oracle...');
    
    connection = await oracledb.getConnection({
      user: 'diploma',
      password: '1',
      connectString: 'localhost:1521/xe'
    });
    
    console.log('✅ CONNECTED TO ORACLE!');
    
    
    const result = await connection.execute('SELECT * FROM users WHERE ROWNUM <= 1');
    console.log('✅ Query works:', result.rows);
    
  } catch (error) {
    console.error('❌ Oracle Error:', error.message);
    
  
    console.log('🔄 Trying alternative connection...');
    try {
      connection = await oracledb.getConnection({
        user: 'diploma',
        password: '1',
        connectString: 'localhost:1521:xe'  
      });
      console.log('✅ ALTERNATIVE CONNECTION WORKS!');
    } catch (error2) {
      console.error('❌ Alternative also failed:', error2.message);
    }
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

testOracle();