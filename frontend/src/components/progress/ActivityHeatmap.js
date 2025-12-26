import React, { useState } from 'react';
import { 
  Activity, 
  Calendar, 
  TrendingUp, 
  BookOpen, 
  MessageCircle,
  Target,
  Info
} from 'lucide-react';

const ActivityHeatmap = ({ weeklyActivity, title = "Aktiviteti Javor", showDetails = false }) => {
  const [selectedDay, setSelectedDay] = useState(null);

  if (!weeklyActivity || weeklyActivity.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-600" />
          {title}
        </h3>
        <div className="text-center py-8">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Asnjë aktivitet për t'u shfaqur.</p>
        </div>
      </div>
    );
  }


  const getActivityIntensity = (count) => {
    if (count === 0) return { level: 'none', color: 'bg-gray-100', textColor: 'text-gray-400' };
    if (count <= 2) return { level: 'low', color: 'bg-green-200', textColor: 'text-green-800' };
    if (count <= 5) return { level: 'medium', color: 'bg-green-400', textColor: 'text-green-900' };
    return { level: 'high', color: 'bg-green-600', textColor: 'text-white' };
  };

  const getDayName = (day) => {
    const dayNames = {
      'Monday': 'Hënë',
      'Tuesday': 'Martë', 
      'Wednesday': 'Mërkurë',
      'Thursday': 'Enjte',
      'Friday': 'Premte',
      'Saturday': 'Shtunë',
      'Sunday': 'Diel'
    };
    return dayNames[day.trim()] || day;
  };

  
  const totalTests = weeklyActivity.reduce((sum, day) => sum + day.tests, 0);
  const totalMessages = weeklyActivity.reduce((sum, day) => sum + day.messages, 0);
  const totalActivity = weeklyActivity.reduce((sum, day) => sum + day.totalActivity, 0);
  const activeDays = weeklyActivity.filter(day => day.totalActivity > 0).length;


  const mostActiveDay = weeklyActivity.reduce((max, day) => 
    day.totalActivity > max.totalActivity ? day : max, weeklyActivity[0]
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-600" />
          {title}
        </h3>
        
        {showDetails && (
          <div className="text-sm text-gray-500">
            {activeDays}/7 ditë me aktivitet
          </div>
        )}
      </div>

      {/* Weekly Stats */}
      {showDetails && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center">
              <BookOpen className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <p className="text-xs text-blue-900 font-medium">Teste</p>
                <p className="text-lg font-bold text-blue-600">{totalTests}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center">
              <MessageCircle className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="text-xs text-green-900 font-medium">Mesazhe</p>
                <p className="text-lg font-bold text-green-600">{totalMessages}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-3">
            <div className="flex items-center">
              <Target className="w-5 h-5 text-purple-600 mr-2" />
              <div>
                <p className="text-xs text-purple-900 font-medium">Totali</p>
                <p className="text-lg font-bold text-purple-600">{totalActivity}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-xs text-yellow-900 font-medium">Mesatarja</p>
                <p className="text-lg font-bold text-yellow-600">{(totalActivity / 7).toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Heatmap */}
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {weeklyActivity.map((day, index) => {
            const intensity = getActivityIntensity(day.totalActivity);
            const isSelected = selectedDay === index;
            
            return (
              <div
                key={index}
                className={`relative cursor-pointer transition-all duration-200 ${
                  isSelected ? 'transform scale-105' : 'hover:transform hover:scale-102'
                }`}
                onClick={() => setSelectedDay(isSelected ? null : index)}
              >
                {/* Day header */}
                <div className="text-center mb-2">
                  <div className="text-xs font-medium text-gray-600">
                    {getDayName(day.day)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(day.date).getDate()}
                  </div>
                </div>

                {/* Activity square */}
                <div className={`
                  w-full h-12 rounded-lg border-2 transition-all duration-200 
                  ${intensity.color} ${intensity.textColor}
                  ${isSelected ? 'border-blue-500 shadow-md' : 'border-transparent hover:border-gray-300'}
                  flex items-center justify-center
                `}>
                  <div className="text-center">
                    <div className="text-sm font-bold">
                      {day.totalActivity}
                    </div>
                    {day.totalActivity > 0 && (
                      <div className="text-xs opacity-75">
                        aktivitet{day.totalActivity !== 1 ? 'e' : ''}
                      </div>
                    )}
                  </div>
                </div>

                {/* Activity breakdown */}
                {day.totalActivity > 0 && (
                  <div className="mt-2 space-y-1">
                    {day.tests > 0 && (
                      <div className="flex items-center text-xs text-blue-600">
                        <BookOpen className="w-3 h-3 mr-1" />
                        <span>{day.tests}</span>
                      </div>
                    )}
                    {day.messages > 0 && (
                      <div className="flex items-center text-xs text-green-600">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        <span>{day.messages}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Më pak</span>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-100 rounded"></div>
              <div className="w-3 h-3 bg-green-200 rounded"></div>
              <div className="w-3 h-3 bg-green-400 rounded"></div>
              <div className="w-3 h-3 bg-green-600 rounded"></div>
            </div>
            <span>Më shumë</span>
          </div>

          <div className="text-xs text-gray-500">
            Klikoni në një ditë për detaje
          </div>
        </div>

        {/* Selected Day Details */}
        {selectedDay !== null && (
          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">
                {getDayName(weeklyActivity[selectedDay].day)} - {new Date(weeklyActivity[selectedDay].date).toLocaleDateString('sq-AL')}
              </h4>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded p-3">
                <div className="flex items-center mb-2">
                  <BookOpen className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-gray-900">Teste</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {weeklyActivity[selectedDay].tests}
                </p>
                <p className="text-xs text-gray-500">
                  {weeklyActivity[selectedDay].tests === 0 ? 'Asnjë test' :
                   weeklyActivity[selectedDay].tests === 1 ? 'Test i kryer' :
                   'Teste të kryera'}
                </p>
              </div>

              <div className="bg-white rounded p-3">
                <div className="flex items-center mb-2">
                  <MessageCircle className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-gray-900">Mesazhe</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {weeklyActivity[selectedDay].messages}
                </p>
                <p className="text-xs text-gray-500">
                  {weeklyActivity[selectedDay].messages === 0 ? 'Asnjë mesazh' :
                   weeklyActivity[selectedDay].messages === 1 ? 'Mesazh i dërguar' :
                   'Mesazhe të dërguara'}
                </p>
              </div>
            </div>

            {/* Day insight */}
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <div className="flex items-center mb-2">
                <Info className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-900">Insight</span>
              </div>
              <p className="text-sm text-blue-700">
                {weeklyActivity[selectedDay].totalActivity === 0 
                  ? 'Ditë pa aktivitet. Përpiquni të jeni më aktiv!'
                  : weeklyActivity[selectedDay].totalActivity >= 8
                  ? 'Ditë shumë produktive! Vazhdoni kështu.'
                  : weeklyActivity[selectedDay].totalActivity >= 4
                  ? 'Aktivitet i mirë për këtë ditë.'
                  : 'Aktivitet i moderuar. Ka hapësirë për përmirësim.'
                }
              </p>
            </div>
          </div>
        )}

        {/* Weekly Summary */}
        {showDetails && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 mt-6">
            <div className="flex items-center mb-3">
              <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
              <h4 className="font-medium text-gray-900">Përmbledhje Javore</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{activeDays}</div>
                <div className="text-sm text-gray-600">Ditë aktive</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {mostActiveDay.totalActivity}
                </div>
                <div className="text-sm text-gray-600">
                  Maksimumi ({getDayName(mostActiveDay.day)})
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {activeDays > 0 ? Math.round((totalActivity / activeDays) * 10) / 10 : 0}
                </div>
                <div className="text-sm text-gray-600">Mesatarja ditore</div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                {activeDays >= 6 ? '🔥 Fantastike! Jeni shumë konsistent.' :
                 activeDays >= 4 ? '👍 Konsistencë e mirë, vazhdoni kështu!' :
                 activeDays >= 2 ? '📈 Fillim i mirë, përpiquni të jeni më të rregullt.' :
                 '💪 Fokusohuni në rritjen e konsistencës.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityHeatmap;