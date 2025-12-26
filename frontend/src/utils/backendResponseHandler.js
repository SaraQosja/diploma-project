

// frontend/src/utils/backendResponseHandler.js 

class BackendResponseHandler {
  
  
  static transformRecommendationsResponse(responseData) {
    console.log('🔄 Transforming recommendations response:', responseData);
    
    try {
      if (!responseData) {
        console.warn('⚠️ No response data to transform');
        return {
          success: false,
          data: { career: [], university: [] },
          career: [],
          university: [],
          meta: { totalCareer: 0, totalUniversity: 0 }
        };
      }

      if (responseData.success && responseData.data) {
        const transformed = {
          success: true,
          data: {
            career: Array.isArray(responseData.data.career) ? responseData.data.career : [],
            university: Array.isArray(responseData.data.university) ? responseData.data.university : []
          },
          university: Array.isArray(responseData.data.university) ? responseData.data.university : [], 
          meta: responseData.meta || {
            totalCareer: responseData.data.career?.length || 0,
            totalUniversity: responseData.data.university?.length || 0
          }
        };
        
        console.log('✅ Successfully transformed response:', transformed);
        return transformed;
      }

    
      console.warn('⚠️ Response indicates failure:', responseData);
      return {
        success: false,
        data: { career: [], university: [] },
        career: [],
        university: [],
        meta: { totalCareer: 0, totalUniversity: 0 },
        error: responseData.message || 'Unknown error'
      };

    } catch (error) {
      console.error('❌ Error transforming response:', error);
      return {
        success: false,
        data: { career: [], university: [] },
        career: [],
        university: [],
        meta: { totalCareer: 0, totalUniversity: 0 },
        error: error.message
      };
    }
  }

  static transformRecommendationStats(responseData) {
    console.log('📊 Transforming stats response:', responseData);
    
    try {
      if (!responseData) {
        return null;
      }

      if (responseData.success && responseData.data) {
        return {
          success: true,
          data: responseData.data,
          canGenerateCareer: responseData.data.capabilities?.careerRecommendations || false,
          canGenerateUniversity: responseData.data.capabilities?.universityRecommendations || false,
          canGenerateComplete: responseData.data.capabilities?.fullRecommendations || false,
          completedTests: responseData.data.testResults?.completed || 0,
          hasGrades: responseData.data.grades?.entered > 0 || false
        };
      }

      return responseData;
    } catch (error) {
      console.error('❌ Error transforming stats:', error);
      return null;
    }
  }

 
  static transformCareerRecommendation(career) {
    try {
      return {
        id: career.id || career.careerId || career.CAREER_ID,
        careerId: career.id || career.careerId || career.CAREER_ID,
        title: career.title || career.careerName || career.CAREER_NAME,
        description: career.description || career.careerDescription || career.CAREER_DESCRIPTION,
        category: career.category || career.CATEGORY,
        matchScore: career.matchScore || 0,
        matchReason: career.matchReason || career.reasoning,
        salaryRange: career.salaryRange || career.SALARY_RANGE || career.AVERAGE_SALARY,
        jobOutlook: career.jobOutlook || career.JOB_OUTLOOK,
        educationLevel: career.educationLevel || career.requiredEducation || career.REQUIRED_EDUCATION,
        skills: career.skills || career.SKILLS_REQUIRED || [],
        type: 'career'
      };
    } catch (error) {
      console.error('Error transforming career recommendation:', error);
      return career;
    }
  }

  static transformUniversityRecommendation(university) {
    try {
      return {
        id: university.id || university.universityId || university.UNIVERSITY_ID,
        universityId: university.id || university.universityId || university.UNIVERSITY_ID,
        universityName: university.universityName || university.UNIVERSITY_NAME,
        location: university.location || university.LOCATION,
        type: university.type || university.UNIVERSITY_TYPE || 'public',
        program: university.program || university.PROGRAM_NAME,
        faculty: university.faculty || university.FACULTY,
        duration: university.duration || university.DURATION_YEARS,
        tuitionFee: university.tuitionFee || university.TUITION_FEE,
        language: university.language || university.LANGUAGE || 'Shqip',
        matchScore: university.matchScore || 0,
        matchReason: university.matchReason,
        meetsGradeRequirement: university.meetsGradeRequirement,
        gradeStatus: university.gradeStatus,
        gradeGap: university.gradeGap,
        website: university.website || university.WEBSITE,
        contactInfo: university.contactInfo || university.CONTACT_INFO,
        description: university.description || university.DESCRIPTION,
        careerPaths: university.careerPaths || university.CAREER_PATHS || [],
        facilities: university.facilities || university.FACILITIES || [],
        admissionRequirements: university.admissionRequirements || university.ADMISSION_REQUIREMENTS,
        hasRequiredSubjects: university.hasRequiredSubjects,
        source: university.source,
        type: 'university'
      };
    } catch (error) {
      console.error('Error transforming university recommendation:', error);
      return university;
    }
  }


  static getMatchScoreInterpretation(score) {
    if (score >= 90) return { level: 'excellent', label: 'Shkëlqyeshëm', color: '#10b981', icon: '🌟' };
    if (score >= 80) return { level: 'very_good', label: 'Shumë Mirë', color: '#3b82f6', icon: '⭐' };
    if (score >= 70) return { level: 'good', label: 'Mirë', color: '#f59e0b', icon: '👍' };
    if (score >= 60) return { level: 'fair', label: 'Mesatar', color: '#ef4444', icon: '👌' };
    return { level: 'poor', label: 'I Ulët', color: '#6b7280', icon: '📈' };
  }

  static formatSalaryRange(salary) {
    if (!salary) return 'Nuk specifikohet';
    
    try {
      if (typeof salary === 'number') {
        if (salary > 1000) {
          return `${Math.round(salary/1000)}k - ${Math.round(salary*1.5/1000)}k Euro/vit`;
        } else {
          return `${salary} - ${Math.round(salary*1.5)} Euro/muaj`;
        }
      }
      
      if (typeof salary === 'string') {
        
        const match = salary.match(/\d+/);
        if (match) {
          const num = parseInt(match[0]);
          return this.formatSalaryRange(num);
        }
      }
      
      return String(salary);
    } catch (error) {
      console.error('Error formatting salary:', error);
      return 'Nuk specifikohet';
    }
  }

 
  static formatSkills(skills) {
    try {
      if (!skills) return [];
      
      if (Array.isArray(skills)) {
        return skills.filter(skill => skill && typeof skill === 'string');
      }
      
      if (typeof skills === 'string') {
    
        return skills.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
      }
      
      return [];
    } catch (error) {
      console.error('Error formatting skills:', error);
      return [];
    }
  }

  static formatCareerPaths(careerPaths) {
    try {
      if (!careerPaths) return [];
      
      if (Array.isArray(careerPaths)) {
        return careerPaths.filter(path => path && typeof path === 'string');
      }
      
      if (typeof careerPaths === 'string') {
        return careerPaths.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
      }
      
      return [];
    } catch (error) {
      console.error('Error formatting career paths:', error);
      return [];
    }
  }


  static parseJSON(jsonString, fallback = null) {
    try {
      if (!jsonString) return fallback;
      
      if (typeof jsonString === 'object' && jsonString !== null) {
        return jsonString;
      }
      
      if (typeof jsonString === 'string') {
        return JSON.parse(jsonString);
      }
      
      return fallback;
    } catch (error) {
      console.warn('Failed to parse JSON:', jsonString);
      return fallback;
    }
  }

  
  static formatDate(dateString) {
    try {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      return date.toLocaleDateString('sq-AL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }


  static formatPercentage(value, decimals = 1) {
    try {
      if (value === null || value === undefined) return '0%';
      
      const num = parseFloat(value);
      if (isNaN(num)) return '0%';
      
      return `${num.toFixed(decimals)}%`;
    } catch (error) {
      console.error('Error formatting percentage:', error);
      return '0%';
    }
  }

  static validateRecommendation(recommendation) {
    const required = ['id', 'title', 'type'];
    const missing = required.filter(field => !recommendation[field]);
    
    if (missing.length > 0) {
      console.warn('Recommendation missing required fields:', missing, recommendation);
      return false;
    }
    
    return true;
  }


  static sanitizeHTML(html) {
    try {
      if (!html) return '';
 
      return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/javascript:/gi, '');
    } catch (error) {
      console.error('Error sanitizing HTML:', error);
      return '';
    }
  }

  static transformTestResults(testResults) {
    try {
      if (!Array.isArray(testResults)) return [];
      
      return testResults.map(test => ({
        id: test.RESULT_ID || test.id,
        testId: test.TEST_ID || test.testId,
        testName: test.TEST_NAME || test.testName,
        testType: test.TEST_TYPE || test.testType,
        score: test.SCORE || test.score,
        completedAt: test.COMPLETED_AT || test.completedAt,
        details: this.parseJSON(test.RESULT_DETAILS || test.details, {})
      }));
    } catch (error) {
      console.error('Error transforming test results:', error);
      return [];
    }
  }

 
  static transformUserGrades(grades) {
    try {
      if (!Array.isArray(grades)) return [];
      
      return grades.map(grade => ({
        id: grade.GRADE_ID || grade.id,
        subjectName: grade.SUBJECT_NAME || grade.subjectName,
        grade: parseFloat(grade.GRADE || grade.grade),
        yearTaken: grade.YEAR_TAKEN || grade.yearTaken,
        gradeType: grade.GRADE_TYPE || grade.gradeType,
        isYearlyAverage: grade.IS_YEARLY_AVERAGE || grade.isYearlyAverage,
        isMaturaSubject: grade.IS_MATURA_SUBJECT || grade.isMaturaSubject
      }));
    } catch (error) {
      console.error('Error transforming user grades:', error);
      return [];
    }
  }

  static calculateAverageGrade(grades) {
    try {
      if (!Array.isArray(grades) || grades.length === 0) return 0;
      
      const validGrades = grades
        .map(g => parseFloat(g.grade || g.GRADE))
        .filter(grade => !isNaN(grade) && grade > 0);
      
      if (validGrades.length === 0) return 0;
      
      const sum = validGrades.reduce((total, grade) => total + grade, 0);
      return Math.round((sum / validGrades.length) * 100) / 100;
    } catch (error) {
      console.error('Error calculating average grade:', error);
      return 0;
    }
  }


  static formatGradeStatus(status) {
    const statusMap = {
      'eligible': { label: 'I Pranuar', color: '#10b981', icon: '✅' },
      'close': { label: 'Afër Kritereve', color: '#f59e0b', icon: '⚡' },
      'needs_improvement': { label: 'Duhen Përmirësime', color: '#f97316', icon: '📈' },
      'consider_alternatives': { label: 'Konsidero Alternativa', color: '#8b5cf6', icon: '🎯' }
    };
    
    return statusMap[status] || { label: 'E Panjohur', color: '#6b7280', icon: 'ℹ️' };
  }

  static transformAnalyticsData(analytics) {
    try {
      if (!analytics) return null;
      
      return {
        totalRecommendations: analytics.totalRecommendations || 0,
        byType: {
          career: analytics.byType?.career || 0,
          university: analytics.byType?.university || 0
        },
        byMatchScore: {
          excellent: analytics.byMatchScore?.excellent || 0,
          veryGood: analytics.byMatchScore?.veryGood || 0,
          good: analytics.byMatchScore?.good || 0,
          fair: analytics.byMatchScore?.fair || 0,
          poor: analytics.byMatchScore?.poor || 0
        },
        averageMatchScore: analytics.averageMatchScore || 0
      };
    } catch (error) {
      console.error('Error transforming analytics data:', error);
      return null;
    }
  }


  static handleAPIError(error) {
    console.error('API Error:', error);
    
    if (error.response) {
    
      const status = error.response.status;
      const message = error.response.data?.message || error.message;
      
      switch (status) {
        case 400:
          return `Kërkesë e gabuar: ${message}`;
        case 401:
          return 'Ju duhet të kyçeni përsëri';
        case 403:
          return 'Nuk keni leje për këtë veprim';
        case 404:
          return 'Resursi nuk u gjet';
        case 500:
          return 'Gabim i serverit. Provoni përsëri më vonë';
        default:
          return `Gabim: ${message}`;
      }
    } else if (error.request) {
      
      return 'Problemi i lidhjes me serverin. Kontrolloni internetin';
    } else {
     
      return error.message || 'Gabim i panjohur';
    }
  }

  static formatDuration(years) {
    try {
      const num = parseInt(years);
      if (isNaN(num)) return '';
      
      if (num === 1) return '1 vit';
      return `${num} vjet`;
    } catch (error) {
      console.error('Error formatting duration:', error);
      return '';
    }
  }

 
  static formatUniversityType(type) {
    const typeMap = {
      'public': 'Publik',
      'private': 'Privat',
      'international': 'Ndërkombëtar'
    };
    
    return typeMap[type] || type || 'I Panjohur';
  }

  static formatLanguage(language) {
    const languageMap = {
      'sq': 'Shqip',
      'en': 'Anglisht',
      'it': 'Italisht',
      'de': 'Gjermanisht',
      'fr': 'Frëngjisht'
    };
    
    return languageMap[language] || language || 'Shqip';
  }
}

export default BackendResponseHandler;