
// backend/controllers/recommendationController.js 
const { executeQuery } = require('../config/database');
const Career = require('../models/Career');

const cleanObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    if (Array.isArray(obj)) {
      return obj.map(item => {
        if (typeof item === 'object' && item !== null) {
          const cleaned = {};
          for (const [key, value] of Object.entries(item)) {
            if (typeof value !== 'object' || value === null) {
              cleaned[key] = value;
            } else if (Array.isArray(value)) {
              cleaned[key] = value.filter(v => typeof v !== 'object' || v === null);
            }
          }
          return cleaned;
        }
        return item;
      });
    } else {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value !== 'object' || value === null) {
          cleaned[key] = value;
        } else if (Array.isArray(value)) {
          cleaned[key] = value.filter(v => typeof v !== 'object' || v === null);
        }
      }
      return cleaned;
    }
  }
};

const getUserGrades = async (userId) => {
  try {
    const sql = `
      SELECT 
        GRADE_ID,
        USER_ACCOUNT_ID,
        SUBJECT_NAME,
        GRADE,
        YEAR_TAKEN,
        GRADE_TYPE,
        IS_YEARLY_AVERAGE,
        IS_MATURA_SUBJECT,
        CREATED_AT,
        UPDATED_AT
      FROM USER_GRADES 
      WHERE USER_ACCOUNT_ID = :1 
      ORDER BY CREATED_AT DESC
    `;
    
    const result = await executeQuery(sql, [userId]);
    return cleanObject(result.rows || []);
  } catch (error) {
    console.error('Gabim në marrjen e notave:', error);
    return [];
  }
};

const getUserTestResults = async (userId) => {
  try {
    const sql = `
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
      ORDER BY tr.COMPLETED_AT DESC
    `;
    
    const result = await executeQuery(sql, [userId]);
    return cleanObject(result.rows || []);
  } catch (error) {
    console.error('Gabim në marrjen e testeve:', error);
    return [];
  }
};


const debugUserTestData = async (userId) => {
  try {
    console.log('\n=== DEBUGGING TEST DATA FOR USER:', userId, '===');
    
    const sql = `
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
      ORDER BY tr.COMPLETED_AT DESC
    `;
    
    const result = await executeQuery(sql, [userId]);
    
    console.log('\n--- RAW DATABASE RESULTS ---');
    console.log('Total test results found:', result.rows.length);
    
    result.rows.forEach((test, index) => {
      console.log(`\nTest ${index + 1}:`);
      console.log('- RESULT_ID:', test.RESULT_ID);
      console.log('- TEST_ID:', test.TEST_ID);
      console.log('- TEST_NAME:', test.TEST_NAME);
      console.log('- TEST_TYPE:', test.TEST_TYPE);
      console.log('- SCORE:', test.SCORE);
      console.log('- RESULT_DETAILS type:', typeof test.RESULT_DETAILS);
      console.log('- RESULT_DETAILS raw:', test.RESULT_DETAILS);
      
      if (test.RESULT_DETAILS) {
        try {
          if (typeof test.RESULT_DETAILS === 'string') {
            const parsed = JSON.parse(test.RESULT_DETAILS);
            console.log('- RESULT_DETAILS parsed:', JSON.stringify(parsed, null, 2));
          } else if (typeof test.RESULT_DETAILS === 'object') {
            console.log('- RESULT_DETAILS object:', JSON.stringify(test.RESULT_DETAILS, null, 2));
          }
        } catch (parseError) {
          console.log('- RESULT_DETAILS parse error:', parseError.message);
        }
      }
      
      console.log('- COMPLETED_AT:', test.COMPLETED_AT);
    });
    
    console.log('\n=== END DEBUG ===\n');
    
    return result.rows;
  } catch (error) {
    console.error('Error in debug function:', error);
    return [];
  }
};


const getDynamicCareerMatches = async (testResults) => {
  try {
    console.log('Duke gjeneruar rekomandime dinamike karriere...');
    
    if (!testResults || testResults.length < 3) {
      console.log('Nuk ka rezultate të mjaftueshme testesh:', testResults.length);
      return getFallbackCareerRecommendations();
    }

  
    console.log('\nANALIZOJ REZULTATET E TESTEVE:');
    testResults.forEach((test, index) => {
      console.log(`\n--- Test ${index + 1}: ${test.TEST_NAME} ---`);
      console.log('Type:', test.TEST_TYPE);
      console.log('Score:', test.SCORE);
      console.log('Raw RESULT_DETAILS:', test.RESULT_DETAILS);
      
      let detailedScores = null;
      if (test.RESULT_DETAILS) {
        try {
          if (typeof test.RESULT_DETAILS === 'string') {
            detailedScores = JSON.parse(test.RESULT_DETAILS);
          } else {
            detailedScores = test.RESULT_DETAILS;
          }
          
          console.log('Parsed details:', JSON.stringify(detailedScores, null, 2));
          
          if (detailedScores.answers) {
            console.log('User answers found:', detailedScores.answers);
          }
          if (detailedScores.scores) {
            console.log('Detailed scores found:', detailedScores.scores);
          }
          if (detailedScores.preferences) {
            console.log('User preferences found:', detailedScores.preferences);
          }
          
        } catch (e) {
          console.log('Parse error:', e.message);
        }
      } else {
        console.log('No RESULT_DETAILS found');
      }
    });

    console.log('\nGJENEROJ REKOMANDIME TË THJESHTA...');
    
    const careers = await Career.getAllCareers();
    if (careers.length === 0) {
      return getFallbackCareerRecommendations();
    }

    
    const recommendations = careers.map(career => {
      const careerName = career.CAREER_NAME.toLowerCase();
      let matchScore = 50; 
      let reasons = [];
      
      testResults.forEach(test => {
        const testName = (test.TEST_NAME || '').toLowerCase();
        const testType = (test.TEST_TYPE || '').toLowerCase();
        const score = parseFloat(test.SCORE || 0);
        
        
        if (score >= 70) {

          if (testName.includes('teknologi') || testName.includes('kompjuter') || testType.includes('technical')) {
            if (careerName.includes('software') || careerName.includes('programues') || careerName.includes('it')) {
              matchScore += 15;
              reasons.push('Score i lartë në teste teknike');
            }
          }
          
          
          if (testName.includes('social') || testName.includes('njerëz') || testType.includes('social')) {
            if (careerName.includes('mesues') || careerName.includes('infermier') || careerName.includes('psikolog')) {
              matchScore += 15;
              reasons.push('Përshtatet me karakterin tuaj social');
            }
          }
          
        
          if (testName.includes('kreativ') || testName.includes('art') || testType.includes('creative')) {
            if (careerName.includes('dizajner') || careerName.includes('artist') || careerName.includes('arkitekt')) {
              matchScore += 15;
              reasons.push('Përshtatet me kreativitetin tuaj');
            }
          }
          
        
          if (testName.includes('analiz') || testName.includes('matematik') || testType.includes('analytical')) {
            if (careerName.includes('inxhinier') || careerName.includes('economist') || careerName.includes('analiz')) {
              matchScore += 15;
              reasons.push('Aftësi analitike të mira');
            }
          }
        } else if (score < 50) {
         
          if (testName.includes('matematik') || testName.includes('shkenc')) {
            if (careerName.includes('inxhinier') || careerName.includes('matematik') || careerName.includes('fizik')) {
              matchScore -= 10;
              reasons.push('Rezultat i ulët në teste të ngjashme');
            }
          }
        }
      });
      
      
      matchScore += (Math.random() * 10) - 5;
      matchScore = Math.max(30, Math.min(100, matchScore));
      
      if (reasons.length === 0) {
        reasons.push('Bazuar në profilin e përgjithshëm nga testet');
      }
      
      return {
        id: career.CAREER_ID,
        careerId: career.CAREER_ID,
        title: career.CAREER_NAME,
        description: career.CAREER_DESCRIPTION || 'Përshkrim i karrierës',
        category: career.CATEGORY,
        matchScore: Math.round(matchScore),
        matchReason: reasons.slice(0, 2).join('. ') + '.',
        salaryRange: Career.formatSalary(career.AVERAGE_SALARY),
        jobOutlook: career.JOB_OUTLOOK,
        educationLevel: career.REQUIRED_EDUCATION,
        skills: Career.parseSkills(career.SKILLS_REQUIRED),
        type: 'career'
      };
    });

   
    const filteredRecommendations = recommendations
      .filter(rec => rec.matchScore >= 40)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    console.log(`Generated ${filteredRecommendations.length} recommendations`);
    
    if (filteredRecommendations.length === 0) {
      console.log('No recommendations passed filter, using fallback');
      return getFallbackCareerRecommendations();
    }

    return filteredRecommendations;

  } catch (error) {
    console.error('Error in career matching:', error);
    return getFallbackCareerRecommendations();
  }
};


const getFallbackCareerRecommendations = () => {
  console.log('Using guaranteed fallback career recommendations');
  
  const defaultCareers = [
    {
      id: 1,
      careerId: 1,
      title: 'Zhvillues Software',
      description: 'Zhvillimi i aplikacioneve dhe sistemeve kompjuterike me teknologji moderne',
      category: 'Teknologji',
      matchScore: 85,
      matchReason: 'Teknologjia është një fushë me rritje të shpejtë me mundësi të shkëlqyera pune.',
      salaryRange: { min: 600, max: 1200, currency: 'EUR', period: 'month', display: '600 - 1200 EUR/muaj' },
      jobOutlook: 'Shumë i Lartë',
      educationLevel: 'Bachelor në Informatikë',
      skills: ['Programim', 'JavaScript', 'Python', 'Problem Solving'],
      type: 'career'
    },
    {
      id: 2,
      careerId: 2,
      title: 'Mësues i Arsimit Fillor',
      description: 'Edukim dhe zhvillim i fëmijëve në nivelin e arsimit fillor',
      category: 'Arsim',
      matchScore: 78,
      matchReason: 'Arsimi është një profesion i rëndësishëm që ofron kënaqësi personale të lartë.',
      salaryRange: { min: 350, max: 600, currency: 'EUR', period: 'month', display: '350 - 600 EUR/muaj' },
      jobOutlook: 'I Lartë',
      educationLevel: 'Bachelor në Psiko-Pedagogjik',
      skills: ['Komunikim', 'Durim', 'Kreativitet', 'Organizim'],
      type: 'career'
    },
    {
      id: 3,
      careerId: 3,
      title: 'Menaxher Marketing',
      description: 'Zhvillimi dhe implementimi i strategjive të marketingut',
      category: 'Biznes',
      matchScore: 72,
      matchReason: 'Marketing-u kombinon kreativitetin me analizën strategjike të biznesit.',
      salaryRange: { min: 500, max: 900, currency: 'EUR', period: 'month', display: '500 - 900 EUR/muaj' },
      jobOutlook: 'I Lartë',
      educationLevel: 'Bachelor në Marketing',
      skills: ['Kreativitet', 'Analiza', 'Komunikim', 'Social Media'],
      type: 'career'
    },
    {
      id: 4,
      careerId: 4,
      title: 'Infermier i Regjistruar',
      description: 'Ofrimi i kujdesit shëndetësor të cilësisë së lartë',
      category: 'Shëndetësi',
      matchScore: 75,
      matchReason: 'Infermieristika ofron mundësinë për të ndihmuar të tjerët dhe ka kërkesë të lartë.',
      salaryRange: { min: 400, max: 700, currency: 'EUR', period: 'month', display: '400 - 700 EUR/muaj' },
      jobOutlook: 'Shumë i Lartë',
      educationLevel: 'Bachelor në Infermieri',
      skills: ['Kujdes Pacienti', 'Komunikim', 'Empati', 'Vendimmarrje'],
      type: 'career'
    },
    {
      id: 5,
      careerId: 5,
      title: 'Inxhinier Civil',
      description: 'Projektimi dhe mbikëqyrja e infrastrukturës',
      category: 'Inxhinieri',
      matchScore: 70,
      matchReason: 'Inxhinieria civile kombinon matematikën me zgjidhjen praktike të problemeve.',
      salaryRange: { min: 550, max: 1000, currency: 'EUR', period: 'month', display: '550 - 1000 EUR/muaj' },
      jobOutlook: 'I Lartë',
      educationLevel: 'Bachelor në Inxhinieri Civile',
      skills: ['Matematikë', 'Projektim', 'AutoCAD', 'Analiza'],
      type: 'career'
    },
    {
      id: 6,
      careerId: 6,
      title: 'Psikolog Klinik',
      description: 'Vlerësimi dhe trajtimi i problemeve të shëndetit mendor',
      category: 'Shëndetësi',
      matchScore: 68,
      matchReason: 'Psikologjia ofron mundësinë për të ndihmuar njerëzit të përmirësojnë jetën e tyre.',
      salaryRange: { min: 450, max: 800, currency: 'EUR', period: 'month', display: '450 - 800 EUR/muaj' },
      jobOutlook: 'I Lartë',
      educationLevel: 'Master në Psikologji',
      skills: ['Empati', 'Komunikim', 'Analiza', 'Këshillim'],
      type: 'career'
    }
  ];

  return defaultCareers;
};

const getSimpleUniversityMatches = async (userGrades) => {
  try {
    const averageGrade = userGrades.reduce((sum, grade) => sum + parseFloat(grade.GRADE || 0), 0) / userGrades.length;
    console.log(`Mesatarja e përdoruesit: ${averageGrade.toFixed(2)}`);

    const universitiesResult = await executeQuery(`
      SELECT 
        u.UNIVERSITY_ID, 
        u.UNIVERSITY_NAME, 
        u.LOCATION, 
        u.UNIVERSITY_TYPE,
        u.WEBSITE,
        p.PROGRAM_ID,
        p.PROGRAM_NAME, 
        p.FACULTY, 
        p.DURATION_YEARS, 
        p.MIN_GRADE,
        p.TUITION_FEE,
        p.LANGUAGE,
        p.DESCRIPTION
      FROM UNIVERSITIES u
      LEFT JOIN PROGRAMS p ON u.UNIVERSITY_ID = p.UNIVERSITY_ID
      WHERE u.IS_ACTIVE = 1 AND p.IS_ACTIVE = 1
      ORDER BY u.UNIVERSITY_NAME, p.PROGRAM_NAME
    `);

    const cleanedUniversities = cleanObject(universitiesResult.rows || []);
    const recommendations = [];

    for (const uni of cleanedUniversities) {
      const minGrade = parseFloat(uni.MIN_GRADE || 6.0);
      const gradeGap = minGrade - averageGrade;

      let shouldInclude = false;
      let gradeStatus = '';
      let matchScore = 0;
      let priority = 0;

      if (averageGrade >= minGrade) {
        shouldInclude = true;
        gradeStatus = 'eligible';
        matchScore = 90 + Math.min(10, (averageGrade - minGrade) * 5);
        priority = 1;
      } else if (gradeGap <= 0.5) {
        shouldInclude = true;
        gradeStatus = 'close';
        matchScore = 75 - (gradeGap * 20);
        priority = 2;
      } else if (gradeGap <= 1.0) {
        shouldInclude = true;
        gradeStatus = 'needs_improvement';
        matchScore = 60 - (gradeGap * 15);
        priority = 3;
      } else if (gradeGap <= 1.5 && averageGrade >= 7.0) {
        shouldInclude = true;
        gradeStatus = 'consider_alternatives';
        matchScore = 45 - (gradeGap * 10);
        priority = 4;
      }

      if (shouldInclude) {
        let matchReason = '';
        if (gradeStatus === 'eligible') {
          const excess = averageGrade - minGrade;
          if (excess >= 1.0) {
            matchReason = `Ju keni nota të shkëlqyera (${averageGrade.toFixed(1)}) që tejkalojnë kërkesat (${minGrade}). Ky është një zgjedhje i sigurt për ju.`;
          } else {
            matchReason = `Ju plotësoni kërkesat e notave (${averageGrade.toFixed(1)} vs ${minGrade}). Keni shanse të mira për pranmin.`;
          }
        } else if (gradeStatus === 'close') {
          matchReason = `Jeni shumë afër kritereve (ju duhen vetëm ${gradeGap.toFixed(1)} pikë më shumë). Me pak përpjekje shtesë, mund ta arrini.`;
        } else if (gradeStatus === 'needs_improvement') {
          matchReason = `Duhet të përmirësoni notat (ju duhen ${gradeGap.toFixed(1)} pikë më shumë), por është e mundur me punë të fokusuar.`;
        } else {
          matchReason = `Konsideroni këtë si qëllim afatgjatë. Fokusohuni në përmirësimin e notave për të rritur shanset.`;
        }

        const universityRec = cleanObject({
          id: `${uni.UNIVERSITY_ID}-${uni.PROGRAM_ID}`,
          universityId: uni.UNIVERSITY_ID,
          programId: uni.PROGRAM_ID,
          universityName: uni.UNIVERSITY_NAME,
          location: uni.LOCATION,
          type: uni.UNIVERSITY_TYPE === 'PUBLIC' ? 'public' : 'private',
          program: uni.PROGRAM_NAME,
          faculty: uni.FACULTY,
          duration: uni.DURATION_YEARS,
          tuitionFee: uni.TUITION_FEE || (uni.UNIVERSITY_TYPE === 'PUBLIC' ? 0 : 2000),
          language: uni.LANGUAGE || 'Shqip',
          matchScore: Math.round(matchScore),
          matchReason: matchReason,
          gradeStatus: gradeStatus,
          gradeGap: gradeGap > 0 ? gradeGap : 0,
          meetsGradeRequirement: averageGrade >= minGrade,
          minGradeRequired: minGrade,
          userAverage: averageGrade,
          priority: priority,
          type: 'university'
        });

        recommendations.push(universityRec);
      }
    }

    recommendations.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return b.matchScore - a.matchScore;
    });

    return recommendations;

  } catch (error) {
    console.error('Gabim në rekomandime universiteti:', error);
    return [];
  }
};

const getCombinedRecommendations = async (userGrades, testResults) => {
  try {
    console.log('Duke gjeneruar rekomandime të kombinuara me prerje...');
    
    const allGrades = userGrades.filter(g => !g.IS_MATURA_SUBJECT);
    const maturaGrades = userGrades.filter(g => g.IS_MATURA_SUBJECT);
    
    const averageGrade = allGrades.length > 0 ? 
      allGrades.reduce((sum, grade) => sum + parseFloat(grade.GRADE || 0), 0) / allGrades.length : 0;
    
    const maturaAverage = maturaGrades.length > 0 ? 
      maturaGrades.reduce((sum, grade) => sum + parseFloat(grade.GRADE || 0), 0) / maturaGrades.length : averageGrade;
    
    console.log(`Mesatarja 3-vjeçare: ${averageGrade.toFixed(2)}`);
    console.log(`Mesatarja e Maturës: ${maturaAverage.toFixed(2)}`);
    
    let testScore = 0;
    if (testResults.length >= 3) {
      const totalTestScore = testResults.reduce((sum, test) => sum + parseFloat(test.SCORE || 0), 0);
      testScore = totalTestScore / testResults.length;
    }
    console.log(`Mesatarja e Testeve: ${testScore.toFixed(2)}`);

    const getFieldsFromTests = (testResults) => {
      const fields = new Set();
      
      testResults.forEach(test => {
        const score = parseFloat(test.SCORE || 0);
        const testName = test.TEST_NAME?.toLowerCase() || '';
        
        if (score >= 70) {
          if (testName.includes('personalitet') || testName.includes('personality')) {
            if (score >= 85) {
              fields.add('Inxhinieri');
              fields.add('Shkenca');
              fields.add('Teknologji');
            } else if (score >= 75) {
              fields.add('Biznes');
              fields.add('Ekonomi');
              fields.add('Menaxhim');
            } else {
              fields.add('Shoqërore');
              fields.add('Gjuhë');
              fields.add('Arte');
            }
          }
          
          if (testName.includes('interes') || testName.includes('interest')) {
            if (score >= 80) {
              fields.add('Kompjuter');
              fields.add('Informatikë');
              fields.add('IT');
            } else if (score >= 70) {
              fields.add('Inxhinieri');
              fields.add('Teknologji');
            }
          }
          
          if (testName.includes('aftësi') || testName.includes('ability')) {
            if (score >= 85) {
              fields.add('Matematik');
              fields.add('Fizikë');
              fields.add('Inxhinieri');
            } else if (score >= 75) {
              fields.add('Shkenca');
              fields.add('Teknologji');
            }
          }
        }
      });
      
      return Array.from(fields);
    };

    const relevantFields = getFieldsFromTests(testResults);
    console.log(`Fushat e identifikuara nga testet: ${relevantFields.join(', ')}`);

    let universityQuery = `
      SELECT 
        u.UNIVERSITY_ID, 
        u.UNIVERSITY_NAME, 
        u.LOCATION, 
        u.UNIVERSITY_TYPE,
        u.WEBSITE,
        p.PROGRAM_ID,
        p.PROGRAM_NAME, 
        p.FACULTY, 
        p.DURATION_YEARS, 
        p.MIN_GRADE,
        p.TUITION_FEE,
        p.LANGUAGE,
        p.DESCRIPTION
      FROM UNIVERSITIES u
      LEFT JOIN PROGRAMS p ON u.UNIVERSITY_ID = p.UNIVERSITY_ID
      WHERE u.IS_ACTIVE = 1 AND p.IS_ACTIVE = 1
    `;

    if (relevantFields.length > 0) {
      const fieldConditions = relevantFields.map(field => 
        `(UPPER(p.PROGRAM_NAME) LIKE '%${field.toUpperCase()}%' OR UPPER(p.FACULTY) LIKE '%${field.toUpperCase()}%')`
      ).join(' OR ');
      
      universityQuery += ` AND (${fieldConditions})`;
    }

    universityQuery += ` ORDER BY u.UNIVERSITY_NAME, p.PROGRAM_NAME`;

    const universitiesResult = await executeQuery(universityQuery);
    const cleanedUniversities = cleanObject(universitiesResult.rows || []);
    
    console.log(`U gjetën ${cleanedUniversities.length} programe që përputhen me interesat`);

    const recommendations = [];

    for (const uni of cleanedUniversities) {
      const minGrade = parseFloat(uni.MIN_GRADE || 6.0);
      
      let gradeScore = 0;
      let maturaScore = 0;
      let testScoreAdjusted = 0;

      if (averageGrade >= minGrade) {
        const excess = averageGrade - minGrade;
        gradeScore = Math.min(100, 70 + (excess * 15));
      } else {
        const deficit = minGrade - averageGrade;
        gradeScore = Math.max(0, 70 - (deficit * 25));
      }

      if (maturaAverage >= minGrade) {
        const excess = maturaAverage - minGrade;
        maturaScore = Math.min(100, 70 + (excess * 15));
      } else {
        const deficit = minGrade - maturaAverage;
        maturaScore = Math.max(0, 70 - (deficit * 25));
      }

      if (testScore >= 80) {
        testScoreAdjusted = 90;
      } else if (testScore >= 70) {
        testScoreAdjusted = 80;
      } else if (testScore >= 60) {
        testScoreAdjusted = 70;
      } else if (testScore >= 50) {
        testScoreAdjusted = 60;
      } else {
        testScoreAdjusted = 40;
      }

      let fieldMatchBonus = 0;
      if (relevantFields.length > 0) {
        const programName = uni.PROGRAM_NAME?.toUpperCase() || '';
        const faculty = uni.FACULTY?.toUpperCase() || '';
        
        const matchingFields = relevantFields.filter(field => 
          programName.includes(field.toUpperCase()) || faculty.includes(field.toUpperCase())
        );
        
        fieldMatchBonus = matchingFields.length > 0 ? 10 : 0;
      }

      const finalScore = (gradeScore * 0.35) + (maturaScore * 0.35) + (testScoreAdjusted * 0.30) + fieldMatchBonus;
      
      if (finalScore >= 50) {
        const gradeGap = Math.max(0, minGrade - Math.max(averageGrade, maturaAverage));
        
        let gradeStatus = '';
        const bestGrade = Math.max(averageGrade, maturaAverage);
        if (bestGrade >= minGrade) gradeStatus = 'eligible';
        else if (gradeGap <= 0.5) gradeStatus = 'close';
        else if (gradeGap <= 1.0) gradeStatus = 'needs_improvement';
        else gradeStatus = 'consider_alternatives';

        let matchReason = '';
        if (finalScore >= 85) {
          matchReason = `Përputhje e shkëlqyer! Kombinimi i notave tuaja (mesatare: ${averageGrade.toFixed(1)}, maturë: ${maturaAverage.toFixed(1)}) dhe rezultatet e testeve (${testScore.toFixed(1)}) tregojnë se ky program është ideal për ju.`;
        } else if (finalScore >= 75) {
          matchReason = `Përputhje e mirë e bazuar në formulën: 35% mesatarja, 35% matura dhe 30% testet. Rezultatet tuaja përputhen me kërkesat e programit.`;
        } else if (finalScore >= 65) {
          matchReason = `Opsion i mirë që kombinon performancën tuaj akademike me interesat nga testet e personalitetit.`;
        } else {
          matchReason = `Mundësi e konsiderueshme bazuar në analizën e plotë të profilit tuaj akademik dhe personal.`;
        }

        const universityRec = cleanObject({
          id: `${uni.UNIVERSITY_ID}-${uni.PROGRAM_ID}`,
          universityId: uni.UNIVERSITY_ID,
          programId: uni.PROGRAM_ID,
          universityName: uni.UNIVERSITY_NAME,
          location: uni.LOCATION,
          type: uni.UNIVERSITY_TYPE === 'PUBLIC' ? 'public' : 'private',
          program: uni.PROGRAM_NAME,
          faculty: uni.FACULTY,
          duration: uni.DURATION_YEARS,
          tuitionFee: uni.TUITION_FEE || (uni.UNIVERSITY_TYPE === 'PUBLIC' ? 0 : 2000),
          language: uni.LANGUAGE || 'Shqip',
          matchScore: Math.round(finalScore),
          matchReason: matchReason,
          gradeStatus: gradeStatus,
          gradeGap: gradeGap,
          meetsGradeRequirement: bestGrade >= minGrade,
          minGradeRequired: minGrade,
          userAverage: averageGrade,
          maturaAverage: maturaAverage,
          testAverage: testScore,
          type: 'university'
        });

        recommendations.push(universityRec);
      }
    }

    recommendations.sort((a, b) => b.matchScore - a.matchScore);
    
    console.log(`U gjeneruan ${recommendations.length} rekomandime të kombinuara me prerje`);
    console.log(`Formula: 35% mesatare (${averageGrade.toFixed(1)}) + 35% maturë (${maturaAverage.toFixed(1)}) + 30% teste (${testScore.toFixed(1)})`);
    
    return recommendations;

  } catch (error) {
    console.error('Gabim në rekomandime të kombinuara:', error);
    return [];
  }
};

const getSmartRecommendations = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Nuk jeni i autentifikuar',
        error: 'NO_USER_ID'
      });
    }

    const { type = 'all', source = 'auto' } = req.query;
    
    console.log('Duke marrë rekomandimet për përdorues:', userId, 'type:', type, 'source:', source);

    let testResults = [];
    let userGrades = [];

    try {
      [testResults, userGrades] = await Promise.all([
        getUserTestResults(userId),
        getUserGrades(userId)
      ]);
    } catch (dataError) {
      console.error('Gabim në marrjen e të dhënave:', dataError);
      return res.status(500).json({
        success: false,
        message: 'Gabim në marrjen e të dhënave të përdoruesit',
        error: dataError.message
      });
    }

    console.log(`Përdoruesi ka ${testResults.length} teste dhe ${userGrades.length} nota`);

    const cleanedTestResults = cleanObject(testResults);
    const cleanedUserGrades = cleanObject(userGrades);

    const recommendations = {
      career: [],
      university: []
    };

    
    if ((type === 'all' || type === 'career') && cleanedTestResults.length >= 3) {
      try {
        recommendations.career = await getDynamicCareerMatches(cleanedTestResults);
        console.log(`Gjeneruar ${recommendations.career.length} rekomandime karriere`);
      } catch (careerError) {
        console.error('Gabim në karrierat:', careerError);
      }
    }

    if ((type === 'all' || type === 'university') && cleanedUserGrades.length > 0) {
      try {
        if (source === 'both' && cleanedTestResults.length >= 3) {
          recommendations.university = await getCombinedRecommendations(cleanedUserGrades, cleanedTestResults);
        } else {
          recommendations.university = await getSimpleUniversityMatches(cleanedUserGrades);
        }
      } catch (universityError) {
        console.error('Gabim në universitetet:', universityError);
      }
    }

    const cleanResponse = cleanObject({
      success: true,
      data: recommendations,
      meta: {
        hasTests: cleanedTestResults.length >= 3,
        hasGrades: cleanedUserGrades.length > 0,
        source: source,
        canGetCareer: cleanedTestResults.length >= 3,
        canGetUniversity: cleanedUserGrades.length > 0,
        totalCareer: recommendations.career.length,
        totalUniversity: recommendations.university.length,
        totalRecommendations: recommendations.career.length + recommendations.university.length,
        testResultsCount: cleanedTestResults.length,
        gradesCount: cleanedUserGrades.length,
        averageGrade: cleanedUserGrades.length > 0 ? 
          (cleanedUserGrades.reduce((sum, grade) => sum + parseFloat(grade.GRADE || 0), 0) / cleanedUserGrades.length) : null
      }
    });

    console.log(`U gjeneruan ${cleanResponse.meta.totalRecommendations} rekomandime gjithsej`);
    
    res.json(cleanResponse);

  } catch (error) {
    console.error('GABIM KRITIK në getSmartRecommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në server',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};


const generateCareerRecommendations = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Nuk jeni i autentifikuar'
      });
    }

    console.log('Duke gjeneruar rekomandime karriere për përdorues:', userId);

    const testResults = await getUserTestResults(userId);
    const cleanedTestResults = cleanObject(testResults);
    
    if (cleanedTestResults.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Ju duhet të plotësoni të gjitha 3 testet për të marrë rekomandime karriere',
        requiredTests: 3,
        completedTests: cleanedTestResults.length,
        missingTests: 3 - cleanedTestResults.length
      });
    }

    const recommendations = await getDynamicCareerMatches(cleanedTestResults);
    const cleanedRecommendations = cleanObject(recommendations);

    const response = cleanObject({
      success: true,
      message: `U gjeneruan ${cleanedRecommendations.length} rekomandime karriere`,
      data: cleanedRecommendations,
      meta: {
        totalRecommendations: cleanedRecommendations.length,
        testResultsCount: cleanedTestResults.length,
        source: 'dynamic_algorithm',
        type: 'career'
      }
    });

    console.log(`U gjeneruan ${cleanedRecommendations.length} rekomandime karriere me algoritëm të përmirësuar`);
    res.json(response);

  } catch (error) {
    console.error('Gabim në gjenerimin e rekomandimeve të karrierës:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në gjenerimin e rekomandimeve të karrierës',
      error: error.message
    });
  }
};

const generateUniversityRecommendations = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Nuk jeni i autentifikuar'
      });
    }

    const { source = 'both' } = req.body;
    console.log('Duke gjeneruar rekomandime universiteti për përdorues:', userId);

    const [testResults, userGrades] = await Promise.all([
      getUserTestResults(userId),
      getUserGrades(userId)
    ]);

    const cleanedTestResults = cleanObject(testResults);
    const cleanedUserGrades = cleanObject(userGrades);

    if (cleanedUserGrades.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ju duhet të shtoni notat tuaja për rekomandime universiteti',
        requiresGrades: true,
        hasGrades: false,
        gradesCount: 0
      });
    }

    let recommendations;
    if (source === 'both' && cleanedTestResults.length >= 3) {
      recommendations = await getCombinedRecommendations(cleanedUserGrades, cleanedTestResults);
    } else {
      recommendations = await getSimpleUniversityMatches(cleanedUserGrades);
    }

    const cleanedRecommendations = cleanObject(recommendations);

    const response = cleanObject({
      success: true,
      message: `U gjeneruan ${cleanedRecommendations.length} rekomandime universiteti`,
      data: cleanedRecommendations,
      meta: {
        totalRecommendations: cleanedRecommendations.length,
        source: source,
        type: 'university',
        averageGrade: cleanedUserGrades.reduce((sum, grade) => sum + parseFloat(grade.GRADE || 0), 0) / cleanedUserGrades.length,
        testResultsCount: cleanedTestResults.length,
        gradesCount: cleanedUserGrades.length
      }
    });

    console.log(`U gjeneruan ${cleanedRecommendations.length} rekomandime universiteti`);
    res.json(response);

  } catch (error) {
    console.error('Gabim në gjenerimin e rekomandimeve të universiteteve:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në gjenerimin e rekomandimeve të universiteteve',
      error: error.message
    });
  }
};

const regenerateAllRecommendations = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Nuk jeni i autentifikuar'
      });
    }

    console.log('Duke rigjeneruar të gjitha rekomandimet për përdorues:', userId);

    req.query = { type: 'all', source: 'both' };
    return getSmartRecommendations(req, res);

  } catch (error) {
    console.error('Gabim në rigjenrimin e rekomandimeve:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në rigjenrimin e rekomandimeve',
      error: error.message
    });
  }
};

const getRecommendationStats = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Nuk jeni i autentifikuar'
      });
    }

    console.log('Duke marrë statistikat për përdorues:', userId);

    const [testResults, userGrades] = await Promise.all([
      getUserTestResults(userId),
      getUserGrades(userId)
    ]);

    const cleanedTestResults = cleanObject(testResults);
    const cleanedUserGrades = cleanObject(userGrades);

    const stats = cleanObject({
      testResults: {
        completed: cleanedTestResults.length,
        required: 3,
        canGenerateCareer: cleanedTestResults.length >= 3,
        completionPercentage: Math.min(100, (cleanedTestResults.length / 3) * 100)
      },
      grades: {
        entered: cleanedUserGrades.length,
        averageGrade: cleanedUserGrades.length > 0 ? 
          parseFloat((cleanedUserGrades.reduce((sum, grade) => sum + parseFloat(grade.GRADE || 0), 0) / cleanedUserGrades.length).toFixed(2)) : null,
        canGenerateUniversity: cleanedUserGrades.length > 0,
        hasMinimumData: cleanedUserGrades.length > 0
      },
      capabilities: {
        careerRecommendations: cleanedTestResults.length >= 3,
        universityRecommendations: cleanedUserGrades.length > 0,
        fullRecommendations: cleanedTestResults.length >= 3 && cleanedUserGrades.length > 0
      }
    });

    const response = cleanObject({
      success: true,
      data: stats,
      meta: {
        userId: userId,
        generatedAt: new Date().toISOString(),
        testResultsCount: cleanedTestResults.length,
        gradesCount: cleanedUserGrades.length
      }
    });

    res.json(response);

  } catch (error) {
    console.error('Gabim në marrjen e statistikave:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në marrjen e statistikave',
      error: error.message
    });
  }
};

const getRecommendations = async (req, res) => {
  try {
    const { type, source } = req.query;
    console.log('Endpoint kryesor i thirrur me type:', type, 'source:', source);

    if (type === 'career') {
      return generateCareerRecommendations(req, res);
    } else if (type === 'university') {
      req.body = req.body || { source: source || 'both' };
      return generateUniversityRecommendations(req, res);
    } else {
      return getSmartRecommendations(req, res);
    }
  } catch (error) {
    console.error('Gabim në endpoint-in kryesor:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në marrjen e rekomandimeve',
      error: error.message
    });
  }
};

module.exports = {
  getRecommendations,
  getSmartRecommendations,
  generateCareerRecommendations,
  generateUniversityRecommendations,
  regenerateAllRecommendations,
  getRecommendationStats
};