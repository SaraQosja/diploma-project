
export const UniversityDataStructure = {

  UNIVERSITY_ID: 'number',
  UNIVERSITY_NAME: 'string',
  LOCATION: 'string', 
  COUNTRY: 'string',
  UNIVERSITY_TYPE: 'string', 
  WEBSITE: 'string',
  CONTACT_INFO: 'CLOB', 
  TUITION_FEES: 'number',
  IS_ACTIVE: 'number',

  programs: [
    {
      PROGRAM_ID: 'number',
      PROGRAM_NAME: 'string',
      FACULTY: 'string',
      DURATION_YEARS: 'number',
      MIN_GRADE: 'number',
      REQUIRED_SUBJECTS: 'CLOB', 
      TUITION_FEE: 'number',
      LANGUAGE: 'string',
      CAREER_PATHS: 'CLOB', 
      DESCRIPTION: 'CLOB',
      ADMISSION_REQUIREMENTS: 'CLOB',
      FACILITIES: 'CLOB' 
    }
  ]
};

export const CareerDataStructure = {
  CAREER_ID: 'number',
  CAREER_NAME: 'string',
  CAREER_DESCRIPTION: 'CLOB',
  CATEGORY: 'string',
  REQUIRED_EDUCATION: 'string',
  AVERAGE_SALARY: 'number',
  JOB_OUTLOOK: 'string',
  SKILLS_REQUIRED: 'CLOB', 
  IS_ACTIVE: 'number'
};

export const RecommendationDataStructure = {
  RECOMMENDATION_ID: 'number',
  USER_ACCOUNT_ID: 'number',
  RECOMMENDATION_TYPE: 'string', 
  ITEM_ID: 'number', 
  MATCH_SCORE: 'number', // 0-100
  MATCH_REASON: 'CLOB',
  RANKING: 'number',
  IS_BOOKMARKED: 'number',
  VIEW_COUNT: 'number',
  GENERATED_AT: 'timestamp',

  details: 'object'
};


export const transformUniversityData = (dbUniversity) => {
  return {
    
    id: dbUniversity.UNIVERSITY_ID,
    universityId: dbUniversity.UNIVERSITY_ID,
    universityName: dbUniversity.UNIVERSITY_NAME,
    location: dbUniversity.LOCATION,
    country: dbUniversity.COUNTRY || 'Albania',
    type: dbUniversity.UNIVERSITY_TYPE?.toLowerCase(), // 'public' or 'private'
    website: dbUniversity.WEBSITE,
    contactInfo: safeParseJSON(dbUniversity.CONTACT_INFO),
    baseTuitionFees: dbUniversity.TUITION_FEES,
    isActive: dbUniversity.IS_ACTIVE === 1,
    
  
    programs: dbUniversity.programs?.map(transformProgramData) || []
  };
};

export const transformProgramData = (dbProgram) => {
  return {
    id: dbProgram.PROGRAM_ID,
    programId: dbProgram.PROGRAM_ID,
    name: dbProgram.PROGRAM_NAME,
    program: dbProgram.PROGRAM_NAME, 
    faculty: dbProgram.FACULTY,
    duration: dbProgram.DURATION_YEARS,
    minGrade: dbProgram.MIN_GRADE,
    requiredSubjects: safeParseJSON(dbProgram.REQUIRED_SUBJECTS) || [],
    tuitionFee: dbProgram.TUITION_FEE,
    language: dbProgram.LANGUAGE || 'Shqip',
    careerPaths: safeParseJSON(dbProgram.CAREER_PATHS) || [],
    description: dbProgram.DESCRIPTION,
    admissionRequirements: dbProgram.ADMISSION_REQUIREMENTS,
    facilities: safeParseJSON(dbProgram.FACILITIES) || []
  };
};

export const transformCareerData = (dbCareer) => {
  return {
    id: dbCareer.CAREER_ID,
    careerId: dbCareer.CAREER_ID,
    title: dbCareer.CAREER_NAME,
    description: dbCareer.CAREER_DESCRIPTION,
    category: dbCareer.CATEGORY,
    requiredEducation: dbCareer.REQUIRED_EDUCATION,
    educationLevel: dbCareer.REQUIRED_EDUCATION, 
    averageSalary: dbCareer.AVERAGE_SALARY,
    salaryRange: formatSalaryRange(dbCareer.AVERAGE_SALARY),
    jobOutlook: dbCareer.JOB_OUTLOOK,
    growth: dbCareer.JOB_OUTLOOK, 
    skillsRequired: safeParseJSON(dbCareer.SKILLS_REQUIRED) || [],
    skills: safeParseJSON(dbCareer.SKILLS_REQUIRED) || [], 
    isActive: dbCareer.IS_ACTIVE === 1
  };
};

export const transformRecommendationData = (dbRecommendation) => {
  return {
    id: dbRecommendation.RECOMMENDATION_ID,
    recommendationId: dbRecommendation.RECOMMENDATION_ID,
    userId: dbRecommendation.USER_ACCOUNT_ID,
    type: dbRecommendation.RECOMMENDATION_TYPE, 
    itemId: dbRecommendation.ITEM_ID,
    matchScore: Math.round(dbRecommendation.MATCH_SCORE),
    matchReason: dbRecommendation.MATCH_REASON,
    ranking: dbRecommendation.RANKING,
    isBookmarked: dbRecommendation.IS_BOOKMARKED === 1,
    viewCount: dbRecommendation.VIEW_COUNT || 0,
    generatedAt: dbRecommendation.GENERATED_AT,
    
    ...dbRecommendation.details
  };
};

const safeParseJSON = (jsonString) => {
  if (!jsonString) return null;
  
  try {
    
    if (typeof jsonString === 'object' && jsonString.toString) {
      jsonString = jsonString.toString();
    }
    
    if (typeof jsonString === 'string') {
      return JSON.parse(jsonString);
    }
    
    return jsonString;
  } catch (error) {
    console.warn('Failed to parse JSON:', jsonString);
    return null;
  }
};

const formatSalaryRange = (averageSalary) => {
  if (!averageSalary) return 'Nuk specifikohet';
  
  const min = Math.round(averageSalary * 0.8);
  const max = Math.round(averageSalary * 1.2);
  
  return `€${min.toLocaleString()} - €${max.toLocaleString()}/vit`;
};

export const SampleUniversityRecommendation = {
  id: 101,
  type: 'university',
  matchScore: 85,
  matchReason: 'Bazuar në notat tuaja të larta në matematikë dhe interesin për teknologji',
  
  universityId: 1,
  universityName: 'Universiteti Politeknik i Tiranës',
  location: 'Tiranë',
  type: 'public',
  website: 'https://upt.al',
  
  programId: 101,
  program: 'Inxhinieri Informatike',
  faculty: 'Fakulteti i Teknologjisë së Informacionit',
  duration: 4,
  minGrade: 8.0,
  tuitionFee: 0, // Public university
  language: 'Shqip',
  careerPaths: ['Software Engineer', 'Web Developer', 'System Administrator'],
  requiredSubjects: ['Matematikë', 'Fizikë', 'TIK'],
  facilities: ['Laboratorë kompjuterik', 'Qendër inovacioni', 'Bibliotekë digjitale']
};

export const SampleCareerRecommendation = {
  id: 1,
  type: 'career',
  matchScore: 92,
  matchReason: 'Përputhet përfekt me aftësitë tuaja logjike dhe kreativitetin për zgjidhjen e problemeve',
  

  careerId: 1,
  title: 'Zhvillues Software',
  description: 'Zhvillon aplikacione dhe sisteme software për kompani të ndryshme teknologjike',
  category: 'Teknologji',
  requiredEducation: 'Bachelor në Informatikë ose Inxhinieri',
  salaryRange: '€35,000 - €80,000/vit',
  jobOutlook: 'Shumë i lartë (+15% rritje)',
  skillsRequired: ['Programim', 'Zgjidhje problemesh', 'Punë në ekip', 'Komunikim'],
  
  icon: '💼',
  displayType: 'Karrierë'
};

export const validateUniversityData = (university) => {
  const required = ['universityName', 'location', 'type'];
  const missing = required.filter(field => !university[field]);
  
  if (missing.length > 0) {
    console.warn('Missing required university fields:', missing);
    return false;
  }
  
  return true;
};

export const validateCareerData = (career) => {
  const required = ['title', 'description', 'category'];
  const missing = required.filter(field => !career[field]);
  
  if (missing.length > 0) {
    console.warn('Missing required career fields:', missing);
    return false;
  }
  
  return true;
};

export const validateRecommendationData = (recommendation) => {
  const required = ['type', 'matchScore'];
  const missing = required.filter(field => recommendation[field] === undefined);
  
  if (missing.length > 0) {
    console.warn('Missing required recommendation fields:', missing);
    return false;
  }
  
  if (recommendation.matchScore < 0 || recommendation.matchScore > 100) {
    console.warn('Invalid match score:', recommendation.matchScore);
    return false;
  }
  
  return true;
};