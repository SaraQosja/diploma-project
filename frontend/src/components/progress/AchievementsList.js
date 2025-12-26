import React, { useState } from 'react';
import { 
  Trophy, 
  Award, 
  Star, 
  Target, 
  Calendar,
  Filter,
  Search,
  Medal,
  Crown,
  Zap
} from 'lucide-react';

const AchievementsList = ({ achievements, showViewAll = false, onViewAll }) => {
  const [filter, setFilter] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState('');

  if (!achievements || achievements.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Asnjë Arritje Ende
          </h3>
          <p className="text-gray-500">
            Filloni të përdorni aplikacionin për të fituar arritjet tuaja të para!
          </p>
        </div>
      </div>
    );
  }

  const filteredAchievements = achievements.filter(achievement => {
    const matchesFilter = filter === 'all' || achievement.type === filter;
    const matchesSearch = !searchQuery || 
      achievement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });


  const achievementsByType = filteredAchievements.reduce((acc, achievement) => {
    if (!acc[achievement.type]) {
      acc[achievement.type] = [];
    }
    acc[achievement.type].push(achievement);
    return acc;
  }, {});

  const getTypeIcon = (type) => {
    switch (type) {
      case 'test':
        return Target;
      case 'performance':
        return Trophy;
      case 'communication':
        return Star;
      case 'guidance':
        return Award;
      default:
        return Medal;
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      'test': 'Teste',
      'performance': 'Performancë',
      'communication': 'Komunikim',
      'guidance': 'Udhëzim'
    };
    return labels[type] || type;
  };

  const getAchievementIcon = (achievement) => {
    
    if (achievement.id === 'high_performer') return <Crown className="w-6 h-6" />;
    if (achievement.id === 'test_explorer') return <Zap className="w-6 h-6" />;
    if (achievement.title.includes('Ekspert')) return <Crown className="w-6 h-6" />;
    
    const TypeIcon = getTypeIcon(achievement.type);
    return <TypeIcon className="w-6 h-6" />;
  };

  const getRarityLevel = (achievementId) => {
    
    const rarity = {
      'first_test': 'common',
      'first_chat': 'common',
      'first_recommendation': 'common',
      'test_explorer': 'uncommon',
      'communicator': 'uncommon',
      'high_performer': 'rare',
      'expert': 'legendary'
    };
    return rarity[achievementId] || 'common';
  };

  const getRarityColor = (rarity) => {
    const colors = {
      'common': 'border-gray-300 bg-gray-50',
      'uncommon': 'border-green-300 bg-green-50',
      'rare': 'border-blue-300 bg-blue-50',
      'epic': 'border-purple-300 bg-purple-50',
      'legendary': 'border-yellow-300 bg-yellow-50'
    };
    return colors[rarity] || colors.common;
  };

  const getRarityLabel = (rarity) => {
    const labels = {
      'common': 'E Zakonshme',
      'uncommon': 'E Pasigurt',
      'rare': 'E Rrallë',
      'epic': 'Epike',
      'legendary': 'Legjendare'
    };
    return labels[rarity] || labels.common;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Trophy className="w-6 h-6 text-yellow-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Arritjet Tuaja</h2>
              <p className="text-sm text-gray-500">
                {achievements.length} arritje{achievements.length !== 1 ? ' totale' : ' totale'}
              </p>
            </div>
          </div>

          {showViewAll && onViewAll && (
            <button
              onClick={onViewAll}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Shiko të gjitha →
            </button>
          )}
        </div>

        {/* Search and Filter */}
        {!showViewAll && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Kërko arritje..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">Të gjitha ({achievements.length})</option>
              <option value="test">Teste</option>
              <option value="performance">Performancë</option>
              <option value="communication">Komunikim</option>
              <option value="guidance">Udhëzim</option>
            </select>
          </div>
        )}

        {/* Achievement Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(achievementsByType).map(([type, typeAchievements]) => {
            const TypeIcon = getTypeIcon(type);
            return (
              <div key={type} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center">
                  <TypeIcon className="w-5 h-5 text-gray-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{getTypeLabel(type)}</p>
                    <p className="text-lg font-bold text-gray-600">{typeAchievements.length}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map((achievement) => {
          const rarity = getRarityLevel(achievement.id);
          const rarityColor = getRarityColor(rarity);
          const rarityLabel = getRarityLabel(rarity);

          return (
            <div
              key={achievement.id}
              className={`bg-white rounded-lg shadow-md border-2 transition-all duration-200 hover:shadow-lg hover:scale-105 ${rarityColor}`}
            >
              <div className="p-6">
                {/* Achievement Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-full ${achievement.typeColor}`}>
                      {getAchievementIcon(achievement)}
                    </div>
                    <div className="text-4xl">{achievement.icon}</div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                      rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                      rarity === 'uncommon' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {rarityLabel}
                    </span>
                  </div>
                </div>

                {/* Achievement Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {achievement.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {achievement.description}
                  </p>
                </div>

                {/* Achievement Meta */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{achievement.formattedEarnedAt}</span>
                  </div>
                  
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${achievement.typeColor}`}>
                    {getTypeLabel(achievement.type)}
                  </span>
                </div>

                {/* Special effects for rare achievements */}
                {rarity === 'legendary' && (
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center text-yellow-600 text-sm font-medium">
                      <Crown className="w-4 h-4 mr-1" />
                      <span>Arritje Legjendare!</span>
                      <Crown className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                )}
              </div>

              {/* Rarity glow effect */}
              {rarity !== 'common' && (
                <div className={`absolute inset-0 rounded-lg opacity-20 pointer-events-none ${
                  rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                  rarity === 'rare' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                  'bg-gradient-to-r from-green-400 to-green-600'
                }`}></div>
              )}
            </div>
          );
        })}
      </div>

      {/* No results */}
      {filteredAchievements.length === 0 && (searchQuery || filter !== 'all') && (
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Asnjë Arritje e Gjetur
            </h3>
            <p className="text-gray-500">
              Provoni të ndryshoni filtrat ose termin e kërkimit.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilter('all');
              }}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Pastro filtrat
            </button>
          </div>
        </div>
      )}

      {/* Progress towards next achievements */}
      {!showViewAll && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Target className="w-6 h-6 text-purple-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Arritjet e Ardhshme</h3>
          </div>
          
          <div className="space-y-4">
            {/* Example upcoming achievements */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="font-medium text-gray-900">Master Learner</span>
                </div>
                <span className="text-sm text-gray-500">0/10 teste</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '30%' }}></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Plotësoni 10 teste për të fituar këtë arritje.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-medium text-gray-900">Perfect Score</span>
                </div>
                <span className="text-sm text-gray-500">Arritni 100%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Merrni rezultat perfekt në një test.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementsList;