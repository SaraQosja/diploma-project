// backend/utils/recommendationAlgorithm.js 
class RecommendationAlgorithm {

  
  static analyzeUserProfile(testResults) {
    const profile = {
      personality: {},
      interests: {},
      aptitudes: {},
      strengths: [],
      preferences: {}
    };

    if (!testResults || testResults.length === 0) return profile;

    testResults.forEach(result => {
      const details = result.RESULT_DETAILS || result.detailedScores || {};
      const scores = details.scores || details || {};
      const testType = (result.TEST_TYPE || result.testType || '').toLowerCase();

      switch(testType) {
        case 'personality':
          profile.personality = {
            openness: this.normalizeScore(scores.openness || scores.Openness || 0),
            conscientiousness: this.normalizeScore(scores.conscientiousness || scores.Conscientiousness || 0),
            extraversion: this.normalizeScore(scores.extraversion || scores.Extraversion || 0),
            agreeableness: this.normalizeScore(scores.agreeableness || scores.Agreeableness || 0),
            neuroticism: this.normalizeScore(scores.neuroticism || scores.Neuroticism || 0)
          };
          break;

        case 'interest':
          profile.interests = {
            realistic: this.normalizeScore(scores.realistic || scores.Realistic || 0),
            investigative: this.normalizeScore(scores.investigative || scores.Investigative || 0),
            artistic: this.normalizeScore(scores.artistic || scores.Artistic || 0),
            social: this.normalizeScore(scores.social || scores.Social || 0),
            enterprising: this.normalizeScore(scores.enterprising || scores.Enterprising || 0),
            conventional: this.normalizeScore(scores.conventional || scores.Conventional || 0)
          };
          break;

        case 'aptitude':
          profile.aptitudes = {
            verbal: this.normalizeScore(scores.verbal || scores.Verbal || 0),
            numerical: this.normalizeScore(scores.numerical || scores.Numerical || 0),
            spatial: this.normalizeScore(scores.spatial || scores.Spatial || 0),
            logical: this.normalizeScore(scores.logical || scores.Logical || 0),
            creative: this.normalizeScore(scores.creative || scores.Creative || 0)
          };
          break;
      }
    });

    profile.strengths = this.identifyStrengths(profile);
    return profile;
  }

  // Normalize scores to 0-100 range
  static normalizeScore(score) {
    if (score >= 0 && score <= 1) return score * 100;
    if (score >= 0 && score <= 5) return score * 20;
    return Math.max(0, Math.min(100, score));
  }

  static calculateCareerMatches(userProfile, careers) {
    return careers.map(career => {
      const matchScore = this.calculateMatchScore(userProfile, career);
      const matchReason = this.generateMatchReason(userProfile, career, matchScore);

      return {
        id: career.CAREER_ID,
        careerId: career.CAREER_ID,
        title: career.CAREER_NAME,
        description: career.CAREER_DESCRIPTION || career.DESCRIPTION,
        category: career.CATEGORY,
        matchScore: Math.round(matchScore * 100) / 100,
        matchReason: matchReason,
        salaryRange: this.formatSalary(career.AVERAGE_SALARY),
        jobOutlook: career.JOB_OUTLOOK,
        educationLevel: career.REQUIRED_EDUCATION,
        skills: this.parseSkills(career.SKILLS_REQUIRED),
        type: 'career'
      };
    });
  }

  static calculateMatchScore(userProfile, career) {
    let totalScore = 0;
    let factorCount = 0;

    // Interest match (50% weight) - most important
    if (userProfile.interests && Object.keys(userProfile.interests).length > 0) {
      const interestScore = this.calculateInterestMatch(userProfile.interests, career);
      totalScore += interestScore * 0.5;
      factorCount += 0.5;
    }

    // Aptitude match (30% weight)
    if (userProfile.aptitudes && Object.keys(userProfile.aptitudes).length > 0) {
      const aptitudeScore = this.calculateAptitudeMatch(userProfile.aptitudes, career);
      totalScore += aptitudeScore * 0.3;
      factorCount += 0.3;
    }

    // Personality match (20% weight)
    if (userProfile.personality && Object.keys(userProfile.personality).length > 0) {
      const personalityScore = this.calculatePersonalityMatch(userProfile.personality, career);
      totalScore += personalityScore * 0.2;
      factorCount += 0.2;
    }

    return factorCount > 0 ? totalScore / factorCount : 0.5;
  }

  // Calculate interest compatibility using Holland Code
  static calculateInterestMatch(interests, career) {
    const careerInterests = this.getCareerInterestProfile(career.CAREER_NAME);
    
    let matchScore = 0;
    let totalWeight = 0;

    Object.keys(interests).forEach(interest => {
      const userScore = interests[interest] / 100;
      const careerWeight = careerInterests[interest] / 100 || 0;
      
      matchScore += userScore * careerWeight;
      totalWeight += careerWeight;
    });

    return totalWeight > 0 ? matchScore / totalWeight : 0.5;
  }

  // Calculate personality fit for career
  static calculatePersonalityMatch(personality, career) {
    const careerPersonality = this.getCareerPersonalityProfile(career.CAREER_NAME);
    
    let matchScore = 0;
    let factorCount = 0;

    Object.keys(personality).forEach(trait => {
      const userScore = personality[trait] / 20; // Convert to 0-5 scale
      const idealRange = careerPersonality[trait];
      
      if (idealRange && userScore > 0) {
        const distance = this.calculateTraitDistance(userScore, idealRange);
        matchScore += Math.max(0, 1 - distance / 2.5);
        factorCount++;
      }
    });

    return factorCount > 0 ? matchScore / factorCount : 0.5;
  }

  // Calculate aptitude requirements match
  static calculateAptitudeMatch(aptitudes, career) {
    const careerAptitudes = this.getCareerAptitudeProfile(career.CAREER_NAME);
    
    let matchScore = 0;
    let totalWeight = 0;

    Object.keys(aptitudes).forEach(aptitude => {
      const userScore = aptitudes[aptitude] / 100;
      const requiredLevel = careerAptitudes[aptitude] / 100 || 0;
      
      if (requiredLevel > 0 && userScore > 0) {
        const match = Math.min(userScore / requiredLevel, 1.5);
        matchScore += match * requiredLevel;
        totalWeight += requiredLevel;
      }
    });

    return totalWeight > 0 ? matchScore / totalWeight : 0.5;
  }

  // Get career interest profile (Holland Code mapping) - UPDATED FOR ALBANIA
  static getCareerInterestProfile(careerName) {
    const name = careerName.toLowerCase();
    
    // Technology & Engineering
    if (name.includes('software') || name.includes('programues') || name.includes('zhvillues')) {
      return { investigative: 80, realistic: 60, conventional: 40, artistic: 30, social: 20, enterprising: 25 };
    }
    if (name.includes('inxhinier') || name.includes('engineer')) {
      return { realistic: 85, investigative: 75, conventional: 50, artistic: 25, social: 30, enterprising: 35 };
    }
    if (name.includes('teknolog') || name.includes('it')) {
      return { investigative: 70, realistic: 65, conventional: 55, artistic: 25, social: 25, enterprising: 30 };
    }

    // Business & Finance
    if (name.includes('marketing') || name.includes('tregtari')) {
      return { enterprising: 85, artistic: 60, social: 50, conventional: 45, investigative: 35, realistic: 20 };
    }
    if (name.includes('bankier') || name.includes('financa') || name.includes('kontabilist')) {
      return { conventional: 80, enterprising: 60, investigative: 55, social: 30, realistic: 25, artistic: 20 };
    }
    if (name.includes('menaxher') || name.includes('drejtues')) {
      return { enterprising: 90, social: 60, conventional: 50, investigative: 40, realistic: 30, artistic: 35 };
    }

    // Healthcare
    if (name.includes('mjek') || name.includes('doctor') || name.includes('kirurg')) {
      return { investigative: 85, social: 80, realistic: 55, conventional: 50, artistic: 25, enterprising: 40 };
    }
    if (name.includes('infermier') || name.includes('nurse')) {
      return { social: 90, realistic: 60, investigative: 50, conventional: 45, artistic: 25, enterprising: 30 };
    }
    if (name.includes('farmacist') || name.includes('dentist')) {
      return { investigative: 75, social: 70, realistic: 50, conventional: 60, artistic: 20, enterprising: 35 };
    }

    // Education
    if (name.includes('mesues') || name.includes('teacher') || name.includes('profesor')) {
      return { social: 90, artistic: 50, investigative: 60, conventional: 40, enterprising: 30, realistic: 25 };
    }
    if (name.includes('pedagog') || name.includes('edukator')) {
      return { social: 85, artistic: 60, investigative: 50, conventional: 35, enterprising: 25, realistic: 20 };
    }

    // Creative Arts
    if (name.includes('artist') || name.includes('dizajner') || name.includes('grafik')) {
      return { artistic: 95, enterprising: 40, investigative: 35, realistic: 30, social: 25, conventional: 20 };
    }
    if (name.includes('gazetar') || name.includes('shkrimtar') || name.includes('journalist')) {
      return { artistic: 80, investigative: 60, social: 50, enterprising: 45, conventional: 25, realistic: 15 };
    }

    // Law & Government
    if (name.includes('jurist') || name.includes('avokat') || name.includes('lawyer')) {
      return { enterprising: 75, investigative: 70, social: 60, conventional: 55, artistic: 35, realistic: 20 };
    }
    if (name.includes('polici') || name.includes('sigurim')) {
      return { realistic: 70, social: 60, conventional: 65, enterprising: 50, investigative: 45, artistic: 15 };
    }

    // Agriculture & Environment
    if (name.includes('agr') || name.includes('bujq') || name.includes('veteriner')) {
      return { realistic: 80, investigative: 60, conventional: 45, social: 50, artistic: 25, enterprising: 35 };
    }

    // Tourism & Services
    if (name.includes('turizm') || name.includes('hotelier') || name.includes('guide')) {
      return { social: 80, enterprising: 70, conventional: 40, artistic: 50, investigative: 25, realistic: 30 };
    }

    // Default profile
    return { realistic: 50, investigative: 50, artistic: 50, social: 50, enterprising: 50, conventional: 50 };
  }

  // Get career personality requirements
  static getCareerPersonalityProfile(careerName) {
    const name = careerName.toLowerCase();
    
    if (name.includes('software') || name.includes('programues')) {
      return { openness: [3.5, 5], conscientiousness: [3.5, 5], extraversion: [2, 4], agreeableness: [2.5, 4.5], neuroticism: [1, 3.5] };
    }
    if (name.includes('marketing') || name.includes('tregtari')) {
      return { openness: [3, 5], conscientiousness: [3, 4.5], extraversion: [3.5, 5], agreeableness: [3, 4.5], neuroticism: [1, 3.5] };
    }
    if (name.includes('mesues') || name.includes('profesor')) {
      return { openness: [3, 4.5], conscientiousness: [3.5, 4.5], extraversion: [3, 5], agreeableness: [3.5, 5], neuroticism: [1, 3.5] };
    }
    if (name.includes('mjek') || name.includes('doctor')) {
      return { openness: [3, 4.5], conscientiousness: [4, 5], extraversion: [2.5, 4.5], agreeableness: [3.5, 5], neuroticism: [1, 3] };
    }

    return { openness: [2, 4.5], conscientiousness: [2, 4.5], extraversion: [2, 4.5], agreeableness: [2, 4.5], neuroticism: [1.5, 4] };
  }

  // Get career aptitude requirements
  static getCareerAptitudeProfile(careerName) {
    const name = careerName.toLowerCase();
    
    if (name.includes('software') || name.includes('programues')) {
      return { logical: 85, verbal: 60, numerical: 70, spatial: 50, creative: 65 };
    }
    if (name.includes('inxhinier')) {
      return { logical: 90, numerical: 95, spatial: 85, verbal: 50, creative: 60 };
    }
    if (name.includes('marketing')) {
      return { verbal: 90, creative: 85, logical: 60, numerical: 65, spatial: 45 };
    }
    if (name.includes('mesues')) {
      return { verbal: 90, creative: 70, logical: 65, numerical: 55, spatial: 45 };
    }
    if (name.includes('mjek')) {
      return { logical: 85, verbal: 75, numerical: 70, spatial: 60, creative: 50 };
    }

    return { verbal: 60, numerical: 60, spatial: 60, logical: 60, creative: 60 };
  }

  // Calculate distance between user trait and ideal range
  static calculateTraitDistance(userScore, idealRange) {
    const [min, max] = idealRange;
    if (userScore >= min && userScore <= max) return 0;
    if (userScore < min) return min - userScore;
    return userScore - max;
  }

  // Identify user's strengths from profile
  static identifyStrengths(profile) {
    const strengths = [];

    // Interest strengths
    if (profile.interests) {
      const topInterests = Object.entries(profile.interests)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2);
      
      topInterests.forEach(([interest, score]) => {
        if (score >= 70) {
          const labels = {
            realistic: 'Praktik & Me Duar',
            investigative: 'Analitik & Hulumtues',
            artistic: 'Kreativ & Ekspresiv',
            social: 'I Fokusuar te Njerëzit',
            enterprising: 'Lider & Biznesmen',
            conventional: 'I Organizuar & Detajist'
          };
          if (labels[interest]) strengths.push(labels[interest]);
        }
      });
    }

    // Aptitude strengths
    if (profile.aptitudes) {
      Object.entries(profile.aptitudes).forEach(([aptitude, score]) => {
        if (score >= 75) {
          const labels = {
            verbal: 'Komunikim i Fortë',
            numerical: 'Aftësi Matematikore',
            spatial: 'Mendim Vizual',
            logical: 'Zgjidhje Problemesh',
            creative: 'Kreativitet i Lartë'
          };
          if (labels[aptitude]) strengths.push(labels[aptitude]);
        }
      });
    }

    return strengths.slice(0, 5);
  }

  // Generate match explanation
  static generateMatchReason(userProfile, career, matchScore) {
    const reasons = [];

    // Interest matches
    if (userProfile.interests && Object.keys(userProfile.interests).length > 0) {
      const topUserInterest = Object.entries(userProfile.interests)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (topUserInterest && topUserInterest[1] >= 60) {
        const interestNames = {
          realistic: 'punë praktike',
          investigative: 'analizë dhe hulumtim', 
          artistic: 'shprehje kreative',
          social: 'ndihmë ndaj të tjerëve',
          enterprising: 'udhëheqje dhe biznes',
          conventional: 'punë të strukturuar'
        };
        reasons.push(`Përputhet me interesin tuaj për ${interestNames[topUserInterest[0]]}`);
      }
    }

    // Aptitude matches
    if (userProfile.aptitudes) {
      const strongAptitudes = Object.entries(userProfile.aptitudes)
        .filter(([, score]) => score >= 70)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2);
      
      strongAptitudes.forEach(([aptitude]) => {
        if (reasons.length < 2) {
          const aptitudeNames = {
            verbal: 'aftësitë e komunikimit',
            numerical: 'aftësitë matematikore',
            spatial: 'mendimin vizual',
            logical: 'zgjidhjen e problemeve',
            creative: 'kreativitetin'
          };
          if (aptitudeNames[aptitude]) {
            reasons.push(`Përfiton nga ${aptitudeNames[aptitude]} të forta`);
          }
        }
      });
    }

    // Default reasons
    if (reasons.length === 0) {
      if (matchScore >= 0.8) {
        reasons.push('Përputhje e shkëlqyer me profilin tuaj');
      } else if (matchScore >= 0.6) {
        reasons.push('Përputhje e mirë me interesat tuaja');
      } else {
        reasons.push('Bazuar në rezultatet e testeve tuaja');
      }
    }

    return reasons.slice(0, 3).join('. ') || 'Bazuar në profilin tuaj';
  }

  // Helper functions
  static formatSalary(salary) {
    if (!salary) return 'Nuk specifikohet';
    if (typeof salary === 'number') {
      return salary > 1000 ? `${Math.round(salary/1000)}k - ${Math.round(salary*1.5/1000)}k Euro/vit` : `${salary} - ${Math.round(salary*1.5)} Euro/muaj`;
    }
    return String(salary);
  }

  static parseSkills(skillsString) {
    if (!skillsString) return [];
    if (Array.isArray(skillsString)) return skillsString;
    return String(skillsString).split(',').map(s => s.trim()).filter(Boolean);
  }

  // Get default careers for Albania
  static getDefaultCareers() {
    return [
      {
        CAREER_ID: 1,
        CAREER_NAME: 'Zhvillues Software',
        CAREER_DESCRIPTION: 'Zhvillon aplikacione dhe sisteme software',
        CATEGORY: 'Teknologji',
        AVERAGE_SALARY: 800,
        JOB_OUTLOOK: 'Shumë i Lartë',
        REQUIRED_EDUCATION: 'Bachelor',
        SKILLS_REQUIRED: 'Programim,Zgjidhje Problemesh,Punë Ekipore'
      },
      {
        CAREER_ID: 2,
        CAREER_NAME: 'Menaxher Marketingu',
        CAREER_DESCRIPTION: 'Zhvillon dhe zbaton strategji marketingu për produkte dhe shërbime',
        CATEGORY: 'Biznes',
        AVERAGE_SALARY: 700,
        JOB_OUTLOOK: 'I Lartë',
        REQUIRED_EDUCATION: 'Bachelor',
        SKILLS_REQUIRED: 'Komunikim,Kreativitet,Analiza'
      },
      {
        CAREER_ID: 3,
        CAREER_NAME: 'Infermier i Regjistruar',
        CAREER_DESCRIPTION: 'Ofron kujdes dhe mbështetje për pacientët në mjedise të kujdesit shëndetësor',
        CATEGORY: 'Shëndetësi',
        AVERAGE_SALARY: 500,
        JOB_OUTLOOK: 'Shumë i Lartë',
        REQUIRED_EDUCATION: 'Bachelor',
        SKILLS_REQUIRED: 'Kujdes Pacienti,Komunikim,Mendim Kritik'
      },
      {
        CAREER_ID: 4,
        CAREER_NAME: 'Mësues Fillor',
        CAREER_DESCRIPTION: 'Edukon dhe mbështet nxënësit e rinj në zhvillimin e tyre akademik dhe personal',
        CATEGORY: 'Arsim',
        AVERAGE_SALARY: 400,
        JOB_OUTLOOK: 'Mesatar',
        REQUIRED_EDUCATION: 'Bachelor',
        SKILLS_REQUIRED: 'Mësimdhënie,Komunikim,Durim'
      },
      {
        CAREER_ID: 5,
        CAREER_NAME: 'Inxhinier Civil',
        CAREER_DESCRIPTION: 'Projekton dhe mbikëqyr ndërtimin e infrastrukturës',
        CATEGORY: 'Inxhinieri',
        AVERAGE_SALARY: 900,
        JOB_OUTLOOK: 'I Lartë',
        REQUIRED_EDUCATION: 'Bachelor',
        SKILLS_REQUIRED: 'Matematikë,Projektim,Menaxhim Projektesh'
      },
      {
        CAREER_ID: 6,
        CAREER_NAME: 'Mjek i Përgjithshëm',
        CAREER_DESCRIPTION: 'Ofron kujdes mjekësor primar dhe diagnostikon sëmundjet',
        CATEGORY: 'Shëndetësi',
        AVERAGE_SALARY: 1200,
        JOB_OUTLOOK: 'Shumë i Lartë',
        REQUIRED_EDUCATION: 'Master',
        SKILLS_REQUIRED: 'Diagnoza,Komunikim,Mendim Kritik'
      }
    ];
  }
}

module.exports = RecommendationAlgorithm;