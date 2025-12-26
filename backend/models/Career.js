// backend/models/Career.js
const { executeQuery } = require('../config/database');
const RecommendationAlgorithm = require('../utils/recommendationAlgorithm');

class Career {
 
  static async getAllCareers() {
    try {
      const sql = `
        SELECT 
          CAREER_ID,
          CAREER_NAME,
          CAREER_DESCRIPTION,
          CATEGORY,
          REQUIRED_EDUCATION,
          AVERAGE_SALARY,
          JOB_OUTLOOK,
          SKILLS_REQUIRED,
          IS_ACTIVE
        FROM CAREERS
        WHERE IS_ACTIVE = 1
        ORDER BY CAREER_NAME
      `;

      const result = await executeQuery(sql);
      
      if (result.rows && result.rows.length > 0) {
        console.log(`U gjetën ${result.rows.length} karriera në databazë`);
        
        return result.rows.map(career => {
          
          let description = 'Përshkrim i paqartë';
          if (career.CAREER_DESCRIPTION) {
            if (typeof career.CAREER_DESCRIPTION === 'string') {
              description = career.CAREER_DESCRIPTION;
            } else if (career.CAREER_DESCRIPTION.toString && typeof career.CAREER_DESCRIPTION.toString === 'function') {
              const descStr = career.CAREER_DESCRIPTION.toString();
              description = (descStr && descStr !== '[object Object]') ? descStr : 'Përshkrim i paqartë';
            }
          }
 
          let skills = 'Aftësi të ndryshme';
          if (career.SKILLS_REQUIRED) {
            if (typeof career.SKILLS_REQUIRED === 'string') {
              skills = career.SKILLS_REQUIRED;
            } else if (career.SKILLS_REQUIRED.toString && typeof career.SKILLS_REQUIRED.toString === 'function') {
              const skillsStr = career.SKILLS_REQUIRED.toString();
              skills = (skillsStr && skillsStr !== '[object Object]') ? skillsStr : 'Aftësi të ndryshme';
            }
          }

          return {
            CAREER_ID: career.CAREER_ID,
            CAREER_NAME: String(career.CAREER_NAME || 'Karrierë e Panjohur'),
            CAREER_DESCRIPTION: description,
            CATEGORY: String(career.CATEGORY || 'Të Përgjithshme'),
            REQUIRED_EDUCATION: String(career.REQUIRED_EDUCATION || 'Bachelor'),
            AVERAGE_SALARY: parseFloat(career.AVERAGE_SALARY || 400),
            JOB_OUTLOOK: String(career.JOB_OUTLOOK || 'Mesatar'),
            SKILLS_REQUIRED: skills
          };
        });
      } else {
        console.log('Nuk ka karriera në databazë, duke përdorur default');
        return this.getDefaultCareers();
      }
    } catch (error) {
      console.error('Gabim në marrjen e karrierave:', error);
      return this.getDefaultCareers();
    }
  }

  
  static async getAdvancedCareerMatches(testResults) {
    try {
      console.log('Analizë e avancuar e karrierave...');
      
      const userProfile = RecommendationAlgorithm.analyzeUserProfile(testResults);
      const careers = await this.getAllCareers();
      
      const enhancedRecommendations = careers.map(career => {
        const baseMatch = RecommendationAlgorithm.calculateMatchScore(userProfile, career);
        
        let bonusScore = 0;
        testResults.forEach(test => {
          const score = parseFloat(test.SCORE || 0);
          if (score >= 85) {
            bonusScore += this.getCareerTestBonus(career.CAREER_NAME, test.TEST_TYPE, score);
          }
        });
        
        const finalScore = Math.min(100, (baseMatch * 100) + bonusScore);
        
        return {
          id: career.CAREER_ID,
          careerId: career.CAREER_ID,
          title: career.CAREER_NAME,
          description: career.CAREER_DESCRIPTION,
          category: career.CATEGORY,
          matchScore: Math.round(finalScore),
          matchReason: this.generateEnhancedMatchReason(userProfile, career, finalScore, testResults),
          salaryRange: this.formatSalary(career.AVERAGE_SALARY),
          jobOutlook: career.JOB_OUTLOOK,
          educationLevel: career.REQUIRED_EDUCATION,
          skills: this.parseSkills(career.SKILLS_REQUIRED), 
          type: 'career'
        };
      });

      return enhancedRecommendations
        .filter(rec => rec.matchScore >= 60)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10);

    } catch (error) {
      console.error('Gabim në analizën e avancuar:', error);
      return [];
    }
  }

  static async generateDynamicRecommendations(userId, testResults) {
    try {
      console.log('Gjeneroj rekomandime dinamike karrierash për user:', userId);
      
      if (!testResults || testResults.length < 3) {
        console.log('Nuk ka rezultate të mjaftueshme testesh');
        return [];
      }

      const userProfile = RecommendationAlgorithm.analyzeUserProfile(testResults);
      console.log('User profile:', userProfile);

      const allCareers = await this.getAllCareers();
      if (allCareers.length === 0) {
        console.log('Nuk ka karriera në databazë');
        return this.getDefaultCareers();
      }

      const recommendations = RecommendationAlgorithm.calculateCareerMatches(userProfile, allCareers);
      console.log(`U llogaritën ${recommendations.length} rekomandime`);

      const filteredRecommendations = recommendations
        .filter(career => career.matchScore >= 50)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 8);

      console.log(`U filtruan ${filteredRecommendations.length} rekomandime të mira`);
      return filteredRecommendations;

    } catch (error) {
      console.error('Gabim në gjenerimin e rekomandimeve dinamike:', error);
      return this.getDefaultCareers();
    }
  }

  static getCareerTestBonus(careerName, testType, testScore) {
    const name = careerName.toLowerCase();
    const type = testType.toLowerCase();
    
    if (type.includes('personalitet') || type.includes('personality')) {
      if (testScore >= 90) {
        if (name.includes('inxhinier') || name.includes('software')) return 8;
        if (name.includes('mesues') || name.includes('edukator')) return 10;
        if (name.includes('mjek') || name.includes('nurse')) return 9;
        if (name.includes('marketing') || name.includes('shitje')) return 7;
      }
    }
    
    if (type.includes('interes') || type.includes('interest')) {
      if (testScore >= 85) {
        if (name.includes('kompjuter') || name.includes('it')) return 12;
        if (name.includes('artist') || name.includes('dizajner')) return 10;
        if (name.includes('biznes') || name.includes('ekonomi')) return 8;
      }
    }
    
    if (type.includes('aftësi') || type.includes('ability')) {
      if (testScore >= 88) {
        if (name.includes('matematik') || name.includes('fizik')) return 15;
        if (name.includes('inxhinier') || name.includes('teknike')) return 12;
        if (name.includes('mjek') || name.includes('kimist')) return 10;
      }
    }
    
    return 0;
  }


  static generateEnhancedMatchReason(userProfile, career, matchScore, testResults) {
    const reasons = [];
    
    const strongTests = testResults.filter(test => parseFloat(test.SCORE || 0) >= 80);
    
    if (strongTests.length > 0) {
      const topTest = strongTests.sort((a, b) => parseFloat(b.SCORE) - parseFloat(a.SCORE))[0];
      const testName = topTest.TEST_NAME || topTest.testName || '';
      
      if (testName.toLowerCase().includes('personalitet')) {
        reasons.push('Personaliteti juaj përputhet shkëlqyeshëm me kërkesat e kësaj karriere');
      } else if (testName.toLowerCase().includes('interes')) {
        reasons.push('Interesat tuaja të forta tregojnë përputhje të lartë me këtë fushë');
      } else if (testName.toLowerCase().includes('aftësi')) {
        reasons.push('Aftësitë tuaja analitike janë ideale për këtë karrierë');
      }
    }

    if (userProfile.interests) {
      const topInterest = Object.entries(userProfile.interests)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (topInterest && topInterest[1] >= 70) {
        const interestLabels = {
          realistic: 'pune praktike dhe me duar',
          investigative: 'hulumtim dhe zgjidhje problemesh',
          artistic: 'shprehje kreative dhe art',
          social: 'ndihmë ndaj njerëzve dhe komunitet',
          enterprising: 'udhëheqje dhe biznes',
          conventional: 'organizim dhe struktura'
        };
        
        if (interestLabels[topInterest[0]]) {
          reasons.push(`Përfiton nga interesat tuaja për ${interestLabels[topInterest[0]]}`);
        }
      }
    }

    if (reasons.length === 0) {
      if (matchScore >= 85) {
        reasons.push('Analiza tregon përputhje të shkëlqyer mes profilit tuaj dhe kërkesave të karrierës');
      } else if (matchScore >= 70) {
        reasons.push('Kombinimi i testeve tuaja tregon potencial të lartë për sukses në këtë fushë');
      } else {
        reasons.push('Bazuar në rezultatet e testeve, kjo karrierë mund të jetë një zgjedhje e mirë për ju');
      }
    }

    return reasons.slice(0, 2).join('. ') + '.';
  }

  static formatSalary(averageSalary) {
    const salary = parseFloat(averageSalary || 400);
    const min = Math.round(salary * 0.8);
    const max = Math.round(salary * 1.4);
    
    return `${min} - ${max} EUR/muaj`;
  }


  static parseSkills(skillsString) {
    if (!skillsString) return [];
    if (Array.isArray(skillsString)) return skillsString;
    
    let skillsStr = '';
    if (typeof skillsString === 'string') {
      skillsStr = skillsString;
    } else if (skillsString.toString && typeof skillsString.toString === 'function') {
      skillsStr = skillsString.toString();
      if (skillsStr === '[object Object]') skillsStr = '';
    }
    
    return skillsStr
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0)
      .slice(0, 6);
  }

  
  static getDefaultCareers() {
    return [
      {
        CAREER_ID: 1,
        CAREER_NAME: 'Zhvillues Software',
        CAREER_DESCRIPTION: 'Zhvillimi i aplikacioneve dhe sistemeve kompjuterike me teknologji moderne',
        CATEGORY: 'Teknologji',
        REQUIRED_EDUCATION: 'Bachelor në Informatikë',
        AVERAGE_SALARY: 800,
        JOB_OUTLOOK: 'Shumë i Lartë',
        SKILLS_REQUIRED: 'Programim,JavaScript,Python,Problem Solving,Punë në Ekip'
      },
      {
        CAREER_ID: 2,
        CAREER_NAME: 'Mësues i Arsimit Fillor',
        CAREER_DESCRIPTION: 'Edukim dhe zhvillim i fëmijëve në nivelin e arsimit fillor',
        CATEGORY: 'Arsim',
        REQUIRED_EDUCATION: 'Bachelor në Psiko-Pedagogjik',
        AVERAGE_SALARY: 450,
        JOB_OUTLOOK: 'I Lartë',
        SKILLS_REQUIRED: 'Komunikim,Durim,Kreativitet,Organizim,Empati'
      },
      {
        CAREER_ID: 3,
        CAREER_NAME: 'Menaxher Marketing',
        CAREER_DESCRIPTION: 'Zhvillimi dhe implementimi i strategjive të marketingut për rritjen e biznesit',
        CATEGORY: 'Biznes',
        REQUIRED_EDUCATION: 'Bachelor në Marketing',
        AVERAGE_SALARY: 650,
        JOB_OUTLOOK: 'I Lartë',
        SKILLS_REQUIRED: 'Kreativitet,Analiza,Komunikim,Social Media,Strategji'
      },
      {
        CAREER_ID: 4,
        CAREER_NAME: 'Infermier i Regjistruar',
        CAREER_DESCRIPTION: 'Ofrimi i kujdesit shëndetësor të cilësisë së lartë për pacientët',
        CATEGORY: 'Shëndetësi',
        REQUIRED_EDUCATION: 'Bachelor në Infermieri',
        AVERAGE_SALARY: 500,
        JOB_OUTLOOK: 'Shumë i Lartë',
        SKILLS_REQUIRED: 'Kujdes Pacienti,Komunikim,Vendimmarrje,Empati'
      },
      {
        CAREER_ID: 5,
        CAREER_NAME: 'Inxhinier Civil',
        CAREER_DESCRIPTION: 'Projektimi dhe mbikëqyrja e infrastrukturës dhe ndërtimeve',
        CATEGORY: 'Inxhinieri',
        REQUIRED_EDUCATION: 'Bachelor në Inxhinieri Civile',
        AVERAGE_SALARY: 750,
        JOB_OUTLOOK: 'I Lartë',
        SKILLS_REQUIRED: 'Matematikë,Projektim,AutoCAD,Menaxhim Projektesh'
      }
    ];
  }

  static async searchCareers(searchTerm, category = null, salaryMin = null) {
    try {
      let sql = `
        SELECT CAREER_ID, CAREER_NAME, CAREER_DESCRIPTION, CATEGORY, AVERAGE_SALARY
        FROM CAREERS 
        WHERE IS_ACTIVE = 1
      `;
      
      const params = [];
      let paramIndex = 1;

      if (searchTerm) {
        sql += ` AND (UPPER(CAREER_NAME) LIKE :${paramIndex} OR UPPER(CAREER_DESCRIPTION) LIKE :${paramIndex})`;
        params.push(`%${searchTerm.toUpperCase()}%`);
        paramIndex++;
      }

      if (category) {
        sql += ` AND UPPER(CATEGORY) = :${paramIndex}`;
        params.push(category.toUpperCase());
        paramIndex++;
      }

      if (salaryMin) {
        sql += ` AND AVERAGE_SALARY >= :${paramIndex}`;
        params.push(salaryMin);
      }

      sql += ` ORDER BY CAREER_NAME`;

      const result = await executeQuery(sql, params);
      return result.rows || [];
    } catch (error) {
      console.error('Error searching careers:', error);
      return [];
    }
  }

  static async addCareer(careerData) {
    try {
      const sql = `
        INSERT INTO CAREERS (
          CAREER_NAME, CAREER_DESCRIPTION, CATEGORY, 
          REQUIRED_EDUCATION, AVERAGE_SALARY, JOB_OUTLOOK, 
          SKILLS_REQUIRED, IS_ACTIVE, CREATED_AT
        ) VALUES (
          :1, :2, :3, :4, :5, :6, :7, 1, SYSTIMESTAMP
        )
      `;

      const params = [
        careerData.name,
        careerData.description,
        careerData.category,
        careerData.education,
        careerData.salary,
        careerData.outlook,
        careerData.skills
      ];

      await executeQuery(sql, params);
      return true;
    } catch (error) {
      console.error('Error adding career:', error);
      throw error;
    }
  }

  static async updateCareer(careerId, careerData) {
    try {
      const sql = `
        UPDATE CAREERS SET
          CAREER_NAME = :1,
          CAREER_DESCRIPTION = :2,
          CATEGORY = :3,
          REQUIRED_EDUCATION = :4,
          AVERAGE_SALARY = :5,
          JOB_OUTLOOK = :6,
          SKILLS_REQUIRED = :7,
          UPDATED_AT = SYSTIMESTAMP
        WHERE CAREER_ID = :8 AND IS_ACTIVE = 1
      `;

      const params = [
        careerData.name,
        careerData.description,
        careerData.category,
        careerData.education,
        careerData.salary,
        careerData.outlook,
        careerData.skills,
        careerId
      ];

      await executeQuery(sql, params);
      return true;
    } catch (error) {
      console.error('Error updating career:', error);
      throw error;
    }
  }
}

module.exports = Career;