// backend/controllers/gradeController.js 
const { executeQuery } = require('../config/database');

const GRADE_TYPES = {
  'vkm': { name: 'VKM', minGrade: 4, maxGrade: 10, description: 'Vendimi i Komitetit të Maturës' },
  'average': { name: 'VKM', minGrade: 4, maxGrade: 10, description: 'Vendimi i Komitetit të Maturës' },
  'matura': { name: 'Matura', minGrade: 4, maxGrade: 10, description: 'Nota e Maturës' },
  'yearly': { name: 'Vjetore', minGrade: 5, maxGrade: 10, description: 'Mesatarja Vjetore' },
  'subject': { name: 'Lëndë', minGrade: 4, maxGrade: 10, description: 'Nota e Lëndës' }
};

const getUserGrades = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const query = `
      SELECT 
        GRADE_ID as gradeId,
        USER_ACCOUNT_ID as userAccountId,
        SUBJECT_NAME as subjectName,
        GRADE as grade,
        YEAR_TAKEN as yearTaken,
        GRADE_TYPE as gradeType,
        IS_MATURA_SUBJECT as isMaturaSubject,
        IS_YEARLY_AVERAGE as isYearlyAverage,
        CREATED_AT as createdAt,
        UPDATED_AT as updatedAt
      FROM USER_GRADES 
      WHERE USER_ACCOUNT_ID = :userId 
      ORDER BY CREATED_AT DESC
    `;

    const result = await executeQuery(query, [userId]);
    
    const grades = result.rows.map(row => ({
      gradeId: row.gradeId,
      userAccountId: row.userAccountId,
      subjectName: row.subjectName,
      grade: parseFloat(row.grade),
      yearTaken: row.yearTaken,
      gradeType: row.gradeType || 'subject',
      isMaturaSubject: row.isMaturaSubject || 0,
      isYearlyAverage: row.isYearlyAverage || 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));

    const summary = calculateGradeSummary(grades);

    res.json({
      success: true,
      data: grades,
      summary,
      count: grades.length,
      message: 'Notat u ngarkuan me sukses'
    });

  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në marrjen e notave',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const addGrade = async (req, res) => {
  try {
    const userId = req.user.userId;
    let { subjectName, grade, yearTaken, gradeType, isMaturaSubject, subjectKey } = req.body;

    console.log('📝 Adding grade for user:', userId);
    console.log('📝 Request body:', req.body);

    if (subjectKey && !subjectName) {
      const subjectKeyMap = {
        'gjuha_shqipe': 'Gjuhë dhe Letërsi Shqipe',
        'matematika': 'Matematikë',
        'gjuha_angleze': 'Gjuhë e Huaj (Anglisht)',
        'lenda_zgjedhjes': 'Lënda me Zgjedhje',
        'viti_1': 'Mesatarja Vjetore Viti 1',
        'viti_2': 'Mesatarja Vjetore Viti 2',
        'viti_3': 'Mesatarja Vjetore Viti 3',
        'vkm': 'VKM - Vendimi i Komitetit të Maturës'
      };
      subjectName = subjectKeyMap[subjectKey] || subjectKey;
    }

    if (!subjectName || subjectName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Emri i lëndës është i detyrueshëm'
      });
    }

    if (grade === null || grade === undefined || grade === '') {
      return res.status(400).json({
        success: false,
        message: 'Nota është e detyrueshme'
      });
    }

    
    const gradeNum = parseFloat(grade);
    if (isNaN(gradeNum)) {
      return res.status(400).json({
        success: false,
        message: 'Nota duhet të jetë një numër i vlefshëm'
      });
    }

    gradeType = gradeType || 'subject';
    
    const typeConfig = GRADE_TYPES[gradeType] || GRADE_TYPES['subject'];
    if (gradeNum < typeConfig.minGrade || gradeNum > typeConfig.maxGrade) {
      return res.status(400).json({
        success: false,
        message: `Nota për ${typeConfig.description} duhet të jetë midis ${typeConfig.minGrade} dhe ${typeConfig.maxGrade}`
      });
    }

    const year = yearTaken || new Date().getFullYear();
    const currentYear = new Date().getFullYear();
    if (year < 2000 || year > currentYear + 1) {
      return res.status(400).json({
        success: false,
        message: 'Viti duhet të jetë i vlefshëm'
      });
    }

    isMaturaSubject = isMaturaSubject !== undefined ? parseInt(isMaturaSubject) : 0;
    const isYearlyAverage = (gradeType === 'yearly') ? 1 : 0;

    const duplicateCheckQuery = `
      SELECT GRADE_ID 
      FROM USER_GRADES 
      WHERE USER_ACCOUNT_ID = :userId 
      AND UPPER(TRIM(SUBJECT_NAME)) = UPPER(TRIM(:subjectName))
    `;
    
    const duplicateResult = await executeQuery(duplicateCheckQuery, [userId, subjectName]);
    
    if (duplicateResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Nota për "${subjectName}" ekziston tashmë. Përdorni PUT për përditësim.`
      });
    }

   
    const insertQuery = `
      INSERT INTO USER_GRADES (
        USER_ACCOUNT_ID, 
        SUBJECT_NAME, 
        GRADE, 
        YEAR_TAKEN, 
        GRADE_TYPE, 
        IS_MATURA_SUBJECT,
        IS_YEARLY_AVERAGE,
        CREATED_AT, 
        UPDATED_AT
      ) VALUES (
        :userId, 
        :subjectName, 
        :grade, 
        :yearTaken, 
        :gradeType, 
        :isMaturaSubject,
        :isYearlyAverage,
        CURRENT_TIMESTAMP, 
        CURRENT_TIMESTAMP
      )
    `;

    const insertResult = await executeQuery(insertQuery, [
      userId,
      subjectName.trim(),
      gradeNum,
      year,
      gradeType,
      isMaturaSubject,
      isYearlyAverage
    ], { autoCommit: true });

    console.log('✅ Grade inserted successfully:', {
      subjectName: subjectName.trim(),
      grade: gradeNum,
      gradeType
    });

    res.status(201).json({
      success: true,
      message: `Nota "${subjectName}" u shtua me sukses`,
      data: {
        gradeId: insertResult.lastRowid || 'unknown',
        subjectName: subjectName.trim(),
        grade: gradeNum,
        yearTaken: year,
        gradeType,
        isMaturaSubject
      }
    });

  } catch (error) {
    console.error('❌ Error adding grade:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në shtimin e notës',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


const updateGrade = async (req, res) => {
  try {
    const userId = req.user.userId;
    const gradeId = req.params.gradeId;
    const { subjectName, grade, yearTaken, gradeType, isMaturaSubject } = req.body;

    if (!subjectName || subjectName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Emri i lëndës është i detyrueshëm'
      });
    }

    if (grade === null || grade === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Nota është e detyrueshme'
      });
    }

    const gradeNum = parseFloat(grade);
    if (isNaN(gradeNum)) {
      return res.status(400).json({
        success: false,
        message: 'Nota duhet të jetë një numër i vlefshëm'
      });
    }

 
    const typeConfig = GRADE_TYPES[gradeType || 'subject'] || GRADE_TYPES['subject'];
    if (gradeNum < typeConfig.minGrade || gradeNum > typeConfig.maxGrade) {
      return res.status(400).json({
        success: false,
        message: `Nota për ${typeConfig.description} duhet të jetë midis ${typeConfig.minGrade} dhe ${typeConfig.maxGrade}`
      });
    }
    const checkQuery = `
      SELECT GRADE_ID 
      FROM USER_GRADES 
      WHERE GRADE_ID = :gradeId AND USER_ACCOUNT_ID = :userId
    `;
    
    const checkResult = await executeQuery(checkQuery, [gradeId, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nota nuk u gjet ose nuk keni të drejtë ta modifikoni'
      });
    }

    // Update grade 
    const updateQuery = `
      UPDATE USER_GRADES 
      SET 
        SUBJECT_NAME = :subjectName,
        GRADE = :grade,
        YEAR_TAKEN = :yearTaken,
        GRADE_TYPE = :gradeType,
        IS_MATURA_SUBJECT = :isMaturaSubject,
        IS_YEARLY_AVERAGE = :isYearlyAverage,
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE GRADE_ID = :gradeId AND USER_ACCOUNT_ID = :userId
    `;

    const isYearlyAverage = (gradeType === 'yearly') ? 1 : 0;

    await executeQuery(updateQuery, [
      subjectName.trim(),
      gradeNum,
      yearTaken || new Date().getFullYear(),
      gradeType || 'subject',
      isMaturaSubject !== undefined ? parseInt(isMaturaSubject) : 0,
      isYearlyAverage,
      gradeId,
      userId
    ], { autoCommit: true });

    res.json({
      success: true,
      message: `Nota "${subjectName}" u përditësua me sukses`
    });

  } catch (error) {
    console.error('Error updating grade:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në përditësimin e notës',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete grade
const deleteGrade = async (req, res) => {
  try {
    const userId = req.user.userId;
    const gradeId = req.params.gradeId;

    const checkQuery = `
      SELECT SUBJECT_NAME 
      FROM USER_GRADES 
      WHERE GRADE_ID = :gradeId AND USER_ACCOUNT_ID = :userId
    `;
    
    const checkResult = await executeQuery(checkQuery, [gradeId, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nota nuk u gjet ose nuk keni të drejtë ta fshini'
      });
    }

    const subjectName = checkResult.rows[0].SUBJECT_NAME;

    // Delete grade
    const deleteQuery = `
      DELETE FROM USER_GRADES 
      WHERE GRADE_ID = :gradeId AND USER_ACCOUNT_ID = :userId
    `;

    await executeQuery(deleteQuery, [gradeId, userId], { autoCommit: true });

    res.json({
      success: true,
      message: `Nota "${subjectName}" u fshi me sukses`
    });

  } catch (error) {
    console.error('Error deleting grade:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në fshirjen e notës',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getGradeStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const statsQuery = `
      SELECT 
        COUNT(*) as totalGrades,
        ROUND(AVG(GRADE), 2) as overallAverage,
        MIN(GRADE) as lowestGrade,
        MAX(GRADE) as highestGrade,
        SUM(GRADE) as totalPoints,
        COUNT(CASE WHEN IS_MATURA_SUBJECT = 1 THEN 1 END) as maturaSubjects,
        ROUND(AVG(CASE WHEN IS_MATURA_SUBJECT = 1 THEN GRADE END), 2) as maturaAverage,
        COUNT(CASE WHEN GRADE_TYPE = 'yearly' OR IS_YEARLY_AVERAGE = 1 THEN 1 END) as yearlyGrades,
        ROUND(AVG(CASE WHEN GRADE_TYPE = 'yearly' OR IS_YEARLY_AVERAGE = 1 THEN GRADE END), 2) as yearlyAverage,
        COUNT(CASE WHEN GRADE_TYPE = 'vkm' OR GRADE_TYPE = 'average' THEN 1 END) as vkmGrades,
        AVG(CASE WHEN GRADE_TYPE = 'vkm' OR GRADE_TYPE = 'average' THEN GRADE END) as vkmAverage
      FROM USER_GRADES 
      WHERE USER_ACCOUNT_ID = :userId
    `;

    const result = await executeQuery(statsQuery, [userId]);
    
    const stats = result.rows[0] || {};

    const distributionQuery = `
      SELECT 
        GRADE_TYPE,
        COUNT(*) as count,
        ROUND(AVG(GRADE), 2) as average
      FROM USER_GRADES 
      WHERE USER_ACCOUNT_ID = :userId
      GROUP BY GRADE_TYPE
      ORDER BY count DESC
    `;

    const distributionResult = await executeQuery(distributionQuery, [userId]);
    const distribution = distributionResult.rows || [];

    res.json({
      success: true,
      data: {
        totalGrades: parseInt(stats.totalGrades) || 0,
        overallAverage: parseFloat(stats.overallAverage) || 0,
        lowestGrade: parseFloat(stats.lowestGrade) || 0,
        highestGrade: parseFloat(stats.highestGrade) || 0,
        totalPoints: parseFloat(stats.totalPoints) || 0,
        maturaSubjects: parseInt(stats.maturaSubjects) || 0,
        maturaAverage: parseFloat(stats.maturaAverage) || 0,
        yearlyGrades: parseInt(stats.yearlyGrades) || 0,
        yearlyAverage: parseFloat(stats.yearlyAverage) || 0,
        vkmGrades: parseInt(stats.vkmGrades) || 0,
        vkmAverage: parseFloat(stats.vkmAverage) || 0,
        distribution: distribution.map(d => ({
          type: d.GRADE_TYPE,
          count: parseInt(d.count),
          average: parseFloat(d.average)
        }))
      },
      message: 'Statistikat u ngarkuan me sukses'
    });

  } catch (error) {
    console.error('Error fetching grade statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në marrjen e statistikave',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const bulkSaveGrades = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { grades } = req.body;

    if (!Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lista e notave është e detyrueshme dhe duhet të ketë të paktën një element'
      });
    }

    const results = [];
    const errors = [];

    
    for (let i = 0; i < grades.length; i++) {
      const gradeData = grades[i];
      
      try {
       
        if (!gradeData.subjectName || gradeData.grade === null || gradeData.grade === undefined) {
          errors.push(`Nota ${i + 1}: Emri i lëndës dhe nota janë të detyrueshme`);
          continue;
        }

        const gradeNum = parseFloat(gradeData.grade);
        if (isNaN(gradeNum) || gradeNum < 4 || gradeNum > 10) {
          errors.push(`Nota ${i + 1}: Nota duhet të jetë midis 4 dhe 10`);
          continue;
        }

        const insertQuery = `
          INSERT INTO USER_GRADES (
            USER_ACCOUNT_ID, SUBJECT_NAME, GRADE, YEAR_TAKEN, 
            GRADE_TYPE, IS_MATURA_SUBJECT, IS_YEARLY_AVERAGE, CREATED_AT, UPDATED_AT
          ) VALUES (
            :userId, :subjectName, :grade, :yearTaken,
            :gradeType, :isMaturaSubject, :isYearlyAverage, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
        `;

        const isYearlyAverage = (gradeData.gradeType === 'yearly') ? 1 : 0;

        await executeQuery(insertQuery, [
          userId,
          gradeData.subjectName.trim(),
          gradeNum,
          gradeData.yearTaken || new Date().getFullYear(),
          gradeData.gradeType || 'subject',
          gradeData.isMaturaSubject || 0,
          isYearlyAverage
        ], { autoCommit: true });

        results.push({
          subjectName: gradeData.subjectName,
          grade: gradeNum,
          status: 'success'
        });

      } catch (err) {
        console.error(`Error processing grade ${i + 1}:`, err);
        errors.push(`Nota ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      success: errors.length === 0,
      message: errors.length === 0 
        ? `${results.length} nota u ruajtën me sukses`
        : `${results.length} nota u ruajtën, ${errors.length} gabime`,
      data: {
        saved: results.length,
        errors: errors.length,
        details: results,
        errorMessages: errors
      }
    });

  } catch (error) {
    console.error('Error bulk saving grades:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në ruajtjen e notave',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const calculateGradeSummary = (grades) => {
  if (!grades || grades.length === 0) {
    return {
      totalGrades: 0,
      overallAverage: 0,
      maturaAverage: 0,
      yearlyAverage: 0,
      vkmAverage: 0,
      highestGrade: 0,
      lowestGrade: 0
    };
  }

  const maturaGrades = grades.filter(g => g.isMaturaSubject === 1);
  const yearlyGrades = grades.filter(g => g.gradeType === 'yearly');
  const vkmGrades = grades.filter(g => g.gradeType === 'vkm' || g.gradeType === 'average');
  
  const allGrades = grades.map(g => g.grade);
  
  return {
    totalGrades: grades.length,
    overallAverage: allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length,
    maturaAverage: maturaGrades.length > 0 
      ? maturaGrades.reduce((sum, g) => sum + g.grade, 0) / maturaGrades.length 
      : 0,
    yearlyAverage: yearlyGrades.length > 0
      ? yearlyGrades.reduce((sum, g) => sum + g.grade, 0) / yearlyGrades.length
      : 0,
    vkmAverage: vkmGrades.length > 0
      ? vkmGrades.reduce((sum, g) => sum + g.grade, 0) / vkmGrades.length
      : 0,
    highestGrade: Math.max(...allGrades),
    lowestGrade: Math.min(...allGrades)
  };
};

module.exports = {
  getUserGrades,
  addGrade,
  updateGrade,
  deleteGrade,
  getGradeStats,
  bulkSaveGrades,
  GRADE_TYPES
};