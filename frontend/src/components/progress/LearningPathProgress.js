import React, { useState } from 'react';
import { 
  Target, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Circle,
  Play,
  Award,
  BarChart3
} from 'lucide-react';

const LearningPathProgress = ({ learningPaths }) => {
  const [selectedPath, setSelectedPath] = useState(null);

  if (!learningPaths || learningPaths.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Asnjë Rrugë Mësimi
          </h3>
          <p className="text-gray-500">
            Rrugët e mësimit do të shfaqen kur të filloni teste.
          </p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'advanced':
        return <Award className="w-5 h-5 text-orange-500" />;
      case 'intermediate':
        return <TrendingUp className="w-5 h-5 text-yellow-500" />;
      case 'beginner':
        return <Play className="w-5 h-5 text-blue-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getProgressColor = (completionRate) => {
    if (completionRate >= 90) return 'bg-green-500';
    if (completionRate >= 70) return 'bg-blue-500';
    if (completionRate >= 50) return 'bg-yellow-500';
    if (completionRate >= 25) return 'bg-orange-500';
    return 'bg-gray-400';
  };

  const getRecommendation = (path) => {
    if (path.completionRate >= 100) {
      return {
        message: '🎉 Urime! Keni përfunduar këtë rrugë mësimi.',
        action: 'Eksploroni rrugë të tjera',
        color: 'text-green-600'
      };
    } else if (path.completionRate >= 70) {
      return {
        message: '🚀 Ju jeni afër përfundimit! Vazhdoni punën e mirë.',
        action: 'Plotësoni testet e mbetura',
        color: 'text-blue-600'
      };
    } else if (path.completionRate >= 30) {
      return {
        message: '📈 Përparim i mirë! Mbani ritmin.',
        action: 'Vazhdoni me testet e ardhshme',
        color: 'text-yellow-600'
      };
    } else if (path.completionRate > 0) {
      return {
        message: '🌱 Fillim i mirë! Vazhdoni të mësoni.',
        action: 'Fokusohuni në këtë kategori',
        color: 'text-orange-600'
      };
    } else {
      return {
        message: '⭐ Këtu mund të filloni udhëtimin tuaj!',
        action: 'Filloni testin e parë',
        color: 'text-gray-600'
      };
    }
  };

  // Calculate overall stats
  const totalPaths = learningPaths.length;
  const completedPaths = learningPaths.filter(p => p.status === 'completed').length;
  const inProgressPaths = learningPaths.filter(p => p.completionRate > 0 && p.status !== 'completed').length;
  const averageCompletion = learningPaths.reduce((sum, path) => sum + parseFloat(path.completionRate), 0) / totalPaths;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Rrugët e Mësimit</h2>
          <div className="text-sm text-gray-500">
            {totalPaths} kategori totale
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-900">Të Plotësuara</p>
                <p className="text-2xl font-bold text-green-600">{completedPaths}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Play className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">Në Vazhdim</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressPaths}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-900">Mesatarja</p>
                <p className="text-2xl font-bold text-yellow-600">{averageCompletion.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-900">Jo Filluar</p>
                <p className="text-2xl font-bold text-purple-600">{totalPaths - inProgressPaths - completedPaths}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Paths Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {learningPaths.map((path) => {
          const recommendation = getRecommendation(path);
          
          return (
            <div
              key={path.category}
              className={`bg-white rounded-lg shadow transition-all duration-200 hover:shadow-md cursor-pointer ${
                selectedPath === path.category ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedPath(selectedPath === path.category ? null : path.category)}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(path.status)}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{path.category}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${path.statusColor}`}>
                        {path.statusText}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{path.completionRate}%</div>
                    <div className="text-sm text-gray-500">
                      {path.completedTests}/{path.totalTests} teste
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Përparim</span>
                    <span>{path.completedTests} nga {path.totalTests}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(path.completionRate)}`}
                      style={{ width: `${path.completionRate}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{path.averageScore.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">Mesatarja</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {path.lastActivity ? path.formattedLastActivity : 'Asnjëherë'}
                    </div>
                    <div className="text-xs text-gray-500">Aktiviteti i fundit</div>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="border-t border-gray-200 pt-4">
                  <div className={`text-sm ${recommendation.color} mb-2`}>
                    {recommendation.message}
                  </div>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    {recommendation.action} →
                  </button>
                </div>

                {/* Expanded Details */}
                {selectedPath === path.category && (
                  <div className="border-t border-gray-200 mt-4 pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Detajet e Rrugës</h4>
                    
                    <div className="space-y-3">
                      {/* Difficulty Level */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Niveli i Vështirësisë:</span>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`w-2 h-2 rounded-full ${
                                level <= (path.averageScore / 20) ? 'bg-blue-500' : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Time Investment */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Koha e nevojshme:</span>
                        <span className="text-sm font-medium text-gray-900">
                          ~{path.totalTests * 15} minuta
                        </span>
                      </div>

                      {/* Next Steps */}
                      <div className="bg-blue-50 rounded-lg p-3 mt-4">
                        <div className="flex items-center mb-2">
                          <Target className="w-4 h-4 text-blue-600 mr-2" />
                          <span className="text-sm font-medium text-blue-900">Hapat e ardhshëm:</span>
                        </div>
                        <ul className="text-sm text-blue-700 space-y-1">
                          {path.completedTests === 0 ? (
                            <li>• Filloni me testin bazë të {path.category}</li>
                          ) : path.completionRate < 100 ? (
                            <li>• Vazhdoni me testet e mbetura</li>
                          ) : (
                            <li>• Eksploroni tema të lidhura</li>
                          )}
                          <li>• Reviewoni rezultatet tuaja</li>
                          <li>• Kërkoni këshilla nga mentorët</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <BookOpen className="w-6 h-6 text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Këshilla për Sukses</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Target className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-medium text-gray-900">Qëndro i Fokusuar</span>
            </div>
            <p className="text-sm text-gray-600">
              Koncentrohuni në 1-2 rrugë mësimi në të njëjtën kohë për rezultate më të mira.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Clock className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-medium text-gray-900">Konsistenca</span>
            </div>
            <p className="text-sm text-gray-600">
              Dedikoni 15-30 minuta çdo ditë për të mbajtur momentumin.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
              <span className="font-medium text-gray-900">Reviewo dhe Përmirëso</span>
            </div>
            <p className="text-sm text-gray-600">
              Shikoni testet e bëra për të identifikuar zonat që kanë nevojë për përmirësim.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPathProgress;