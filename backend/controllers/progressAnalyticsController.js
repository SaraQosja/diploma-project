const ProgressAnalytics = require('../models/ProgressAnalytics');

const getUserProgress = async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log('📊 Getting user progress for:', userId);

    const progress = await ProgressAnalytics.getUserProgress(userId);

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'User progress not found'
      });
    }

    res.json({
      success: true,
      data: {
        progress
      }
    });

  } catch (error) {
    console.error('❌ Get user progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user progress'
    });
  }
};

const getTestProgress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 10 } = req.query;

    console.log('📝 Getting test progress for user:', userId);

    const testProgress = await ProgressAnalytics.getTestProgress(userId, parseInt(limit));

    res.json({
      success: true,
      data: {
        testProgress,
        totalResults: testProgress.length
      }
    });

  } catch (error) {
    console.error('❌ Get test progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get test progress'
    });
  }
};

const getLearningPathProgress = async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log('🛤️ Getting learning path progress for user:', userId);

    const pathProgress = await ProgressAnalytics.getLearningPathProgress(userId);

    res.json({
      success: true,
      data: {
        learningPaths: pathProgress,
        totalPaths: pathProgress.length
      }
    });

  } catch (error) {
    console.error('❌ Get learning path progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get learning path progress'
    });
  }
};

const getActivityTimeline = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { days = 30 } = req.query;

    console.log('📅 Getting activity timeline for user:', userId, 'days:', days);

    const timeline = await ProgressAnalytics.getActivityTimeline(userId, parseInt(days));

    res.json({
      success: true,
      data: {
        timeline,
        period: `${days} days`,
        totalDays: timeline.length
      }
    });

  } catch (error) {
    console.error('❌ Get activity timeline error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activity timeline'
    });
  }
};

const getPerformanceTrends = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { months = 6 } = req.query;

    console.log('📈 Getting performance trends for user:', userId, 'months:', months);

    const trends = await ProgressAnalytics.getPerformanceTrends(userId, parseInt(months));

    res.json({
      success: true,
      data: {
        trends,
        period: `${months} months`,
        dataPoints: trends.length
      }
    });

  } catch (error) {
    console.error('❌ Get performance trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance trends'
    });
  }
};

const getAchievements = async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log('🏆 Getting achievements for user:', userId);

    const achievements = await ProgressAnalytics.getAchievements(userId);

    res.json({
      success: true,
      data: {
        achievements,
        totalAchievements: achievements.length,
        recentAchievements: achievements.slice(0, 5)
      }
    });

  } catch (error) {
    console.error('❌ Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get achievements'
    });
  }
};

const getPeerComparison = async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log('👥 Getting peer comparison for user:', userId);

    const comparison = await ProgressAnalytics.getPeerComparison(userId);

    if (!comparison) {
      return res.json({
        success: true,
        data: {
          comparison: null,
          message: 'Not enough data for peer comparison'
        }
      });
    }

    res.json({
      success: true,
      data: {
        comparison
      }
    });

  } catch (error) {
    console.error('❌ Get peer comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get peer comparison'
    });
  }
};


const getWeeklyActivity = async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log('📊 Getting weekly activity for user:', userId);

    const weeklyActivity = await ProgressAnalytics.getWeeklyActivity(userId);

    const totals = weeklyActivity.reduce((acc, day) => ({
      tests: acc.tests + day.tests,
      messages: acc.messages + day.messages,
      totalActivity: acc.totalActivity + day.totalActivity
    }), { tests: 0, messages: 0, totalActivity: 0 });

    res.json({
      success: true,
      data: {
        weeklyActivity,
        totals,
        averageDaily: {
          tests: (totals.tests / 7).toFixed(1),
          messages: (totals.messages / 7).toFixed(1),
          totalActivity: (totals.totalActivity / 7).toFixed(1)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get weekly activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get weekly activity'
    });
  }
};


const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log('🎯 Getting dashboard summary for user:', userId);

    const [
      progress,
      recentTests,
      weeklyActivity,
      achievements
    ] = await Promise.all([
      ProgressAnalytics.getUserProgress(userId),
      ProgressAnalytics.getTestProgress(userId, 5),
      ProgressAnalytics.getWeeklyActivity(userId),
      ProgressAnalytics.getAchievements(userId)
    ]);

    
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = weeklyActivity.length - 1; i >= 0; i--) {
      const day = weeklyActivity[i];
      if (day.totalActivity > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    const summary = {
      overview: progress,
      recentActivity: {
        tests: recentTests.slice(0, 3),
        weeklyActivity: weeklyActivity,
        currentStreak: currentStreak
      },
      achievements: {
        recent: achievements.slice(0, 3),
        total: achievements.length
      },
      insights: generateInsights(progress, recentTests, weeklyActivity)
    };

    res.json({
      success: true,
      data: {
        summary
      }
    });

  } catch (error) {
    console.error('❌ Get dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard summary'
    });
  }
};

const generateInsights = (progress, recentTests, weeklyActivity) => {
  const insights = [];


  if (progress && progress.testStats.averageScore > 0) {
    if (progress.testStats.averageScore >= 80) {
      insights.push({
        type: 'positive',
        title: 'Performancë e Shkëlqyer!',
        message: `Mesatarja juaj ${progress.testStats.averageScore}% është mbi mesataren e suksesit.`,
        icon: '🌟'
      });
    } else if (progress.testStats.averageScore >= 60) {
      insights.push({
        type: 'neutral',
        title: 'Në Rrugë të Mbarë',
        message: 'Vazhdoni të punoni për të përmirësuar rezultatet.',
        icon: '📈'
      });
    } else {
      insights.push({
        type: 'improvement',
        title: 'Hapësirë për Përmirësim',
        message: 'Konsideroni të reviewoni materialet para testeve.',
        icon: '💪'
      });
    }
  }

  const totalWeeklyActivity = weeklyActivity.reduce((sum, day) => sum + day.totalActivity, 0);
  if (totalWeeklyActivity > 10) {
    insights.push({
      type: 'positive',
      title: 'Aktivitet i Lartë',
      message: `${totalWeeklyActivity} aktivitete këtë javë. Mbani ritmin!`,
      icon: '🔥'
    });
  } else if (totalWeeklyActivity < 3) {
    insights.push({
      type: 'encouragement',
      title: 'Koha për Veprim',
      message: 'Përpiquni të jeni më aktiv këtë javë.',
      icon: '⏰'
    });
  }

  if (recentTests.length >= 2) {
    const recentScores = recentTests.slice(0, 2).map(t => t.percentage);
    if (recentScores[0] > recentScores[1]) {
      insights.push({
        type: 'positive',
        title: 'Trend Pozitiv',
        message: 'Rezultatet tuaja po përmirësohen!',
        icon: '📊'
      });
    }
  }

  return insights;
};

module.exports = {
  getUserProgress,
  getTestProgress,
  getLearningPathProgress,
  getActivityTimeline,
  getPerformanceTrends,
  getAchievements,
  getPeerComparison,
  getWeeklyActivity,
  getDashboardSummary
};