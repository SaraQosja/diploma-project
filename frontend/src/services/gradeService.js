
// frontend/src/services/gradeService.js
import api from './api';

export const gradeService = {
  
  async getUserGrades() {
    try {
      const response = await api.get('/grades');
      return {
        success: true,
        data: response.data || [],
        message: 'Notat u ngarkuan me sukses'
      };
    } catch (error) {
      console.error('Error fetching grades:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Gabim në ngarkimin e notave'
      };
    }
  },

  generateUniqueSubjectName(baseSubjectName) {
    const timestamp = new Date().toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .slice(0, 15);
    
    return `${baseSubjectName}_v${timestamp}`;
  },

  
  async addGrade(gradeData) {
    try {
      console.log('📤 ADDING GRADE (AUTO-VERSION):', gradeData);
      
      const validation = this.validateGrade(gradeData);
      console.log('📋 VALIDATION RESULT:', validation);
      
      if (!validation.isValid) {
        console.log('❌ VALIDATION FAILED:', validation.errors);
        return {
          success: false,
          message: validation.errors.join(', ')
        };
      }

      const uniqueSubjectName = this.generateUniqueSubjectName(gradeData.subjectName);
      console.log('🆕 UNIQUE SUBJECT NAME:', uniqueSubjectName);

      const payload = {
        subjectName: uniqueSubjectName,
        grade: gradeData.grade,
        yearTaken: gradeData.yearTaken,
        gradeType: gradeData.gradeType,
        isMaturaSubject: gradeData.isMaturaSubject || 1,
        baseSubjectName: gradeData.subjectName,
        isLatestVersion: true 
      };
      
      console.log('🚀 API PAYLOAD:', payload);

     
      await this.markPreviousVersionsAsOld(gradeData.subjectName);

      const response = await api.post('/grades', payload);
      console.log('✅ CREATE SUCCESSFUL:', response.data);
      
      return {
        success: true,
        data: response.data,
        message: `Nota "${gradeData.subjectName}" u ruajt me sukses`
      };
      
    } catch (error) {
      console.error('❌ SERVICE ERROR:', error);
      console.error('❌ ERROR RESPONSE:', error.response?.data);
      console.error('❌ ERROR STATUS:', error.response?.status);
    
      if (error.response?.status === 409) {
        console.log('🔄 STILL CONFLICT - TRYING WITH RANDOM SUFFIX');
        
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const superUniqueSubjectName = `${gradeData.subjectName}_v${Date.now()}_${randomSuffix}`;
        
        try {
          const fallbackPayload = {
            subjectName: superUniqueSubjectName,
            grade: gradeData.grade,
            yearTaken: gradeData.yearTaken,
            gradeType: gradeData.gradeType,
            isMaturaSubject: gradeData.isMaturaSubject || 1,
            baseSubjectName: gradeData.subjectName,
            isLatestVersion: true
          };
          
          const fallbackResponse = await api.post('/grades', fallbackPayload);
          console.log('✅ FALLBACK CREATE SUCCESSFUL:', fallbackResponse.data);
          
          return {
            success: true,
            data: fallbackResponse.data,
            message: `Nota "${gradeData.subjectName}" u ruajt me sukses`
          };
        } catch (fallbackError) {
          console.error('❌ FALLBACK FAILED:', fallbackError);
          return {
            success: false,
            message: 'Gabim në ruajtjen e notës'
          };
        }
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Gabim në shtimin e notës'
      };
    }
  },

  async markPreviousVersionsAsOld(baseSubjectName) {
    try {
     
      console.log('📝 MARKING PREVIOUS VERSIONS AS OLD FOR:', baseSubjectName);
    
    } catch (error) {
      console.log('⚠️ Could not mark previous versions as old:', error);
      
    }
  },

  async bulkSaveGrades(gradesArray) {
    try {
      const results = [];
      const successes = [];
      const errors = [];

      console.log('🔄 STARTING BULK SAVE (AUTO-VERSION) FOR:', gradesArray.length, 'grades');

      for (let i = 0; i < gradesArray.length; i++) {
        const gradeData = gradesArray[i];
        console.log(`🔄 Processing ${i + 1}/${gradesArray.length}: ${gradeData.subjectName}`);
        
        try {
          const result = await this.addGrade(gradeData);
          
          if (result.success) {
            successes.push(gradeData.subjectName);
            results.push(result.data);
            console.log(`✅ SUCCESS: ${gradeData.subjectName}`);
          } else {
            errors.push(`${gradeData.subjectName}: ${result.message}`);
            console.log(`❌ FAILED: ${gradeData.subjectName} - ${result.message}`);
          }
        } catch (singleError) {
          console.error(`❌ ERROR processing ${gradeData.subjectName}:`, singleError);
          errors.push(`${gradeData.subjectName}: Gabim teknik`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      console.log('📊 BULK SAVE COMPLETED:', {
        total: gradesArray.length,
        successes: successes.length,
        errors: errors.length
      });

      let message = '';
      if (successes.length > 0) {
        message += `${successes.length} nota u ruajtën me sukses`;
      }
      if (errors.length > 0) {
        if (message) message += '. ';
        message += `${errors.length} nota kishin probleme`;
      }

      return {
        success: errors.length === 0,
        message: message || 'Asnjë nota nuk u procesua',
        data: { 
          saved: successes.length,
          errors: errors.length,
          total: gradesArray.length,
          errorDetails: errors,
          successDetails: successes
        }
      };
    } catch (error) {
      console.error('❌ BULK SAVE FATAL ERROR:', error);
      return {
        success: false,
        message: 'Gabim në ruajtjen e notave',
        data: { saved: 0, errors: gradesArray.length, total: gradesArray.length }
      };
    }
  },


  async getLatestGrades() {
    try {
      const allGrades = await this.getUserGrades();
      if (!allGrades.success) return allGrades;


      const latestGrades = this.getLatestVersionsOnly(allGrades.data);
      
      return {
        success: true,
        data: latestGrades,
        message: 'Notat më të fundit u ngarkuan me sukses'
      };
    } catch (error) {
      console.error('Error fetching latest grades:', error);
      return {
        success: false,
        data: [],
        message: 'Gabim në ngarkimin e notave'
      };
    }
  },
  getLatestVersionsOnly(grades) {
    if (!Array.isArray(grades)) return [];

    const baseSubjects = {};
    
    grades.forEach(grade => {
    
      let baseSubject = grade.baseSubjectName || grade.subjectName;
      
      baseSubject = baseSubject
        .replace(/_v\d+.*$/, '') 
        .replace(/ \(Prova .*\)$/, '') 
        .trim();
      
      if (!baseSubjects[baseSubject] || 
          new Date(grade.createdAt || grade.updatedAt || 0) > new Date(baseSubjects[baseSubject].createdAt || baseSubjects[baseSubject].updatedAt || 0) ||
          (grade.id > baseSubjects[baseSubject].id)) {
        baseSubjects[baseSubject] = {
          ...grade,
          displayName: baseSubject 
        };
      }
    });
    
    return Object.values(baseSubjects);
  },

  calculateMaturaAverage(grades) {
    const latestGrades = this.getLatestVersionsOnly(grades);
    const maturaGrades = latestGrades.filter(g => g.isMaturaSubject === 1);
    
    if (maturaGrades.length === 0) return 0;
    
    const total = maturaGrades.reduce((sum, grade) => sum + parseFloat(grade.grade), 0);
    return (total / maturaGrades.length);
  },

  calculateOverallAverage(grades) {
    const latestGrades = this.getLatestVersionsOnly(grades);
    
    if (latestGrades.length === 0) return 0;
    
    const total = latestGrades.reduce((sum, grade) => sum + parseFloat(grade.grade), 0);
    return (total / latestGrades.length);
  },
  getGradeSummaryForRecommendations(grades) {
    const latestGrades = this.getLatestVersionsOnly(grades);
    
    if (latestGrades.length === 0) {
      return {
        totalGrades: 0,
        maturaAverage: 0,
        overallAverage: 0,
        highestGrade: 0,
        lowestGrade: 0,
        maturaCount: 0,
        grades: []
      };
    }

    const maturaGrades = latestGrades.filter(g => g.isMaturaSubject === 1);
    const allGradeValues = latestGrades.map(g => parseFloat(g.grade));

    return {
      totalGrades: latestGrades.length,
      maturaAverage: this.calculateMaturaAverage(grades),
      overallAverage: this.calculateOverallAverage(grades),
      highestGrade: Math.max(...allGradeValues),
      lowestGrade: Math.min(...allGradeValues),
      maturaCount: maturaGrades.length,
      grades: latestGrades
    };
  },

  async deleteGrade(gradeId) {
    try {
      const response = await api.delete(`/grades/${gradeId}`);
      return {
        success: true,
        data: response.data,
        message: 'Nota u fshi me sukses'
      };
    } catch (error) {
      console.error('Error deleting grade:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Gabim në fshirjen e notës'
      };
    }
  },

  async getGradeStats() {
    try {
      const response = await api.get('/grades/stats');
      return {
        success: true,
        data: response.data,
        message: 'Statistikat u ngarkuan me sukses'
      };
    } catch (error) {
      console.error('Error fetching grade stats:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Gabim në ngarkimin e statistikave'
      };
    }
  },

  validateGrade(gradeData) {
    const errors = [];
    
    if (!gradeData.subjectName || gradeData.subjectName.trim() === '') {
      errors.push('Emri i lëndës është i detyrueshëm');
    }
    
    const grade = parseFloat(gradeData.grade);
    if (isNaN(grade)) {
      errors.push('Nota duhet të jetë një numër');
    } else if (grade < 4 || grade > 10) {
      errors.push('Nota duhet të jetë midis 4 dhe 10');
    }
    
    const year = parseInt(gradeData.yearTaken);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 2000 || year > currentYear + 1) {
      errors.push('Viti duhet të jetë i vlefshëm');
    }


    const validTypes = ['MATURA', 'YEARLY', 'AVERAGE', 'SUBJECT'];
    if (gradeData.gradeType && !validTypes.includes(gradeData.gradeType.toUpperCase())) {
      errors.push('Lloji i notës është i pavlefshëm');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  
  getGradeTypeDisplay(gradeType) {
    const types = {
      'MATURA': 'Nota Maturës',
      'YEARLY': 'Mesatarja Vjetore',
      'AVERAGE': 'VKM',
      'SUBJECT': 'Nota Lënde'
    };
    return types[gradeType?.toUpperCase()] || gradeType;
  },

  getGradeColor(grade) {
    const g = parseFloat(grade);
    if (isNaN(g)) return 'text-gray-600 bg-gray-100';
    if (g >= 9) return 'text-green-600 bg-green-100';
    if (g >= 8) return 'text-blue-600 bg-blue-100';
    if (g >= 7) return 'text-yellow-600 bg-yellow-100';
    if (g >= 6) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  },

  formatGrade(grade) {
    const g = parseFloat(grade);
    if (isNaN(g)) return 'N/A';
    return g.toFixed(1);
  },

  getDisplayName(grade) {
    if (grade.displayName) return grade.displayName;
    if (grade.baseSubjectName) return grade.baseSubjectName;
  
    return grade.subjectName
      .replace(/_v\d+.*$/, '')
      .replace(/ \(Prova .*\)$/, '')
      .trim();
  }
};