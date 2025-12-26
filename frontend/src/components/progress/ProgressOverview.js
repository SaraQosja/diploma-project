import React from 'react';
import { 
  BookOpen, 
  MessageCircle, 
  Target, 
  TrendingUp,
  Calendar,
  Award,
  Clock,
  Users
} from 'lucide-react';

const ProgressOverview = ({ overview, progressScore, progressLevel }) => {
  if (!overview) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Teste të Plotësuara',
      value: overview.testStats.completed,
      total: overview.testStats.totalTaken,
      icon: BookOpen,
      color: 'blue',
      subtitle: `${overview.testStats.completionRate}% shkallë plotësimi`,
      trend: overview.testStats.averageScore > 70 ? 'up' : 'neutral'
    },
    {
      label: 'Mesatarja e Testeve',
      value: `${overview.testStats.averageScore}%`,
      icon: TrendingUp,
      color: overview.testStats.averageScore >= 80 ? 'green' : overview.testStats.averageScore >= 60 ? 'yellow' : 'red',
      subtitle: overview.testStats.lastTestDate ? `Testi i fundit: ${overview.testStats.formattedLastTestDate}` : 'Asnjë test',
      trend: overview.testStats.averageScore >= 70 ? 'up' : 'down'
    },
    {
      label: 'Biseda Chat',
      value: overview.chatStats.totalSessions,
      icon: MessageCircle,
      color: 'purple',
      subtitle: `${overview.chatStats.totalMessages} mesazhe totale`,
      trend: overview.chatStats.activeSessions > 0 ? 'up' : 'neutral'
    },
    {
      label: 'Rekomandime',
      value: overview.recommendationStats.total,
      icon: Target,
      color: 'indigo',
      subtitle: `${overview.recommendationStats.saved} të ruajtura (${overview.recommendationStats.saveRate}%)`,
      trend: overview.recommendationStats.total > 0 ? 'up' : 'neutral'
    }
  ];

  const getColorClasses = (color, variant = 'bg') => {
    const colors = {
      blue: variant === 'bg' ? 'bg-blue-100 text-blue-800' : 'text-blue-600',
      green: variant === 'bg' ? 'bg-green-100 text-green-800' : 'text-green-600',
      yellow: variant === 'bg' ? 'bg-yellow-100 text-yellow-800' : 'text-yellow-600',
      red: variant === 'bg' ? 'bg-red-100 text-red-800' : 'text-red-600',
      purple: variant === 'bg' ? 'bg-purple-100 text-purple-800' : 'text-purple-600',
      indigo: variant === 'bg' ? 'bg-indigo-100 text-indigo-800' : 'text-indigo-600'
    };
    return colors[color] || colors.blue;
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return '📈';
    if (trend === 'down') return '📉';
    return '➖';
  };

  return (
    <div className="space-y-6">
      {/* Progress Level Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-3xl">{progressLevel.icon}</span>
              <div>
                <h2 className="text-2xl font-bold">{progressLevel.level}</h2>
                <p className="text-blue-100">Niveli juaj aktual</p>
              </div>
            </div>
            <p className="text-sm text-blue-100 mb-4">
              Anëtar që nga {overview.formattedRegisteredDate}
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-4xl font-bold mb-1">{progressScore}</div>
            <div className="text-blue-100 text-sm">nga 100 pikë</div>
            <div className="w-32 bg-blue-500 rounded-full h-2 mt-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${progressScore}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-lg" title={`Trend: ${stat.trend}`}>
                {getTrendIcon(stat.trend)}
              </span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">{stat.label}</h3>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.subtitle}</p>
            </div>

            {/* Progress bar for completion rates */}
            {stat.total && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Përparim</span>
                  <span>{stat.value}/{stat.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      stat.color === 'blue' ? 'bg-blue-500' :
                      stat.color === 'green' ? 'bg-green-500' :
                      stat.color === 'purple' ? 'bg-purple-500' :
                      'bg-indigo-500'
                    }`}
                    style={{ width: `${(parseInt(stat.value) / stat.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Insights */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2 text-yellow-600" />
          Insights të Shpejta
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Test Performance Insight */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center mb-2">
              <BookOpen className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">Performanca e Testeve</span>
            </div>
            <p className="text-xs text-blue-700">
              {overview.testStats.averageScore >= 80 
                ? 'Performancë e shkëlqyer! Vazhdoni kështu.'
                : overview.testStats.averageScore >= 60
                ? 'Performancë e mirë, ka hapësirë për përmirësim.'
                : 'Fokusohuni në përmirësimin e rezultateve.'
              }
            </p>
          </div>

          
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Clock className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-900">Aktiviteti</span>
            </div>
            <p className="text-xs text-green-700">
              {overview.chatStats.totalMessages > 20
                ? 'Shumë aktiv në komunikim!'
                : overview.chatStats.totalMessages > 5
                ? 'Aktivitet i moderuar në chat.'
                : 'Përpiquni të jeni më aktiv në komunikim.'
              }
            </p>
          </div>

       
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Users className="w-4 h-4 text-purple-600 mr-2" />
              <span className="text-sm font-medium text-purple-900">Angazhimi</span>
            </div>
            <p className="text-xs text-purple-700">
              {overview.recommendationStats.saveRate > 50
                ? 'Angazhim i lartë me rekomandimet!'
                : 'Shikoni më shumë rekomandime për ju.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressOverview;