// backend/controllers/testController.js
const { validationResult } = require('express-validator');
const Test = require('../models/Test');
const Recommendation = require('../models/Recommendation');

const submitTest = async (req, res) => {
  try {
    console.log('SUBMIT TEST CALLED:', req.params, req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Të dhëna të pavlefshme',
        errors: errors.array()
      });
    }

    const { testId } = req.params;
    const { answers, timeTaken: rawTimeTaken } = req.body;
    const userId = req.user.userId;

    
    let timeTaken = 1;
    if (rawTimeTaken && typeof rawTimeTaken === 'number' && rawTimeTaken > 0) {
      timeTaken = Math.max(1, Math.round(rawTimeTaken));
    }
    
    console.log('Processing test submission:', {
      userId,
      testId, 
      answerCount: Object.keys(answers || {}).length,
      validatedTimeTaken: timeTaken
    });
    
    const test = await Test.getTestById(testId);
    if (!test) {
      console.log('Test not found:', testId);
      return res.status(404).json({
        success: false,
        message: 'Testi nuk u gjet'
      });
    }

    console.log('Test found:', test.TEST_NAME);

  
    let scores = {};
    let detailedResults = {};
    
    try {
      const calculationResult = calculateDetailedTestResults(test, answers);
      scores = calculationResult.scores;
      detailedResults = calculationResult.details;
      
      console.log('Calculated scores:', scores);
      console.log('Detailed results structure:', Object.keys(detailedResults));
      
    } catch (scoreError) {
      console.error('Error calculating scores:', scoreError);
      scores = { general: 3.0 };
      detailedResults = {
        answers: answers,
        scores: scores,
        testType: test.TEST_TYPE,
        calculationError: scoreError.message
      };
    }

  
    const overallScore = calculateOverallScore(scores);
    
 
    const resultDetails = {
      answers: answers,
      scores: scores,
      testType: test.TEST_TYPE,
      testName: test.TEST_NAME,
      overallScore: overallScore,
      timeTaken: timeTaken,
      completedAt: new Date().toISOString(),
      analysis: detailedResults.analysis || {},
      preferences: detailedResults.preferences || {},
      strengths: detailedResults.strengths || [],
      recommendations: detailedResults.recommendations || []
    };

    console.log('Saving test result with detailed structure...');
    console.log('RESULT_DETAILS preview:', JSON.stringify(resultDetails, null, 2).substring(0, 500) + '...');


    const resultId = await Test.saveTestResult(userId, testId, answers, scores, resultDetails);
    console.log('Test result saved with ID:', resultId);

    console.log('Generating recommendations...');
    let recommendations = [];
    try {
      const userResults = await Test.getUserTestResults(userId);
      recommendations = await Recommendation.generateCareerRecommendations(userId, userResults);
    } catch (recError) {
      console.warn('Could not generate recommendations:', recError.message);
    }

    const response = {
      success: true,
      message: 'Testi u plotësua me sukses',
      data: {
        resultId,
        scores,
        overallScore,
        testTitle: test.TEST_NAME,
        completedAt: new Date().toISOString(),
        detailedResults: {
          analysis: detailedResults.analysis,
          strengths: detailedResults.strengths,
          preferences: detailedResults.preferences
        },
        recommendations: recommendations.slice(0, 5)
      }
    };

    console.log('Test submitted successfully with detailed results');
    res.json(response);

  } catch (error) {
    console.error('Error submitting test:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në dorëzimin e testit',
      error: error.message
    });
  }
};

const calculateDetailedTestResults = (test, answers) => {
  console.log('Calculating detailed results for test:', test.TEST_NAME, 'type:', test.TEST_TYPE);
  
  const scores = {};
  const categoryTotals = {};
  const categoryCounts = {};
  const categoryAnswers = {};
  const analysis = {};
  const preferences = {};
  const strengths = [];
  const recommendations = [];


  const initializeCategory = (category) => {
    if (!categoryTotals[category]) {
      categoryTotals[category] = 0;
      categoryCounts[category] = 0;
      categoryAnswers[category] = [];
    }
  };

 
  if (test.questions && test.questions.length > 0) {
    test.questions.forEach((question) => {
      const questionId = question.QUESTION_ID;
      const answer = answers[questionId];
      
      if (answer !== undefined && answer !== null) {
        const category = question.QUESTION_CATEGORY || 'General';
        const weight = question.WEIGHT || 1;
        
        initializeCategory(category);
       
        let numericAnswer = 0;
        let answerInterpretation = '';
        
        if (typeof answer === 'number') {
          numericAnswer = answer;
          answerInterpretation = getAnswerInterpretation(answer);
        } else if (typeof answer === 'string') {
          const result = parseStringAnswer(answer);
          numericAnswer = result.numeric;
          answerInterpretation = result.interpretation;
        } else {
          numericAnswer = 3;
          answerInterpretation = 'neutral';
        }

        const score = numericAnswer * weight;
        
        categoryTotals[category] += score;
        categoryCounts[category]++;
        categoryAnswers[category].push({
          questionId,
          questionText: question.QUESTION_TEXT,
          rawAnswer: answer,
          numericAnswer,
          interpretation: answerInterpretation,
          weight,
          score
        });
        
        console.log(`Question ${questionId}: ${numericAnswer} (${answerInterpretation}) -> ${score}`);
      }
    });
  }

  Object.keys(categoryTotals).forEach(category => {
    const total = categoryTotals[category];
    const count = categoryCounts[category];
    
    if (count > 0) {
      const testType = test.TEST_TYPE?.toLowerCase() || 'general';
      let finalScore = 0;
      
      if (testType === 'personality') {
        
        finalScore = parseFloat((total / count).toFixed(2));
        analysis[category] = analyzePersonalityScore(category, finalScore);
        
        if (finalScore >= 4.0) {
          strengths.push(`Strong ${category.toLowerCase()} traits`);
          preferences[category] = 'high';
        } else if (finalScore <= 2.0) {
          preferences[category] = 'low';
        } else {
          preferences[category] = 'moderate';
        }
        
      } else if (testType === 'interest') {
       
        finalScore = parseFloat(((total / count) * 20).toFixed(2));
        analysis[category] = analyzeInterestScore(category, finalScore);
        
        if (finalScore >= 70) {
          strengths.push(`High interest in ${category.toLowerCase()}`);
          preferences[category] = 'high';
          recommendations.push(`Consider careers in ${category.toLowerCase()} field`);
        } else if (finalScore <= 30) {
          preferences[category] = 'low';
        } else {
          preferences[category] = 'moderate';
        }
        
      } else if (testType === 'aptitude') {
       
        const maxPossible = count * 5;
        finalScore = parseFloat(((total / maxPossible) * 100).toFixed(2));
        analysis[category] = analyzeAptitudeScore(category, finalScore);
        
        if (finalScore >= 80) {
          strengths.push(`Excellent ${category.toLowerCase()} abilities`);
          preferences[category] = 'high';
          recommendations.push(`Leverage your strong ${category.toLowerCase()} skills`);
        } else if (finalScore <= 40) {
          preferences[category] = 'low';
        } else {
          preferences[category] = 'moderate';
        }
        
      } else {
       
        finalScore = parseFloat((total / count).toFixed(2));
        analysis[category] = `Average score in ${category}: ${finalScore}`;
        preferences[category] = finalScore >= 3.5 ? 'high' : finalScore <= 2.5 ? 'low' : 'moderate';
      }
      
      scores[category] = finalScore;
    }
  });

  if (Object.keys(scores).length === 0) {
    const answerValues = Object.values(answers).map(answer => {
      if (typeof answer === 'number') return answer;
      return parseStringAnswer(answer).numeric;
    });
    
    const totalAnswers = answerValues.length;
    const totalScore = answerValues.reduce((sum, val) => sum + val, 0);
    
    scores['General'] = totalAnswers > 0 ? parseFloat((totalScore / totalAnswers).toFixed(2)) : 0;
    analysis['General'] = `Overall assessment score: ${scores['General']}`;
    preferences['General'] = scores['General'] >= 3.5 ? 'positive' : 'neutral';
  }

  console.log('Final detailed calculation complete');
  
  return {
    scores,
    details: {
      analysis,
      preferences,
      strengths,
      recommendations,
      categoryAnswers,
      rawData: {
        categoryTotals,
        categoryCounts
      }
    }
  };
};


const parseStringAnswer = (answer) => {
  const lowerAnswer = answer.toLowerCase().trim();
  
  if (lowerAnswer === 'yes' || lowerAnswer === 'true') 
    return { numeric: 5, interpretation: 'strongly positive' };
  if (lowerAnswer === 'no' || lowerAnswer === 'false') 
    return { numeric: 1, interpretation: 'strongly negative' };
  if (lowerAnswer === 'strongly agree') 
    return { numeric: 5, interpretation: 'strongly agree' };
  if (lowerAnswer === 'agree') 
    return { numeric: 4, interpretation: 'agree' };
  if (lowerAnswer === 'neutral') 
    return { numeric: 3, interpretation: 'neutral' };
  if (lowerAnswer === 'disagree') 
    return { numeric: 2, interpretation: 'disagree' };
  if (lowerAnswer === 'strongly disagree') 
    return { numeric: 1, interpretation: 'strongly disagree' };
  
  const parsed = parseFloat(answer);
  if (!isNaN(parsed)) {
    return { numeric: parsed, interpretation: getAnswerInterpretation(parsed) };
  }
  
  return { numeric: 3, interpretation: 'neutral' };
};

const getAnswerInterpretation = (numericValue) => {
  if (numericValue >= 4.5) return 'very high';
  if (numericValue >= 3.5) return 'high';
  if (numericValue >= 2.5) return 'moderate';
  if (numericValue >= 1.5) return 'low';
  return 'very low';
};

const analyzePersonalityScore = (category, score) => {
  const traits = {
    'openness': 'creativity and openness to experience',
    'conscientiousness': 'organization and self-discipline',
    'extraversion': 'social interaction and energy',
    'agreeableness': 'cooperation and trust',
    'neuroticism': 'emotional stability'
  };
  
  const trait = traits[category.toLowerCase()] || category.toLowerCase();
  
  if (score >= 4.0) return `High level of ${trait}`;
  if (score <= 2.0) return `Low level of ${trait}`;
  return `Moderate level of ${trait}`;
};

const analyzeInterestScore = (category, score) => {
  if (score >= 80) return `Very strong interest in ${category.toLowerCase()} activities`;
  if (score >= 60) return `Good interest in ${category.toLowerCase()} activities`;
  if (score >= 40) return `Moderate interest in ${category.toLowerCase()} activities`;
  return `Limited interest in ${category.toLowerCase()} activities`;
};

const analyzeAptitudeScore = (category, score) => {
  if (score >= 80) return `Excellent ${category.toLowerCase()} abilities`;
  if (score >= 60) return `Good ${category.toLowerCase()} abilities`;
  if (score >= 40) return `Average ${category.toLowerCase()} abilities`;
  return `Below average ${category.toLowerCase()} abilities`;
};

const calculateOverallScore = (scores) => {
  const scoreValues = Object.values(scores);
  if (scoreValues.length === 0) return 0;
  
  const sum = scoreValues.reduce((total, score) => total + score, 0);
  return parseFloat((sum / scoreValues.length).toFixed(2));
};


const getAllTests = async (req, res) => {
  try {
    console.log('Getting all available tests...');
    const tests = await Test.getAllTests();

    const processedTests = [];
    for (const test of tests) {
      let description = 'Career assessment test';
      let testName = test.TEST_NAME || 'Unnamed Test';
      let testType = test.TEST_TYPE || 'General';

      try {
        if (test.TEST_DESCRIPTION) {
          if (typeof test.TEST_DESCRIPTION === 'string') {
            description = test.TEST_DESCRIPTION;
          } else {
            const descStr = test.TEST_DESCRIPTION.toString();
            if (descStr && descStr !== '[object Object]') {
              description = descStr;
            } else {
              if (test.TEST_TYPE?.toString().includes('personality')) {
                description = 'Assess your personality traits and characteristics to understand your work preferences and behavioral patterns.';
              } else if (test.TEST_TYPE?.toString().includes('interest')) {
                description = 'Discover your interests and passions to find career paths that align with what motivates you.';
              } else if (test.TEST_TYPE?.toString().includes('aptitude')) {
                description = 'Evaluate your natural abilities and cognitive strengths to identify careers where you can excel.';
              } else {
                description = 'Complete this assessment to gain insights about your career preferences and potential paths.';
              }
            }
          }
        }

        if (typeof test.TEST_NAME !== 'string') {
          testName = test.TEST_NAME?.toString() || 'Unnamed Test';
          if (testName === '[object Object]') {
            testName = 'Career Assessment Test';
          }
        }

        if (typeof test.TEST_TYPE !== 'string') {
          testType = test.TEST_TYPE?.toString() || 'General';
          if (testType === '[object Object]') {
            testType = 'General';
          }
        }
      } catch (error) {
        console.error('Error processing test data:', error);
        description = 'Career assessment test to help guide your career decisions.';
        testName = test.TEST_NAME || 'Career Assessment';
        testType = 'General';
      }

      const processedTest = {
        id: test.TEST_ID,
        title: testName,
        description: description,
        category: testType,
        duration: test.DURATION_MINUTES,
        questionCount: test.TOTAL_QUESTIONS,
        completionCount: test.COMPLETION_COUNT || 0,
        status: test.IS_ACTIVE ? 'active' : 'inactive',
        created_at: test.CREATED_AT
      };
      processedTests.push(processedTest);
    }

    console.log(`Retrieved ${processedTests.length} tests`);
    res.json({
      success: true,
      data: processedTests
    });

  } catch (error) {
    console.error('Error getting tests:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në marrjen e testeve',
      error: error.message
    });
  }
};

const getTest = async (req, res) => {
  try {
    const { testId } = req.params;
    console.log('Getting test by ID:', testId);

    const test = await Test.getTestById(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Testi nuk u gjet'
      });
    }

    console.log('Test found:', test.TEST_NAME, 'with', test.questions?.length || 0, 'questions');

    const processedQuestions = [];
    if (test.questions && test.questions.length > 0) {
      for (const q of test.questions) {
        const processedQuestion = {
          id: q.QUESTION_ID,
          text: q.QUESTION_TEXT?.toString() || 'Question text missing',
          type: q.QUESTION_TYPE?.toString() || 'scale',
          options: q.OPTIONS || [],
          order: q.QUESTION_ORDER,
          category: q.QUESTION_CATEGORY || 'General'
        };
        processedQuestions.push(processedQuestion);
      }
    }

    const response = {
      success: true,
      data: {
        id: test.TEST_ID,
        title: test.TEST_NAME?.toString() || 'Unnamed Test',
        description: test.TEST_DESCRIPTION?.toString() || 'No description',
        category: test.TEST_TYPE?.toString() || 'General',
        duration: test.DURATION_MINUTES || 15,
        questionCount: test.TOTAL_QUESTIONS || processedQuestions.length,
        instructions: test.INSTRUCTIONS?.toString() || 'Përgjigjuni në të gjitha pyetjet.',
        questions: processedQuestions
      }
    };

    console.log('Test response prepared with', processedQuestions.length, 'questions');
    res.json(response);

  } catch (error) {
    console.error('Error getting test:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në marrjen e testit',
      error: error.message
    });
  }
};

const getUserResults = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { testId } = req.query;

    console.log('Getting test results for user:', userId);

    const results = await Test.getUserTestResults(userId, testId);

    const processedResults = [];
    for (const result of results) {
      const processedResult = {
        id: result.RESULT_ID,
        testId: result.TEST_ID,
        testTitle: result.TEST_NAME?.toString() || 'Unnamed Test',
        testCategory: result.TEST_TYPE?.toString() || 'General',
        testDescription: result.TEST_DESCRIPTION?.toString() || 'No description',
        answers: result.RESULT_DETAILS?.answers || {},
        scores: result.RESULT_DETAILS?.scores || result.SCORE || {},
        completedAt: result.COMPLETED_AT
      };
      processedResults.push(processedResult);
    }

    console.log(`Retrieved ${processedResults.length} test results`);
    res.json({
      success: true,
      data: processedResults
    });

  } catch (error) {
    console.error('Error getting test results:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në marrjen e rezultateve',
      error: error.message
    });
  }
};

const getTestResult = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { resultId } = req.params;

    console.log('Getting specific test result:', resultId, 'for user:', userId);

    const results = await Test.getUserTestResults(userId);
    const result = results.find(r => String(r.RESULT_ID) === String(resultId));

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Rezultati nuk u gjet'
      });
    }

    const response = {
      success: true,
      data: {
        id: result.RESULT_ID,
        testId: result.TEST_ID,
        testTitle: result.TEST_NAME?.toString() || 'Unnamed Test',
        answers: result.RESULT_DETAILS?.answers || {},
        scores: result.RESULT_DETAILS?.scores || result.SCORE || {},
        completedAt: result.COMPLETED_AT
      }
    };

    console.log('Retrieved specific test result');
    res.json(response);
  } catch (error) {
    console.error('Error getting specific test result:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në marrjen e rezultatit',
      error: error.message
    });
  }
};

const getUserRecommendations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type } = req.query;

    console.log('Getting recommendations for user:', userId);

    const userResults = await Test.getUserTestResults(userId);
    const recommendations = await Recommendation.generateCareerRecommendations(userId, userResults);

    console.log(`Generated ${recommendations.length} recommendations`);
    res.json({
      success: true,
      data: recommendations
    });

  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në marrjen e rekomandimeve',
      error: error.message
    });
  }
};

const resetTestResult = async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.user.userId;

    console.log('Resetting test result:', { userId, testId });

    const deleteResult = await Test.deleteTestResult(userId, testId);
    
    if (deleteResult) {
      console.log('Test result reset successfully');
      res.json({
        success: true,
        message: 'Rezultati i testit u rivendos me sukses. Mund ta bëni testin përsëri.'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Rezultati i testit nuk u gjet'
      });
    }

  } catch (error) {
    console.error('Error resetting test result:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në rivendosjen e rezultatit të testit',
      error: error.message
    });
  }
};

module.exports = {
  getAllTests,
  getTest,
  submitTest,
  getUserResults,
  getTestResult,
  getUserRecommendations,
  resetTestResult
};