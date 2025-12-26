import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Trophy, 
  Target, 
  Activity,
  BookOpen, 
  MessageCircle,
  Star,
  Calendar,
  Users,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';
import { useProgress } from '../hooks/useProgress';
import { useAuth } from '../hooks/useAuth';
import ProgressOverview from '../components/progress/ProgressOverview';
import TestProgressChart from '../components/progress/TestProgressChart';
import LearningPathProgress from '../components/progress/LearningPathProgress';
import ActivityHeatmap from '../components/progress/ActivityHeatmap';
import AchievementsList from '../components/progress/AchievementsList';
import PerformanceTrends from '../components/progress/PerformanceTrends';

const ProgressDashboard = () => {
  const { user, getUserName } = useAuth();
  const {
    overview,
    testProgress,
    learningPaths,
    weeklyActivity,
    achievements,
    performanceTrends,
    loading,
    error,
    isStudent,
    refresh,
    getMotivationalMessage,
    getOverallProgressScore,
    getProgressLevel
  } = useProgress();

  const [activeView, setActiveView] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);


  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh('all');
    setRefreshing(false);
  };

  
  const handleExport = () => {
    if (!overview) return;
    
    const exportData = {
      user: getUserName(),
      exportedAt: new Date().toLocaleDateString('sq-AL'),
      overview: overview,
      testProgress: testProgress.slice(0, 10),
      learningPaths: learningPaths,
      achievements: achievements.slice(0, 5)
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `progress-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isStudent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Progress Analytics
          </h2>
          <p className="text-gray-600">
            Kjo faqe është e disponueshme vetëm për nxënësit.
          </p>
        </div>
      </div>
    );
  }

  if (loading && !overview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Duke ngarkuar të dhënat e përparimit...</p>
        </div>
      </div>
    );
  }

  const progressLevel = getProgressLevel();
  const progressScore = getOverallProgressScore();
  const motivationalMessage = getMotivationalMessage();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Progress Analytics
                </h1>
                <p className="text-gray-600 mt-1">
                  Mirë se vini, {getUserName()}! {motivationalMessage}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Progress Level Badge */}
                <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg">
                  <span className="text-2xl">{progressLevel.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{progressLevel.level}</p>
                    <p className="text-xs text-gray-500">{progressScore}/100 pikë</p>
                  </div>
                </div>
                
                {/* Action buttons */}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="Rifresko të dhënat"
                >
                  <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                
                <button
                  onClick={handleExport}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="Eksporto raportin"
                >
                  <Download className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Përmbledhje', icon: Eye },
              { id: 'tests', label: 'Teste', icon: BookOpen },
              { id: 'paths', label: 'Rrugët e Mësimit', icon: Target },
              { id: 'activity', label: 'Aktiviteti', icon: Activity },
              { id: 'achievements', label: 'Arritjet', icon: Trophy },
              { id: 'trends', label: 'Trendet', icon: TrendingUp }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 text-sm font-medium ${
                  activeView === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => refresh('all')}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Provo përsëri
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'overview' && (
          <div className="space-y-8">
            <ProgressOverview 
              overview={overview} 
              progressScore={progressScore}
              progressLevel={progressLevel}
            />
            
            {weeklyActivity.length > 0 && (
              <ActivityHeatmap 
                weeklyActivity={weeklyActivity}
                title="Aktiviteti i kësaj jave"
              />
            )}
            
            {achievements.length > 0 && (
              <AchievementsList 
                achievements={achievements.slice(0, 3)}
                showViewAll={true}
                onViewAll={() => setActiveView('achievements')}
              />
            )}
          </div>
        )}

        {activeView === 'tests' && (
          <div className="space-y-8">
            <TestProgressChart 
              testProgress={testProgress}
              overview={overview}
            />
          </div>
        )}

        {activeView === 'paths' && (
          <div className="space-y-8">
            <LearningPathProgress 
              learningPaths={learningPaths}
            />
          </div>
        )}

        {activeView === 'activity' && (
          <div className="space-y-8">
            <ActivityHeatmap 
              weeklyActivity={weeklyActivity}
              title="Aktiviteti Javor"
              showDetails={true}
            />
            
            {/* Activity Summary Cards */}
            {overview && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <BookOpen className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Teste të Plotësuara</p>
                      <p className="text-2xl font-bold text-gray-900">{overview.testStats.completed}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <MessageCircle className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Mesazhe Chat</p>
                      <p className="text-2xl font-bold text-gray-900">{overview.chatStats.totalMessages}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <Star className="w-8 h-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Mesatarja</p>
                      <p className="text-2xl font-bold text-gray-900">{overview.testStats.averageScore}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'achievements' && (
          <div className="space-y-8">
            <AchievementsList 
              achievements={achievements}
              showViewAll={false}
            />
          </div>
        )}

        {activeView === 'trends' && (
          <div className="space-y-8">
            <PerformanceTrends 
              trends={performanceTrends}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressDashboard;