// backend/models/University.js
const db = require('../config/database');

class University {

  static async getAllUniversitiesWithPrograms() {
    const query = `
      SELECT 
        u.UNIVERSITY_ID,
        u.UNIVERSITY_NAME,
        u.LOCATION,
        u.COUNTRY,
        u.UNIVERSITY_TYPE,
        u.WEBSITE,
        u.CONTACT_INFO,
        u.TUITION_FEES,
        p.PROGRAM_ID,
        p.PROGRAM_NAME,
        p.FACULTY,
        p.DURATION_YEARS,
        p.MIN_GRADE,
        p.REQUIRED_SUBJECTS,
        p.TUITION_FEE as PROGRAM_TUITION,
        p.LANGUAGE,
        p.CAREER_PATHS,
        p.DESCRIPTION as PROGRAM_DESCRIPTION,
        p.ADMISSION_REQUIREMENTS,
        p.FACILITIES
      FROM UNIVERSITIES u
      LEFT JOIN PROGRAMS p ON u.UNIVERSITY_ID = p.UNIVERSITY_ID
      WHERE u.IS_ACTIVE = 1 AND (p.IS_ACTIVE = 1 OR p.IS_ACTIVE IS NULL)
      ORDER BY u.UNIVERSITY_NAME, p.PROGRAM_NAME
    `;

    try {
      const result = await db.execute(query);
      const universities = this.groupUniversityPrograms(result.rows);
      
      if (universities.length === 0) {
        console.warn('⚠️ No universities found in database');
        return [];
      }
      
      return universities;
    } catch (error) {
      console.error('Error fetching universities with programs:', error);
      return [];
    }
  }

  static async generateUniversityRecommendations(userId, userGrades, testResults, preferences = {}) {
    try {
      const universities = await this.getAllUniversitiesWithPrograms();
      
      if (universities.length === 0) {
        console.warn('⚠️ No universities available for recommendations');
        return [];
      }
      
      const averageGrade = this.calculateAverageGrade(userGrades);
      const userProfile = this.extractUserProfile(testResults);
      
      console.log(`🎓 Generating recommendations for user ${userId} with average grade ${averageGrade.toFixed(2)}`);
      
      const recommendations = [];

      universities.forEach(university => {
        university.programs.forEach(program => {
          const matchScore = this.calculateProgramMatch(
            program, university, averageGrade, userGrades, userProfile, preferences
          );

          if (matchScore >= 50) { 
            recommendations.push({
              id: `${university.id}-${program.id}`,
              universityId: university.id,
              programId: program.id,
              universityName: university.name,
              location: university.location,
              type: university.type,
              program: program.name,
              faculty: program.faculty,
              duration: program.duration,
              tuitionFee: program.tuitionFee,
              language: program.language,
              matchScore: Math.round(matchScore),
              matchReason: this.generateMatchReason(program, averageGrade, userProfile, matchScore),
              description: program.description,
              careerPaths: program.careerPaths,
              facilities: program.facilities,
              admissionRequirements: program.admissionRequirements,
              meetsGradeRequirement: averageGrade >= program.minGrade,
              hasRequiredSubjects: this.checkRequiredSubjects(program.requiredSubjects, userGrades),
              website: university.website,
              contactInfo: university.contactInfo,
              source: 'both'
            });
          }
        });
      });

      return recommendations.sort((a, b) => b.matchScore - a.matchScore);
      
    } catch (error) {
      console.error('Error generating university recommendations:', error);
      throw error;
    }
  }

  static async generateGradeBasedRecommendations(userId, userGrades, preferences = {}) {
    try {
      const universities = await this.getAllUniversitiesWithPrograms();
      
      if (universities.length === 0) {
        console.warn('⚠️ No universities available for grade-based recommendations');
        return [];
      }
      
      const averageGrade = this.calculateAverageGrade(userGrades);
      
      console.log(`📊 Generating grade-based recommendations for user ${userId} with average grade ${averageGrade.toFixed(2)}`);
      
      const recommendations = [];

      universities.forEach(university => {
        university.programs.forEach(program => {
          
          let matchScore = 0;

          const gradeMatch = this.calculateGradeMatch(program.minGrade, averageGrade);
          matchScore += gradeMatch * 0.6;
          const subjectMatch = this.calculateSubjectMatch(program.requiredSubjects, userGrades);
          matchScore += subjectMatch * 0.3;
          const preferencesMatch = this.calculatePreferencesMatch(program, university, preferences);
          matchScore += preferencesMatch * 0.1;

          const finalScore = matchScore * 100;

          if (finalScore >= 30 && averageGrade >= (program.minGrade - 0.3)) { 
            recommendations.push({
              id: `${university.id}-${program.id}`,
              universityId: university.id,
              programId: program.id,
              universityName: university.name,
              location: university.location,
              type: university.type,
              program: program.name,
              faculty: program.faculty,
              duration: program.duration,
              tuitionFee: program.tuitionFee,
              language: program.language,
              matchScore: Math.round(finalScore),
              matchReason: this.generateGradeBasedMatchReason(program, averageGrade, finalScore),
              description: program.description,
              careerPaths: program.careerPaths,
              facilities: program.facilities,
              admissionRequirements: program.admissionRequirements,
              meetsGradeRequirement: averageGrade >= program.minGrade,
              hasRequiredSubjects: this.checkRequiredSubjects(program.requiredSubjects, userGrades),
              website: university.website,
              contactInfo: university.contactInfo,
              source: 'grades'
            });
          }
        });
      });

      return recommendations.sort((a, b) => b.matchScore - a.matchScore);
      
    } catch (error) {
      console.error('Error generating grade-based recommendations:', error);
      throw error;
    }
  }

  static async generateTestBasedRecommendations(userId, testResults, preferences = {}) {
    try {
      const universities = await this.getAllUniversitiesWithPrograms();
      
      if (universities.length === 0) {
        console.warn('⚠️ No universities available for test-based recommendations');
        return [];
      }
      
      const userProfile = this.extractUserProfile(testResults);
      
      console.log(`🧠 Generating test-based recommendations for user ${userId}`);
      
      const recommendations = [];

      universities.forEach(university => {
        university.programs.forEach(program => {
          
          let matchScore = 0;
         
          const interestMatch = this.calculateInterestMatch(program, userProfile.interests);
          matchScore += interestMatch * 0.5;

          const skillsMatch = this.calculateSkillsMatch(program, userProfile.skills);
          matchScore += skillsMatch * 0.3;

          const preferencesMatch = this.calculatePreferencesMatch(program, university, preferences);
          matchScore += preferencesMatch * 0.2;

          const finalScore = matchScore * 100;

          if (finalScore >= 40) { 
            recommendations.push({
              id: `${university.id}-${program.id}`,
              universityId: university.id,
              programId: program.id,
              universityName: university.name,
              location: university.location,
              type: university.type,
              program: program.name,
              faculty: program.faculty,
              duration: program.duration,
              tuitionFee: program.tuitionFee,
              language: program.language,
              matchScore: Math.round(finalScore),
              matchReason: this.generateTestBasedMatchReason(program, userProfile, finalScore),
              description: program.description,
              careerPaths: program.careerPaths,
              facilities: program.facilities,
              admissionRequirements: program.admissionRequirements,
              meetsGradeRequirement: null, 
              hasRequiredSubjects: null, 
              website: university.website,
              contactInfo: university.contactInfo,
              source: 'tests'
            });
          }
        });
      });

      return recommendations.sort((a, b) => b.matchScore - a.matchScore);
      
    } catch (error) {
      console.error('Error generating test-based recommendations:', error);
      throw error;
    }
  }
  static calculateSubjectMatch(requiredSubjects, userGrades) {
    if (!requiredSubjects || !userGrades || requiredSubjects.length === 0) return 0.5;
    const validRequiredSubjects = requiredSubjects.filter(subject => 
      subject && typeof subject === 'string'
    );

    if (validRequiredSubjects.length === 0) return 0.5;

    const userSubjects = userGrades.map(g => 
      (g.subjectName || g.SUBJECT_NAME || '').toLowerCase()
    ).filter(Boolean);

    const matchedSubjects = validRequiredSubjects.filter(reqSubject =>
      userSubjects.some(userSubject =>
        userSubject.includes(reqSubject.toLowerCase()) ||
        reqSubject.toLowerCase().includes(userSubject) ||
        this.areSubjectsSimilar(reqSubject, userSubject)
      )
    );

    return matchedSubjects.length / validRequiredSubjects.length;
  }

  static areSubjectsSimilar(subject1, subject2) {
    const s1 = subject1.toLowerCase();
    const s2 = subject2.toLowerCase();

    const synonyms = {
      'matematike': ['math', 'matematika', 'algjebra'],
      'shqipe': ['gjuhe shqipe', 'letërsi', 'gjuha shqipe'],
      'anglisht': ['english', 'gjuhe e huaj', 'anglez'],
      'fizike': ['physics', 'fizika'],
      'kimia': ['chemistry', 'kimika'],
      'biologji': ['biology', 'biologjia'],
      'histori': ['history', 'historia'],
      'gjeografi': ['geography', 'gjeografia']
    };

    for (const [key, values] of Object.entries(synonyms)) {
      if ((s1.includes(key) || values.some(v => s1.includes(v))) &&
          (s2.includes(key) || values.some(v => s2.includes(v)))) {
        return true;
      }
    }

    return false;
  }

  static generateGradeBasedMatchReason(program, averageGrade, matchScore) {
    const reasons = [];

    if (averageGrade >= program.minGrade) {
      const excess = averageGrade - program.minGrade;
      if (excess >= 1.5) {
        reasons.push(`notat tuaja të shkëlqyera (${averageGrade.toFixed(1)} mesatare)`);
      } else if (excess >= 0.5) {
        reasons.push(`notat tuaja të mira (${averageGrade.toFixed(1)} mesatare)`);
      } else {
        reasons.push(`përmbushni kriteret e notave (${averageGrade.toFixed(1)} mesatare)`);
      }
    } else {
      const deficit = program.minGrade - averageGrade;
      if (deficit <= 0.5) {
        reasons.push(`jeni afër kritereve të notave (${averageGrade.toFixed(1)} mesatare)`);
      } else {
        reasons.push(`bazuar në performancën tuaj akademike`);
      }
    }

    if (matchScore >= 80) {
      return `${reasons[0]}, kjo është një përputhje e shkëlqyer për ju.`;
    } else if (matchScore >= 70) {
      return `${reasons[0]}, ky program mund të jetë shumë i përshtatshëm.`;
    } else if (matchScore >= 60) {
      return `${reasons[0]}, kjo është një mundësi e mirë për t'u konsideruar.`;
    } else {
      return `${reasons[0]}, ka disa aspekte që përputhen me profilin tuaj.`;
    }
  }


  static generateTestBasedMatchReason(program, userProfile, matchScore) {
    const reasons = [];

   
    const strongInterests = Object.entries(userProfile.interests || {})
      .filter(([_, score]) => score >= 70)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2);

    if (strongInterests.length > 0) {
      const interestNames = {
        realistic: 'punë praktike',
        investigative: 'hulumtim dhe analizë',
        artistic: 'kreativitet dhe art',
        social: 'punë me njerëz',
        enterprising: 'udhëheqje dhe biznes',
        conventional: 'organizim dhe struktura'
      };
      
      const interests = strongInterests.map(([interest]) => interestNames[interest]).filter(Boolean);
      if (interests.length > 0) {
        reasons.push(`interesat tuaja për ${interests.join(' dhe ')}`);
      }
    }


    const strongSkills = Object.entries(userProfile.skills || {})
      .filter(([_, score]) => score >= 70)
      .slice(0, 2);

    if (strongSkills.length > 0) {
      reasons.push(`aftësitë tuaja të forta`);
    }

    if (reasons.length === 0) {
      return 'Bazuar në profilin tuaj nga testet, ky program mund të jetë i përshtatshëm.';
    }

    const baseReason = `Bazuar në ${reasons.join(' dhe ')}`;
    
    if (matchScore >= 80) return `${baseReason}, kjo është një përputhje e shkëlqyer.`;
    if (matchScore >= 70) return `${baseReason}, ky program duket i përshtatshëm.`;
    if (matchScore >= 60) return `${baseReason}, ka potencial për ju.`;
    return `${baseReason}, mund të jetë një opsion interesant.`;
  }


  static groupUniversityPrograms(rows) {
    const universitiesMap = new Map();

    rows.forEach(row => {
      const universityId = row.UNIVERSITY_ID;
      
      if (!universitiesMap.has(universityId)) {
        universitiesMap.set(universityId, {
          id: row.UNIVERSITY_ID,
          name: row.UNIVERSITY_NAME,
          location: row.LOCATION,
          country: row.COUNTRY,
          type: row.UNIVERSITY_TYPE,
          website: row.WEBSITE,
          contactInfo: this.parseJSON(row.CONTACT_INFO),
          baseTuitionFees: row.TUITION_FEES,
          programs: []
        });
      }

      if (row.PROGRAM_ID) {
        universitiesMap.get(universityId).programs.push(this.formatProgram(row));
      }
    });

    return Array.from(universitiesMap.values());
  }

  static formatProgram(row) {
    return {
      id: row.PROGRAM_ID,
      name: row.PROGRAM_NAME || row.program_name,
      faculty: row.FACULTY || row.faculty,
      duration: row.DURATION_YEARS || row.duration_years,
      minGrade: row.MIN_GRADE || row.min_grade,
      requiredSubjects: this.parseJSON(row.REQUIRED_SUBJECTS || row.required_subjects) || [],
      tuitionFee: row.PROGRAM_TUITION || row.TUITION_FEE || row.tuition_fee || 0,
      language: row.LANGUAGE || row.language,
      careerPaths: this.parseJSON(row.CAREER_PATHS || row.career_paths) || [],
      description: row.PROGRAM_DESCRIPTION || row.description,
      admissionRequirements: row.ADMISSION_REQUIREMENTS || row.admission_requirements,
      facilities: this.parseJSON(row.FACILITIES || row.facilities) || []
    };
  }

  
  static parseJSON(jsonString) {
    if (!jsonString) return null;
    
    try {
      
      if (typeof jsonString === 'object' && jsonString !== null) {
        return jsonString;
      }

      if (jsonString && typeof jsonString === 'object' && jsonString.toString) {
        const stringValue = jsonString.toString();
        if (stringValue === '[object Object]') {
          return null;
        }
        return JSON.parse(stringValue);
      }
      
      
      if (typeof jsonString === 'string') {
        return JSON.parse(jsonString);
      }
      
      return jsonString;
    } catch (error) {
   
      return null;
    }
  }

  static calculateAverageGrade(userGrades) {
    if (!userGrades || userGrades.length === 0) return 6.0;
    
    const total = userGrades.reduce((sum, grade) => sum + parseFloat(grade.grade || grade.GRADE), 0);
    return total / userGrades.length;
  }

  static extractUserProfile(testResults) {
    const profile = {
      interests: {},
      personality: {},
      skills: {}
    };

    if (!testResults || testResults.length === 0) return profile;

    testResults.forEach(result => {
      const category = (result.testCategory || result.TEST_TYPE || '').toLowerCase();
      const scores = result.detailedScores || result.SCORE || {};

      if (category.includes('interest')) {
        profile.interests = { ...profile.interests, ...scores };
      } else if (category.includes('personality')) {
        profile.personality = { ...profile.personality, ...scores };
      } else if (category.includes('skill') || category.includes('aptitude')) {
        profile.skills = { ...profile.skills, ...scores };
      }
    });

    return profile;
  }

  static calculateProgramMatch(program, university, averageGrade, userGrades, userProfile, preferences) {
    let matchScore = 0;
    let weights = 0;

    // Grade compatibility (40% weight)
    const gradeMatch = this.calculateGradeMatch(program.minGrade, averageGrade);
    matchScore += gradeMatch * 0.4;
    weights += 0.4;

    // Interest alignment (35% weight)
    const interestMatch = this.calculateInterestMatch(program, userProfile.interests);
    matchScore += interestMatch * 0.35;
    weights += 0.35;

    // Skills match (15% weight)
    const skillsMatch = this.calculateSkillsMatch(program, userProfile.skills);
    matchScore += skillsMatch * 0.15;
    weights += 0.15;

    // User preferences (10% weight)
    const preferencesMatch = this.calculatePreferencesMatch(program, university, preferences);
    matchScore += preferencesMatch * 0.10;
    weights += 0.10;

    return (matchScore / weights) * 100;
  }
  static calculateGradeMatch(requiredGrade, userGrade) {
    if (userGrade >= requiredGrade) {
      const excess = userGrade - requiredGrade;
      return Math.min(1.0, 0.8 + (excess * 0.1));
    } else {
      const deficit = requiredGrade - userGrade;
      return Math.max(0.2, 0.8 - (deficit * 0.2));
    }
  }

  static calculateInterestMatch(program, userInterests) {
    if (!userInterests || Object.keys(userInterests).length === 0) return 0.5;

    const programName = program.name.toLowerCase();
    const description = (program.description || '').toLowerCase();
    
    let totalMatch = 0;
    let count = 0;

    Object.entries(userInterests).forEach(([interest, score]) => {
      if (programName.includes(interest.toLowerCase()) || 
          description.includes(interest.toLowerCase())) {
        totalMatch += (score / 100);
        count++;
      }
    });

    return count > 0 ? totalMatch / count : 0.5;
  }

  static calculateSkillsMatch(program, userSkills) {
    if (!userSkills || Object.keys(userSkills).length === 0) return 0.5;

    let totalMatch = 0;
    let count = 0;

    Object.entries(userSkills).forEach(([skill, score]) => {
      if (program.requiredSubjects && program.requiredSubjects.some(subject => 
          subject && typeof subject === 'string' && subject.toLowerCase().includes(skill.toLowerCase()))) {
        totalMatch += (score / 100);
        count++;
      }
    });

    return count > 0 ? totalMatch / count : 0.5;
  }

  static calculatePreferencesMatch(program, university, preferences) {
    let match = 0.5; 

    if (preferences.preferredLocation) {
      match += university.location === preferences.preferredLocation ? 0.3 : 0;
    }

    if (preferences.maxTuitionFee !== undefined) {
      match += program.tuitionFee <= preferences.maxTuitionFee ? 0.2 : -0.2;
    }

    if (preferences.preferredLanguage) {
      match += program.language.includes(preferences.preferredLanguage) ? 0.2 : 0;
    }

    if (preferences.maxDuration !== undefined) {
      match += program.duration <= preferences.maxDuration ? 0.1 : -0.1;
    }

    return Math.max(0, Math.min(1, match));
  }

  
  static checkRequiredSubjects(requiredSubjects, userGrades) {
    if (!requiredSubjects || !userGrades) return false;
  
    const validRequiredSubjects = requiredSubjects.filter(subject => 
      subject && typeof subject === 'string'
    );
    
    if (validRequiredSubjects.length === 0) return true; 
    
    const userSubjects = userGrades.map(g => 
      (g.subjectName || g.SUBJECT_NAME || '').toLowerCase()
    ).filter(Boolean);
    
    return validRequiredSubjects.every(subject => 
      userSubjects.some(userSubject => 
        userSubject.includes(subject.toLowerCase()) || 
        subject.toLowerCase().includes(userSubject)
      )
    );
  }
  static generateMatchReason(program, averageGrade, userProfile, matchScore) {
    const reasons = [];

    if (averageGrade >= program.minGrade) {
      const excess = averageGrade - program.minGrade;
      if (excess >= 1) {
        reasons.push(`notat tuaja të shkëlqyera (${averageGrade.toFixed(1)} mesatare)`);
      } else {
        reasons.push(`notat tuaja të mira (${averageGrade.toFixed(1)} mesatare)`);
      }
    }

    const strongInterests = Object.entries(userProfile.interests || {})
      .filter(([_, score]) => score >= 80)
      .map(([interest, _]) => interest);

    if (strongInterests.length > 0) {
      reasons.push(`interesat tuaja të forta në ${strongInterests.slice(0, 2).join(' dhe ')}`);
    }

    if (reasons.length === 0) {
      return `Bazuar në profilin tuaj, ky program mund të jetë një zgjedhje e mirë për ju.`;
    }

    const baseReason = `Bazuar në ${reasons.slice(0, 2).join(', ')}`;
    
    if (matchScore >= 90) return `${baseReason}, kjo është një përputhje e shkëlqyer për ju.`;
    if (matchScore >= 80) return `${baseReason}, ky program mund të jetë shumë i përshtatshëm.`;
    if (matchScore >= 70) return `${baseReason}, kjo është një mundësi e mirë për t'u konsideruar.`;
    return `${baseReason}, ka disa aspekte që përputhen me profilin tuaj.`;
  }

  static async generateSmartUniversityRecommendations(userId, userGrades, testResults, preferences = {}) {
    try {
      const universities = await this.getAllUniversitiesWithPrograms();
      if (universities.length === 0) return [];
      
      const averageGrade = this.calculateAverageGrade(userGrades);
      const userProfile = this.extractUserProfile(testResults);
      
      console.log(`🎓 Smart matching for user ${userId} with grade ${averageGrade.toFixed(2)}`);
      
      const recommendations = [];

      universities.forEach(university => {
        university.programs.forEach(program => {
          const matchData = this.calculateSmartMatch(
            program, university, averageGrade, userGrades, userProfile, preferences
          );

          if (matchData.shouldRecommend) {
            recommendations.push({
              id: `${university.id}-${program.id}`,
              universityId: university.id,
              programId: program.id,
              universityName: university.name,
              location: university.location,
              type: university.type,
              program: program.name,
              faculty: program.faculty,
              duration: program.duration,
              tuitionFee: program.tuitionFee,
              language: program.language,
              matchScore: Math.round(matchData.matchScore),
              matchReason: matchData.matchReason,
              gradeStatus: matchData.gradeStatus,
              gradeGap: matchData.gradeGap, 
              recommendation: matchData.recommendation, 
              description: program.description,
              careerPaths: program.careerPaths,
              facilities: program.facilities,
              admissionRequirements: program.admissionRequirements,
              meetsGradeRequirement: matchData.meetsGradeRequirement,
              hasRequiredSubjects: this.checkRequiredSubjects(program.requiredSubjects, userGrades),
              website: university.website,
              contactInfo: university.contactInfo,
              source: 'smart'
            });
          }
        });
      });

      return recommendations.sort((a, b) => b.matchScore - a.matchScore);
      
    } catch (error) {
      console.error('Error generating smart university recommendations:', error);
      throw error;
    }
  }

  // SMART CALCULATION
  static calculateSmartMatch(program, university, averageGrade, userGrades, userProfile, preferences) {
   
    const testMatchScore = this.calculateTestMatch(program, userProfile);
    
    const gradeGap = program.minGrade - averageGrade;
    const meetsGradeRequirement = averageGrade >= program.minGrade;
    
    let shouldRecommend = false;
    let matchReason = '';
    let gradeStatus = '';
    let recommendation = '';
    let finalMatchScore = 0;

    if (testMatchScore >= 70) { 
      shouldRecommend = true;
      
      if (meetsGradeRequirement) {
       
        finalMatchScore = testMatchScore;
        gradeStatus = 'eligible';
        matchReason = `Përputhje e shkëlqyer! Ju plotësoni të gjitha kërkesat (nota: ${averageGrade.toFixed(1)}/${program.minGrade})`;
        recommendation = 'apply_now';
        
      } else if (gradeGap <= 0.5) {
        finalMatchScore = testMatchScore * 0.85; 
        gradeStatus = 'close';
        matchReason = `Përputhje e fortë nga testet! Ju duhen vetëm ${gradeGap.toFixed(1)} pikë më shumë në nota`;
        recommendation = 'improve_grades';
        
      } else if (gradeGap <= 1.0) {
        finalMatchScore = testMatchScore * 0.7;
        gradeStatus = 'needs_improvement';
        matchReason = `Interesi juaj për këtë fushë është i lartë, por duhet të përmirësoni notat (ju duhen ${gradeGap.toFixed(1)} pikë)`;
        recommendation = 'focus_on_grades';
        
      } else {
        finalMatchScore = testMatchScore * 0.5;
        gradeStatus = 'consider_alternatives';
        matchReason = `Keni interes të fortë, por konsideroni universitete me kërkesa më të ulëta ose kurse përgatitore`;
        recommendation = 'alternative_paths';
      }
      
    } else if (testMatchScore >= 50 && meetsGradeRequirement) {
      shouldRecommend = true;
      finalMatchScore = testMatchScore;
      gradeStatus = 'eligible';
      matchReason = `Ju plotësoni kërkesat e notave dhe keni disa interesa që përputhen`;
      recommendation = 'consider_carefully';
      
    } else {
      shouldRecommend = false;
    }

    return {
      shouldRecommend,
      matchScore: finalMatchScore,
      matchReason,
      gradeStatus,
      recommendation,
      meetsGradeRequirement,
      gradeGap: gradeGap > 0 ? gradeGap : 0,
      testMatchScore
    };
  }
  static calculateTestMatch(program, userProfile) {
    let interestMatch = 0;
    let skillsMatch = 0;
    

    const programInterests = {
      'informatik': ['technology', 'logical', 'analytical'],
      'kompjuter': ['technology', 'logical', 'analytical'],
      'inxhinier': ['technology', 'logical', 'practical'],
      'mjek': ['science', 'helping', 'analytical'],
      'infermier': ['science', 'helping', 'social'],
      'ekonomi': ['business', 'analytical', 'social'],
      'biznes': ['business', 'enterprising', 'social'],
      'marketing': ['business', 'creative', 'social'],
      'art': ['creative', 'artistic', 'expressive'],
      'muzik': ['creative', 'artistic', 'expressive'],
      'matematik': ['logical', 'analytical', 'investigative'],
      'fizik': ['science', 'analytical', 'investigative'],
      'kimia': ['science', 'analytical', 'investigative'],
      'biologji': ['science', 'analytical', 'helping'],
      'psikolog': ['social', 'helping', 'analytical'],
      'drejtesi': ['analytical', 'social', 'conventional'],
      'law': ['analytical', 'social', 'conventional'],
      'arkitekt': ['creative', 'practical', 'realistic'],
      'ndertim': ['practical', 'realistic', 'conventional'],
      'turizem': ['social', 'enterprising', 'conventional'],
      'gazetar': ['social', 'artistic', 'enterprising'],
      'media': ['creative', 'social', 'artistic'],
      'sport': ['realistic', 'social', 'enterprising'],
      'bujqesi': ['realistic', 'investigative', 'conventional'],
      'veteriner': ['realistic', 'investigative', 'helping']
    };
    
 
    const programName = program.name.toLowerCase();
    let relevantInterests = [];
    
    for (const [key, interests] of Object.entries(programInterests)) {
      if (programName.includes(key)) {
        relevantInterests = interests;
        break;
      }
    }
    
 
    if (relevantInterests.length === 0) {
      if (programName.includes('teknik') || programName.includes('teknologj')) {
        relevantInterests = ['technology', 'realistic', 'investigative'];
      } else if (programName.includes('human') || programName.includes('social')) {
        relevantInterests = ['social', 'artistic', 'enterprising'];
      } else if (programName.includes('shkenc')) {
        relevantInterests = ['investigative', 'realistic', 'analytical'];
      }
    }
    
  
    if (relevantInterests.length > 0 && userProfile.interests) {
      const matchingScores = relevantInterests.map(interest => {
        return userProfile.interests[interest] || 0;
      });
      interestMatch = Math.max(...matchingScores);
    }

    skillsMatch = this.calculateSkillsMatch(program, userProfile);
    
    return (interestMatch * 0.7) + (skillsMatch * 0.3);
  }

  static async generateUniversityRecommendations(userId, userGrades, testResults, preferences = {}) {

    return this.generateSmartUniversityRecommendations(userId, userGrades, testResults, preferences);
  }
}

module.exports = University;