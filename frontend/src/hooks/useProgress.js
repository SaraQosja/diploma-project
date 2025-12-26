import { useState, useEffect, useCallback } from 'react';
import { progressAnalyticsService } from '../services/progressAnalyticsService';
import { useAuth } from './useAuth';

export const useProgress = () => {
  const { user, hasRole } = useAuth();
  const [overview, setOverview] = useState(null);
  const [testProgress, setTestProgress] = useState([]);
  const [learningPaths, setLearningPaths] = useState([]);
  const [activityTimeline, setActivityTimeline] = useState([]);
  const [performanceTrends, setPerformanceTrends] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [peerComparison, setPeerComparison] = useState(null);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  
  const isStudent = hasRole('nxenes');

  
  const loadOverview = useCallback(async () => {
    if (!isStudent) return;
    
    try {
      setLoading(true);
      const response = await progressAnalyticsService.getUserProgress();
      const formattedProgress = progressAnalyticsService.formatProgressData(response.data.progress);
      setOverview(formattedProgress);
      setError(null);
    } catch (err) {
      console.error('Error loading overview:', err);
      setError('Gabim në ngarkimin e përparimit të përgjithshëm');
    } finally {
      setLoading(false);
    }
  }, [isStudent]);


  
  const loadTestProgress = useCallback(async (limit = 10) => {
    if (!isStudent) return;
    
    try {
      setLoading(true);
      const response = await progressAnalyticsService.getTestProgress(limit);
      const formattedTests = progressAnalyticsService.formatTestResults(response.data.testProgress);
      setTestProgress(formattedTests);
      setError(null);
    } catch (err) {
      console.error('Error loading test progress:', err);
      setError('Gabim në ngarkimin e përparimit të testeve');
    } finally {
      setLoading(false);
    }
  }, [isStudent]);


  
  const loadLearningPaths = useCallback(async () => {
    if (!isStudent) return;
    
    try {
      setLoading(true);
      const response = await progressAnalyticsService.getLearningPathProgress();
      const formattedPaths = progressAnalyticsService.formatLearningPaths(response.data.learningPaths);
      setLearningPaths(formattedPaths);
      setError(null);
    } catch (err) {
      console.error('Error loading learning paths:', err);
      setError('Gabim në ngarkimin e rrugëve të të mësuarit');
    } finally {
      setLoading(false);
    }
  }, [isStudent]);


  
  const loadActivityTimeline = useCallback(async (days = 30) => {
    if (!isStudent) return;
    
    try {
      setLoading(true);
      const response = await progressAnalyticsService.getActivityTimeline(days);
      const formattedTimeline = progressAnalyticsService.formatActivityTimeline(response.data.timeline);
      setActivityTimeline(formattedTimeline);
      setError(null);
    } catch (err) {
      console.error('Error loading activity timeline:', err);
      setError('Gabim në ngarkimin e kronologjisë së aktivitetit');
    } finally {
      setLoading(false);
    }
  }, [isStudent]);


  
  const loadPerformanceTrends = useCallback(async (months = 6) => {
    if (!isStudent) return;
    
    try {
      setLoading(true);
      const response = await progressAnalyticsService.getPerformanceTrends(months);
      setPerformanceTrends(response.data.trends);
      setError(null);
    } catch (err) {
      console.error('Error loading performance trends:', err);
      setError('Gabim në ngarkimin e trendeve të performancës');
    } finally {
      setLoading(false);
    }
  }, [isStudent]);

  
  const loadAchievements = useCallback(async () => {
    if (!isStudent) return;
    
    try {
      setLoading(true);
      const response = await progressAnalyticsService.getAchievements();
      const formattedAchievements = progressAnalyticsService.formatAchievements(response.data.achievements);
      setAchievements(formattedAchievements);
      setError(null);
    } catch (err) {
      console.error('Error loading achievements:', err);
      setError('Gabim në ngarkimin e arritjeve');
    } finally {
      setLoading(false);
    }
  }, [isStudent]);

  
  const loadPeerComparison = useCallback(async () => {
    if (!isStudent) return;
    
    try {
      setLoading(true);
      const response = await progressAnalyticsService.getPeerComparison();
      setPeerComparison(response.data.comparison);
      setError(null);
    } catch (err) {
      console.error('Error loading peer comparison:', err);
      setError('Gabim në ngarkimin e krahasimit me bashkëmoshatarët');
    } finally {
      setLoading(false);
    }
  }, [isStudent]);

  // Load weekly activity
  const loadWeeklyActivity = useCallback(async () => {
    if (!isStudent) return;
    
    try {
      setLoading(true);
      const response = await progressAnalyticsService.getWeeklyActivity();
      setWeeklyActivity(response.data.weeklyActivity);
      setError(null);
    } catch (err) {
      console.error('Error loading weekly activity:', err);
      setError('Gabim në ngarkimin e aktivitetit javor');
    } finally {
      setLoading(false);
    }
  }, [isStudent]);

  // Load dashboard summary
  const loadDashboardSummary = useCallback(async () => {
    if (!isStudent) return;
    
    try {
      setLoading(true);
      const response = await progressAnalyticsService.getDashboardSummary();
      setDashboardSummary(response.data.summary);
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard summary:', err);
      setError('Gabim në ngarkimin e përmbledhjes së dashboard-it');
    } finally {
      setLoading(false);
    }
  }, [isStudent]);


  const loadAllData = useCallback(async () => {
    if (!isStudent) return;
    
    try {
      setLoading(true);
      await Promise.all([
        loadOverview(),
        loadTestProgress(5),
        loadLearningPaths(),
        loadWeeklyActivity(),
        loadAchievements()
      ]);
    } catch (err) {
      console.error('Error loading all progress data:', err);
      setError('Gabim në ngarkimin e të dhënave të përparimit');
    } finally {
      setLoading(false);
    }
  }, [isStudent, loadOverview, loadTestProgress, loadLearningPaths, loadWeeklyActivity, loadAchievements]);

  const refresh = useCallback(async (dataType) => {
    switch (dataType) {
      case 'overview':
        await loadOverview();
        break;
      case 'tests':
        await loadTestProgress();
        break;
      case 'paths':
        await loadLearningPaths();
        break;
      case 'timeline':
        await loadActivityTimeline();
        break;
      case 'trends':
        await loadPerformanceTrends();
        break;
      case 'achievements':
        await loadAchievements();
        break;
      case 'peers':
        await loadPeerComparison();
        break;
      case 'weekly':
        await loadWeeklyActivity();
        break;
      case 'dashboard':
        await loadDashboardSummary();
        break;
      case 'all':
        await loadAllData();
        break;
      default:
        console.warn('Unknown data type for refresh:', dataType);
    }
  }, [
    loadOverview,
    loadTestProgress,
    loadLearningPaths,
    loadActivityTimeline,
    loadPerformanceTrends,
    loadAchievements,
    loadPeerComparison,
    loadWeeklyActivity,
    loadDashboardSummary,
    loadAllData
  ]);

  const getMotivationalMessage = useCallback(() => {
    return progressAnalyticsService.getMotivationalMessage(overview);
  }, [overview]);

  const getOverallProgressScore = useCallback(() => {
    if (!overview) return 0;

    const testScore = Math.min(overview.testStats.completed * 10, 40); // Max 40 points
    const averageScore = Math.min(overview.testStats.averageScore * 0.3, 30); // Max 30 points
    const chatScore = Math.min(overview.chatStats.totalSessions * 5, 20); // Max 20 points
    const recommendationScore = Math.min(overview.recommendationStats.total * 2, 10); // Max 10 points

    return Math.round(testScore + averageScore + chatScore + recommendationScore);
  }, [overview]);

  const getProgressLevel = useCallback(() => {
    const score = getOverallProgressScore();
    
    if (score >= 90) return { level: 'Ekspert', color: 'text-purple-600', icon: '👑' };
    if (score >= 70) return { level: 'I Avancuar', color: 'text-green-600', icon: '🎖️' };
    if (score >= 50) return { level: 'I Mesëm', color: 'text-blue-600', icon: '📈' };
    if (score >= 25) return { level: 'Fillestar', color: 'text-yellow-600', icon: '🌱' };
    return { level: 'I Ri', color: 'text-gray-600', icon: '🎯' };
  }, [getOverallProgressScore]);


  useEffect(() => {
    if (user && isStudent) {
      loadAllData();
    }
  }, [user, isStudent, loadAllData]);

  return {
    // Data
    overview,
    testProgress,
    learningPaths,
    activityTimeline,
    performanceTrends,
    achievements,
    peerComparison,
    weeklyActivity,
    dashboardSummary,
    
    // State
    loading,
    error,
    isStudent,
    
    // Actions
    loadOverview,
    loadTestProgress,
    loadLearningPaths,
    loadActivityTimeline,
    loadPerformanceTrends,
    loadAchievements,
    loadPeerComparison,
    loadWeeklyActivity,
    loadDashboardSummary,
    loadAllData,
    refresh,
    
    // Utilities
    getMotivationalMessage,
    getOverallProgressScore,
    getProgressLevel,
    setError
  };
};