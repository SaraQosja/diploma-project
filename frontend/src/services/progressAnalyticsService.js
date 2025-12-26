import { progressAPI } from './api';

export const progressAnalyticsService = {
  
  getUserProgress: async () => {
    return await progressAPI.getUserProgress();
  },

  
  getTestProgress: async (limit = 10) => {
    return await progressAPI.getTestProgress(limit);
  },

  getLearningPathProgress: async () => {
    return await progressAPI.getLearningPathProgress();
  },

  getActivityTimeline: async (days = 30) => {
    return await progressAPI.getActivityTimeline(days);
  },

 
  getPerformanceTrends: async (months = 6) => {
    return await progressAPI.getPerformanceTrends(months);
  },

  
  getAchievements: async () => {
    return await progressAPI.getAchievements();
  },

  getPeerComparison: async () => {
    return await progressAPI.getPeerComparison();
  },

  getWeeklyActivity: async () => {
    return await progressAPI.getWeeklyActivity();
  },

  getDashboardSummary: async () => {
    return await progressAPI.getDashboardSummary();
  },

 
  formatProgressData: (progress) => {
    if (!progress) return null;

    return {
      ...progress,
      formattedRegisteredDate: new Date(progress.registeredDate).toLocaleDateString('sq-AL'),
      testStats: {
        ...progress.testStats,
        formattedLastTestDate: progress.testStats.lastTestDate 
          ? new Date(progress.testStats.lastTestDate).toLocaleDateString('sq-AL')
          : 'Asnjëherë'
      },
      chatStats: {
        ...progress.chatStats,
        formattedLastMessageDate: progress.chatStats.lastMessageDate 
          ? new Date(progress.chatStats.lastMessageDate).toLocaleDateString('sq-AL')
          : 'Asnjëherë'
      },
      recommendationStats: {
        ...progress.recommendationStats,
        formattedLastDate: progress.recommendationStats.lastDate 
          ? new Date(progress.recommendationStats.lastDate).toLocaleDateString('sq-AL')
          : 'Asnjëherë'
      }
    };
  },

  formatTestResults: (testResults) => {
    return testResults.map(test => ({
      ...test,
      formattedStartedAt: new Date(test.startedAt).toLocaleString('sq-AL'),
      formattedCompletedAt: test.completedAt 
        ? new Date(test.completedAt).toLocaleString('sq-AL')
        : 'Jo të plotësuar',
      statusText: {
        'completed': 'I plotësuar',
        'in_progress': 'Në vazhdim',
        'abandoned': 'I braktisur'
      }[test.status] || test.status,
      scoreColor: this.getScoreColor(test.percentage),
      durationText: test.duration ? `${test.duration} minuta` : 'N/A'
    }));
  },

 
  formatLearningPaths: (paths) => {
    return paths.map(path => ({
      ...path,
      formattedLastActivity: path.lastActivity 
        ? new Date(path.lastActivity).toLocaleDateString('sq-AL')
        : 'Asnjë aktivitet',
      statusText: {
        'not_started': 'Nuk ka filluar',
        'beginner': 'Fillestar',
        'intermediate': 'I mesëm',
        'advanced': 'I avancuar',
        'completed': 'I plotësuar'
      }[path.status] || path.status,
      statusColor: this.getPathStatusColor(path.status),
      progressWidth: `${path.completionRate}%`
    }));
  },

  formatActivityTimeline: (timeline) => {
    return timeline.map(day => ({
      ...day,
      formattedDate: new Date(day.date).toLocaleDateString('sq-AL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      activitiesByType: day.activities.reduce((acc, activity) => {
        acc[activity.type] = (acc[activity.type] || 0) + activity.count;
        return acc;
      }, {}),
      totalActivities: day.activities.reduce((sum, activity) => sum + activity.count, 0)
    }));
  },

  formatAchievements: (achievements) => {
    return achievements.map(achievement => ({
      ...achievement,
      formattedEarnedAt: achievement.earnedAt 
        ? new Date(achievement.earnedAt).toLocaleDateString('sq-AL')
        : '',
      typeColor: {
        'test': 'bg-blue-100 text-blue-800',
        'performance': 'bg-green-100 text-green-800',
        'communication': 'bg-purple-100 text-purple-800',
        'guidance': 'bg-yellow-100 text-yellow-800'
      }[achievement.type] || 'bg-gray-100 text-gray-800'
    }));
  },

  getScoreColor: (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  },

  
  getPathStatusColor: (status) => {
    const colors = {
      'not_started': 'bg-gray-100 text-gray-800',
      'beginner': 'bg-blue-100 text-blue-800',
      'intermediate': 'bg-yellow-100 text-yellow-800',
      'advanced': 'bg-orange-100 text-orange-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  },

  
  getInsightColor: (type) => {
    const colors = {
      'positive': 'bg-green-50 border-green-200 text-green-800',
      'neutral': 'bg-blue-50 border-blue-200 text-blue-800',
      'improvement': 'bg-yellow-50 border-yellow-200 text-yellow-800',
      'encouragement': 'bg-purple-50 border-purple-200 text-purple-800'
    };
    return colors[type] || 'bg-gray-50 border-gray-200 text-gray-800';
  },

  
  calculateProgress: (current, total) => {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  },

  getActivityIntensity: (count) => {
    if (count === 0) return { level: 'none', color: 'bg-gray-100' };
    if (count <= 2) return { level: 'low', color: 'bg-green-200' };
    if (count <= 5) return { level: 'medium', color: 'bg-green-400' };
    return { level: 'high', color: 'bg-green-600' };
  },

  getMotivationalMessage: (progress) => {
    if (!progress) return 'Filloni udhëtimin tuaj të të mësuarit!';

    const { testStats, chatStats } = progress;
    
    if (testStats.completed === 0) {
      return 'Është koha të filloni testin tuaj të parë! 🚀';
    }
    
    if (testStats.averageScore >= 90) {
      return 'Performancë e shkëlqyer! Jeni në rrugën e duhur! ⭐';
    }
    
    if (testStats.averageScore >= 70) {
      return 'Punë e mirë! Vazhdoni të përmirësoheni! 📈';
    }
    
    if (chatStats.totalSessions === 0) {
      return 'Konsideroni të filloni një bisedë me një këshillues! 💬';
    }
    
    return 'Vazhdoni të punoni drejt qëllimeve tuaja! 💪';
  },


  exportProgressData: (progress) => {
    return {
      exportedAt: new Date().toISOString(),
      user: `${progress.firstName} ${progress.lastName}`,
      summary: {
        testsCompleted: progress.testStats.completed,
        averageScore: progress.testStats.averageScore,
        chatSessions: progress.chatStats.totalSessions,
        recommendations: progress.recommendationStats.total
      }
    };
  }
};