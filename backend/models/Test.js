// backend/models/Test.js 
const { executeQuery } = require('../config/database');

class Test {

  static async getAllTests() {

    const testsSql = `
      SELECT 
        TEST_ID,
        TEST_NAME,
        TEST_DESCRIPTION,
        TEST_TYPE,
        DURATION_MINUTES,
        TOTAL_QUESTIONS,
        IS_ACTIVE,
        CREATED_AT
      FROM TESTS
      WHERE IS_ACTIVE = 1
      ORDER BY CREATED_AT DESC
    `;

    const testsResult = await executeQuery(testsSql);
  
    const testsWithCounts = [];
    for (const test of testsResult.rows) {
      const countSql = `
        SELECT COUNT(*) as COMPLETION_COUNT
        FROM USER_TEST_RESULTS 
        WHERE TEST_ID = :1
      `;
      const countResult = await executeQuery(countSql, [test.TEST_ID]);
      
      testsWithCounts.push({
        ...test,
        COMPLETION_COUNT: countResult.rows[0]?.COMPLETION_COUNT || 0
      });
    }
    
    return testsWithCounts;
  }

  static async getTestById(testId) {
    const testSql = `
      SELECT 
        TEST_ID,
        TEST_NAME,
        TEST_DESCRIPTION,
        TEST_TYPE,
        DURATION_MINUTES,
        TOTAL_QUESTIONS,
        IS_ACTIVE
      FROM TESTS
      WHERE TEST_ID = :1 AND IS_ACTIVE = 1
    `;

    const questionsSql = `
      SELECT 
        QUESTION_ID,
        TO_CHAR(QUESTION_TEXT) as QUESTION_TEXT,
        QUESTION_TYPE,
        OPTIONS,
        QUESTION_ORDER
      FROM TEST_QUESTIONS
      WHERE TEST_ID = :1 AND IS_ACTIVE = 1
      ORDER BY QUESTION_ORDER ASC
    `;

    const testResult = await executeQuery(testSql, [testId]);
    if (testResult.rows.length === 0) {
      return null;
    }

    const questionsResult = await executeQuery(questionsSql, [testId]);
    
    const test = testResult.rows[0];
    
  
    const questions = [];
    for (const q of questionsResult.rows) {

      let options = null;
      
      try {
        if (q.OPTIONS) {
     
          if (q.OPTIONS._type && q.OPTIONS._type.toString().includes('CLOB')) {
            const lobData = await q.OPTIONS.getData();
            const optionsStr = lobData.toString();
            options = JSON.parse(optionsStr);
          } else if (typeof q.OPTIONS === 'string') {
            options = JSON.parse(q.OPTIONS);
          } else {
            const optionsStr = q.OPTIONS.toString();
            if (optionsStr !== '[object Object]') {
              options = JSON.parse(optionsStr);
            }
          }
        }
      } catch (error) {
        console.error('Error parsing OPTIONS for question', q.QUESTION_ID, ':', error);
        
        if (q.QUESTION_TYPE === 'scale') {
          options = { scaleMin: 1, scaleMax: 5 };
        } else if (q.QUESTION_TYPE === 'multiple_choice') {
          options = ["Option 1", "Option 2", "Option 3", "Option 4"];
        }
      }

      questions.push({
        QUESTION_ID: q.QUESTION_ID,
        QUESTION_TEXT: q.QUESTION_TEXT,
        QUESTION_TYPE: q.QUESTION_TYPE,
        QUESTION_ORDER: q.QUESTION_ORDER,
        QUESTION_CATEGORY: 'General',
        WEIGHT: 1,
        OPTIONS: options
      });
    }

    return { ...test, questions };
  }

  static async hasUserCompletedTest(userId, testId) {
    const sql = `
      SELECT RESULT_ID 
      FROM USER_TEST_RESULTS 
      WHERE USER_ACCOUNT_ID = :1 AND TEST_ID = :2
    `;

    const result = await executeQuery(sql, [userId, testId]);
    return result.rows.length > 0;
  }

  // Save test result
  static async saveTestResult(userId, testId, answers, scores) {
    const insertResultSql = `
      INSERT INTO USER_TEST_RESULTS (
        USER_ACCOUNT_ID, TEST_ID, SCORE, RESULT_DETAILS, 
        COMPLETED_AT, CREATED_AT, UPDATED_AT
      )
      VALUES (:1, :2, :3, :4, SYSTIMESTAMP, SYSTIMESTAMP, SYSTIMESTAMP)
    `;

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

    const params = [
      userId,
      testId,
      totalScore,
      JSON.stringify({ answers, scores })
    ];

    await executeQuery(insertResultSql, params);
    
    const getIdSql = `
      SELECT RESULT_ID 
      FROM USER_TEST_RESULTS 
      WHERE USER_ACCOUNT_ID = :1 AND TEST_ID = :2 
      ORDER BY CREATED_AT DESC 
      FETCH FIRST 1 ROW ONLY
    `;
    
    const idResult = await executeQuery(getIdSql, [userId, testId]);
    return idResult.rows[0].RESULT_ID;
  }


  static async getUserTestResults(userId, testId = null) {
    let sql = `
      SELECT 
        tr.RESULT_ID,
        tr.TEST_ID,
        tr.SCORE,
        tr.RESULT_DETAILS,
        tr.COMPLETED_AT,
        t.TEST_NAME,
        t.TEST_TYPE,
        t.TEST_DESCRIPTION
      FROM USER_TEST_RESULTS tr
      JOIN TESTS t ON tr.TEST_ID = t.TEST_ID
      WHERE tr.USER_ACCOUNT_ID = :1
    `;

    const params = [userId];

    if (testId) {
      sql += ` AND tr.TEST_ID = :2`;
      params.push(testId);
    }

    sql += ` ORDER BY tr.COMPLETED_AT DESC`;

    const result = await executeQuery(sql, params);
    return result.rows.map(row => ({
      ...row,
      RESULT_DETAILS: (() => {
        try {
          if (row.RESULT_DETAILS) {
            if (typeof row.RESULT_DETAILS === 'string') {
              return JSON.parse(row.RESULT_DETAILS);
            } else if (typeof row.RESULT_DETAILS === 'object') {
              return row.RESULT_DETAILS; 
            } else {
              console.warn('⚠️ RESULT_DETAILS in unexpected format:', row.RESULT_DETAILS);
              return { answers: {}, scores: {} };
            }
          }
          return { answers: {}, scores: {} };
        } catch (error) {
          console.error('Error parsing RESULT_DETAILS:', error);
          return { answers: {}, scores: {} };
        }
      })()
    }));
  }

  static async createTest(testData) {
    try {
      const { name, description, type, duration } = testData;
      
      const testInsertSql = `
        INSERT INTO TESTS (
          TEST_NAME, TEST_DESCRIPTION, TEST_TYPE, DURATION_MINUTES, 
          TOTAL_QUESTIONS, IS_ACTIVE, CREATED_AT, UPDATED_AT
        )
        VALUES (:1, :2, :3, :4, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      const testParams = [name, description, type, duration];
      await executeQuery(testInsertSql, testParams);

      const testIdResult = await executeQuery(
        'SELECT TEST_ID FROM TESTS WHERE TEST_NAME = :1 ORDER BY CREATED_AT DESC FETCH FIRST 1 ROW ONLY',
        [name]
      );
      
      return testIdResult.rows[0].TEST_ID;
    } catch (error) {
      console.error('❌ Error creating test:', error);
      throw error;
    }
  }
  static async addQuestionToTest(testId, questionData) {
    try {
      const { questionText, questionType, options, questionOrder } = questionData;
      
      const questionInsertSql = `
        INSERT INTO TEST_QUESTIONS (
          TEST_ID, QUESTION_TEXT, QUESTION_TYPE, QUESTION_ORDER, 
          OPTIONS, IS_ACTIVE, CREATED_AT
        )
        VALUES (:1, :2, :3, :4, :5, 1, CURRENT_TIMESTAMP)
      `;

      const questionParams = [
        testId,
        questionText,
        questionType,
        questionOrder,
        JSON.stringify(options)
      ];

      await executeQuery(questionInsertSql, questionParams);

 
      const updateCountSql = `
        UPDATE TESTS 
        SET TOTAL_QUESTIONS = (
          SELECT COUNT(*) FROM TEST_QUESTIONS WHERE TEST_ID = :1 AND IS_ACTIVE = 1
        ), 
        UPDATED_AT = CURRENT_TIMESTAMP 
        WHERE TEST_ID = :1
      `;

      await executeQuery(updateCountSql, [testId]);
      
      console.log(`✅ Added question to test ${testId}`);
      return true;
    } catch (error) {
      console.error('❌ Error adding question:', error);
      throw error;
    }
  }

  static async deleteTest(testId) {
    try {
    
      await executeQuery(
        'UPDATE TESTS SET IS_ACTIVE = 0, UPDATED_AT = CURRENT_TIMESTAMP WHERE TEST_ID = :1',
        [testId]
      );
  
      await executeQuery(
        'UPDATE TEST_QUESTIONS SET IS_ACTIVE = 0 WHERE TEST_ID = :1',
        [testId]
      );
      
      console.log(`✅ Deleted test ${testId}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting test:', error);
      throw error;
    }
  }static async deleteTestResult(userId, testId) {
  try {
    const query = `
      DELETE FROM USER_TEST_RESULTS 
      WHERE USER_ACCOUNT_ID = :1 AND TEST_ID = :2
    `;
    
    const result = await executeQuery(query, [userId, testId]);
    return result.rowsAffected > 0;
  } catch (error) {
    console.error('Error deleting test result:', error);
    throw error;
  }

}
}

module.exports = Test;