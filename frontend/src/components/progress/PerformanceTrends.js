import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Calendar,
  Target,
  Award,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

const PerformanceTrends = ({ trends }) => {
  const [viewMode, setViewMode] = useState('score');

  if (!trends || trends.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Asnjë Trend Ende
          </h3>
          <p className="text-gray-500">
            Plotësoni më shumë teste për të parë trendet e performancës.
          </p>
        </div>
      </div>
    );
  }

  
  const calculateTrend = (data, key) => {
    if (data.length < 2) return { direction: 'stable', change: 0 };
    
    const recent = data.slice(-2);
    const change = recent[1][key] - recent[0][key];
    
    if (Math.abs(change) < 0.1) return { direction: 'stable', change: 0 };
    return {
      direction: change > 0 ? 'up' : 'down',
      change: Math.abs(change)
    };
  };

  const scoreTrend = calculateTrend(trends, 'averagePercentage');
  const testsTrend = calculateTrend(trends, 'testsCompleted');

 
  const totalTests = trends.reduce((sum, month) => sum + month.testsCompleted, 0);
  const averageScore = trends.length > 0 
    ? trends.reduce((sum, month) => sum + month.averagePercentage, 0) / trends.length
    : 0;
  const bestMonth = trends.reduce((best, month) => 
    month.averagePercentage > best.averagePercentage ? month : best, trends[0]
  );
  const mostActiveMonth = trends.reduce((most, month) => 
    month.testsCompleted > most.testsCompleted ? month : most, trends[0]
  );

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const monthNames = [
      'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
      'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (direction) => {
    switch (direction) {
      case 'up':
        return 'text-green-600 bg-green-100';
      case 'down':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendMessage = (direction, change, type) => {
    if (direction === 'stable') return 'Stabil';
    
    const changeText = type === 'score' ? `${change.toFixed(1)}%` : `${Math.round(change)} teste`;
    
    if (direction === 'up') {
      return type === 'score' 
        ? `↗ +${changeText} përmirësim` 
        : `↗ +${changeText} më shumë`;
    } else {
      return type === 'score' 
        ? `↘ -${changeText} rënie` 
        : `↘ -${changeText} më pak`;
    }
  };

 
  const maxScore = Math.max(...trends.map(t => t.averagePercentage), 100);
  const maxTests = Math.max(...trends.map(t => t.testsCompleted), 1);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Trendet e Performancës</h2>
          
          <div className="flex items-center space-x-2">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="score">Rezultatet</option>
              <option value="tests">Numri i Testeve</option>
              <option value="combined">Të kombinuara</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">Totali Testesh</p>
                <p className="text-2xl font-bold text-blue-600">{totalTests}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <Award className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-900">Mesatarja</p>
                <p className="text-2xl font-bold text-green-600">{averageScore.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-900">Më i miri</p>
                <p className="text-2xl font-bold text-yellow-600">{bestMonth.averagePercentage.toFixed(1)}%</p>
                <p className="text-xs text-yellow-700">{formatMonth(bestMonth.month)}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-900">Më aktivi</p>
                <p className="text-2xl font-bold text-purple-600">{mostActiveMonth.testsCompleted}</p>
                <p className="text-xs text-purple-700">{formatMonth(mostActiveMonth.month)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trend Indicators */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart3 className="w-5 h-5 text-gray-600 mr-2" />
                <span className="font-medium text-gray-900">Trendi i Rezultateve</span>
              </div>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm ${getTrendColor(scoreTrend.direction)}`}>
                {getTrendIcon(scoreTrend.direction)}
                <span>{getTrendMessage(scoreTrend.direction, scoreTrend.change, 'score')}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Target className="w-5 h-5 text-gray-600 mr-2" />
                <span className="font-medium text-gray-900">Aktiviteti</span>
              </div>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm ${getTrendColor(testsTrend.direction)}`}>
                {getTrendIcon(testsTrend.direction)}
                <span>{getTrendMessage(testsTrend.direction, testsTrend.change, 'tests')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          {viewMode === 'score' ? 'Evolucioni i Rezultateve' :
           viewMode === 'tests' ? 'Aktiviteti Mujor' :
           'Performanca dhe Aktiviteti'}
        </h3>

        {/* Simple Chart Implementation */}
        <div className="space-y-4">
          {trends.map((month, index) => {
            const isLast = index === trends.length - 1;
            const prevMonth = index > 0 ? trends[index - 1] : null;
            
            
            const scoreChange = prevMonth ? month.averagePercentage - prevMonth.averagePercentage : 0;
            const testsChange = prevMonth ? month.testsCompleted - prevMonth.testsCompleted : 0;

            return (
              <div key={month.month} className={`p-4 rounded-lg border-2 transition-all ${
                isLast ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{formatMonth(month.month)}</h4>
                      {isLast && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Më i Fundit
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Score */}
                      {(viewMode === 'score' || viewMode === 'combined') && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Rezultati Mesatar</span>
                            <div className="flex items-center space-x-1">
                              <span className="font-bold text-gray-900">{month.averagePercentage.toFixed(1)}%</span>
                              {prevMonth && (
                                <span className={`text-xs ${scoreChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {scoreChange >= 0 ? '+' : ''}{scoreChange.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(month.averagePercentage / maxScore) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Tests */}
                      {(viewMode === 'tests' || viewMode === 'combined') && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Teste të Kryera</span>
                            <div className="flex items-center space-x-1">
                              <span className="font-bold text-gray-900">{month.testsCompleted}</span>
                              {prevMonth && testsChange !== 0 && (
                                <span className={`text-xs ${testsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {testsChange >= 0 ? '+' : ''}{testsChange}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(month.testsCompleted / maxTests) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Combined view additional metrics */}
                      {viewMode === 'combined' && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Efficiency Score</span>
                            <span className="font-bold text-gray-900">
                              {month.testsCompleted > 0 ? 
                                ((month.averagePercentage * month.testsCompleted) / 100).toFixed(1) : 
                                '0.0'
                              }
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${month.testsCompleted > 0 ? 
                                  ((month.averagePercentage * month.testsCompleted) / (maxScore * maxTests)) * 100 : 
                                  0}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Insights */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className="flex items-center mb-3">
            <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
            <h4 className="font-medium text-gray-900">Insights dhe Rekomandime</h4>
          </div>
          
          <div className="space-y-2 text-sm">
            {scoreTrend.direction === 'up' && (
              <p className="text-green-700">
                ✅ Rezultatet tuaja janë duke u përmirësuar! Vazhdoni punën e mirë.
              </p>
            )}
            
            {scoreTrend.direction === 'down' && (
              <p className="text-red-700">
                ⚠️ Rezultatet kanë rënë. Konsideroni të reviewoni materialet.
              </p>
            )}
            
            {testsTrend.direction === 'up' && (
              <p className="text-blue-700">
                📈 Aktiviteti juaj ka rritur! Konsistenca është çelësi i suksesit.
              </p>
            )}
            
            {testsTrend.direction === 'down' && (
              <p className="text-orange-700">
                📉 Aktiviteti ka rënë. Përpiquni të jeni më të rregullt.
              </p>
            )}
            
            {trends.length >= 3 && (
              <p className="text-purple-700">
                💡 Bazuar në {trends.length} muaj të dhënash, mesatarja juaj është {averageScore.toFixed(1)}%.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTrends;