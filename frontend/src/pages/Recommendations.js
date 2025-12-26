
// frontend/src/pages/Recommendations.js 
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import recommendationService from '../services/recommendationService';

const Recommendations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [recommendations, setRecommendations] = useState({
    career: [],
    university: []
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [userStatus, setUserStatus] = useState({
    completedTests: 0,
    hasGrades: false,
    canGenerateCareer: false,
    canGenerateUniversity: false,
    canGenerateComplete: false
  });
  const [generationMode, setGenerationMode] = useState(null); // 'tests', 'grades', 'both'

 
  const successMessage = location.state?.message;

  useEffect(() => {
    checkUserStatusAndLoadRecommendations();
  }, []);

  const checkUserStatusAndLoadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Starting recommendation check...');
      
      
      console.log('📊 Checking user readiness...');
      const readiness = await recommendationService.checkUserReadiness();
      console.log('📊 Readiness result:', readiness);
      
      setUserStatus({
        completedTests: readiness.completedTests,
        hasGrades: readiness.hasGrades,
        canGenerateCareer: readiness.ready,
        canGenerateUniversity: readiness.readyForUniversity,
        canGenerateComplete: readiness.readyForComplete
      });

     
      if (readiness.ready || readiness.readyForUniversity) {
        try {
          console.log('🎯 Trying to get smart recommendations...');
          const smartRecs = await recommendationService.getSmartRecommendations();
          console.log('🎯 Smart recommendations result:', smartRecs);
          
          if (smartRecs && smartRecs.success) {
            console.log('✅ Recommendations loaded successfully');
            setRecommendations({
              career: smartRecs.data?.career || [],
              university: smartRecs.data?.university || []
            });
          } else {
            console.warn('⚠️ Smart recommendations failed:', smartRecs);
          }
        } catch (err) {
          console.error('❌ Error loading recommendations:', err);
          console.log('No existing recommendations found');
        }
      } else {
        console.log('ℹ️ User not ready for recommendations yet');
        console.log('   - Completed tests:', readiness.completedTests);
        console.log('   - Has grades:', readiness.hasGrades);
      }

    } catch (error) {
      console.error('💥 Error in checkUserStatusAndLoadRecommendations:', error);
      setError('Gabim në kontrollin e statusit të përdoruesit: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async (mode) => {
    try {
      setGenerating(true);
      setGenerationMode(mode);
      setError(null);

      console.log(`🎯 Generating recommendations with mode: ${mode}`);

      let newRecommendations = { career: [], university: [] };

      if (mode === 'tests') {
   
        if (!userStatus.canGenerateCareer) {
          throw new Error('Ju duhet të plotësoni të paktën 3 teste për rekomandime karriere');
        }
        
        console.log('💼 Generating career recommendations...');
        const careerResponse = await recommendationService.getCareerRecommendations();
        console.log('💼 Career response:', careerResponse);
        
        if (careerResponse.success) {
          newRecommendations.career = careerResponse.data || [];
          toast.success(`U gjeneruan ${newRecommendations.career.length} rekomandime karriere!`);
        }
      } 
      else if (mode === 'grades') {
       
        if (!userStatus.hasGrades) {
          throw new Error('Ju duhet të shtoni notat e maturës për rekomandime universiteti');
        }
        
        console.log('🏫 Generating university recommendations (grades only)...');
        const universityResponse = await recommendationService.getUniversityRecommendations('grades');
        console.log('🏫 University response:', universityResponse);
        
        if (universityResponse.success) {
          newRecommendations.university = universityResponse.data || [];
          toast.success(`U gjeneruan ${newRecommendations.university.length} rekomandime universiteti!`);
        }
      } 
      else if (mode === 'both') {
        
        if (!userStatus.canGenerateComplete) {
          throw new Error('Ju duhet të plotësoni testet dhe të shtoni notat për rekomandime të plota');
        }
        
        console.log('🎯 Generating all recommendations...');
        const smartResponse = await recommendationService.getSmartRecommendations('all', 'both');
        console.log('🎯 Smart response:', smartResponse);
        
        if (smartResponse.success) {
          newRecommendations = {
            career: smartResponse.data?.career || [],
            university: smartResponse.data?.university || []
          };
          toast.success(`U gjeneruan ${newRecommendations.career.length + newRecommendations.university.length} rekomandime!`);
        }
      }

      console.log('📊 New recommendations:', newRecommendations);
      setRecommendations(newRecommendations);
      
      
      if (newRecommendations.career.length > 0 && newRecommendations.university.length > 0) {
        setActiveTab('overview');
      } else if (newRecommendations.career.length > 0) {
        setActiveTab('career');
      } else if (newRecommendations.university.length > 0) {
        setActiveTab('university');
      }

    } catch (error) {
      console.error('Error generating recommendations:', error);
      setError(error.message || 'Gabim në gjenerimin e rekomandimeve');
      toast.error(error.message || 'Gabim në gjenerimin e rekomandimeve');
    } finally {
      setGenerating(false);
      setGenerationMode(null);
    }
  };

  const regenerateAll = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      console.log('🔄 Regenerating all recommendations...');
      const response = await recommendationService.regenerateAllRecommendations();
      console.log('🔄 Regenerate response:', response);
      
      if (response.success) {
        setRecommendations({
          career: response.data?.career || [],
          university: response.data?.university || []
        });
        toast.success('Të gjitha rekomandimet u rigjeneruan!');
        setActiveTab('overview');
      }
    } catch (error) {
      console.error('Error regenerating recommendations:', error);
      setError(error.message || 'Gabim në rigjenrimin e rekomandimeve');
      toast.error(error.message || 'Gabim në rigjenrimin e rekomandimeve');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '60px',
          textAlign: 'center'
        }}>
          <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
          <p style={{ color: '#6b7280' }}>Duke kontrolluar statusin tuaj...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Success Message */}
        {successMessage && (
          <div style={{
            background: '#f0fdf4',
            border: '2px solid #10b981',
            color: '#065f46',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            ✅ {successMessage}
          </div>
        )}

        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
            🎯 Rekomandimet Tuaja Personale
          </h1>
          <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '30px' }}>
            Zbuloni karrierat dhe universitetet që përputhen me profilin tuaj
          </p>

          {/* User Status Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <StatusCard
              icon="📝"
              title="Teste të Plotësuara"
              value={`${userStatus.completedTests}/3`}
              status={userStatus.canGenerateCareer ? 'success' : 'warning'}
              subtitle={userStatus.canGenerateCareer ? 'Gati për rekomandime karriere' : 'Duhen më shumë teste'}
            />

            <StatusCard
              icon="📊"
              title="Notat e Maturës"
              value={userStatus.hasGrades ? '✓' : '✗'}
              status={userStatus.hasGrades ? 'success' : 'error'}
              subtitle={userStatus.hasGrades ? 'Gati për rekomandime universiteti' : 'Duhen notat tuaja'}
              action={!userStatus.hasGrades ? { text: 'Shto Notat →', onClick: () => navigate('/grades') } : null}
            />
          </div>

          {/* Generation Options */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>
              Zgjidhni Tipin e Rekomandimeve:
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}>
              
              {/* Career Only */}
              <GenerationOption
                icon="💼"
                title="Vetëm Karriera"
                description="Bazuar në rezultatet e testeve tuaja"
                buttonText="Gjenero Karrierat"
                mode="tests"
                canGenerate={userStatus.canGenerateCareer}
                errorMessage={!userStatus.canGenerateCareer ? `Duhen ${3 - userStatus.completedTests} teste të tjera` : null}
                isGenerating={generating && generationMode === 'tests'}
                onGenerate={generateRecommendations}
                color="#3b82f6"
              />

              {/* University Only */}
              <GenerationOption
                icon="🏫"
                title="Vetëm Universitete"
                description="Bazuar në notat dhe rezultatet tuaja"
                buttonText="Gjenero Universitetet"
                mode="grades"
                canGenerate={userStatus.canGenerateUniversity}
                errorMessage={!userStatus.canGenerateUniversity ? 
                  (!userStatus.canGenerateCareer ? 'Duhen 3 teste' : 'Duhen notat e maturës') : null}
                isGenerating={generating && generationMode === 'grades'}
                onGenerate={generateRecommendations}
                color="#10b981"
              />

              {/* Both */}
              <GenerationOption
                icon="🎯"
                title="Të Dyja (Rekomanduar)"
                description="Analiza e plotë me karrierat dhe universitetet"
                buttonText="Gjenero të Gjitha"
                mode="both"
                canGenerate={userStatus.canGenerateComplete}
                errorMessage={!userStatus.canGenerateComplete ? 'Duhen 3 teste + notat e maturës' : null}
                isGenerating={generating && generationMode === 'both'}
                onGenerate={generateRecommendations}
                color="#8b5cf6"
                isRecommended={true}
              />
            </div>

            {/* Regenerate Button */}
            {(recommendations.career.length > 0 || recommendations.university.length > 0) && (
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  onClick={regenerateAll}
                  disabled={generating}
                  style={{
                    background: generating ? '#9ca3af' : '#6b7280',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: generating ? 'not-allowed' : 'pointer'
                  }}
                >
                  {generating ? 'Duke gjeneruar...' : '🔄 Rigjeno të Gjitha Rekomandimet'}
                </button>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div style={{
                background: '#fee2e2',
                border: '2px solid #ef4444',
                color: '#dc2626',
                padding: '16px',
                borderRadius: '8px',
                marginTop: '16px',
                textAlign: 'center'
              }}>
                ⚠️ {error}
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {(recommendations.career.length > 0 || recommendations.university.length > 0) && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '40px',
            marginBottom: '30px'
          }}>
            
            {/* Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '2px solid #e5e7eb',
              marginBottom: '30px',
              gap: '20px'
            }}>
              <TabButton
                active={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
                icon="📊"
                text="Përmbledhje"
              />
              
              {recommendations.career.length > 0 && (
                <TabButton
                  active={activeTab === 'career'}
                  onClick={() => setActiveTab('career')}
                  icon="💼"
                  text={`Karrierat (${recommendations.career.length})`}
                />
              )}
              
              {recommendations.university.length > 0 && (
                <TabButton
                  active={activeTab === 'university'}
                  onClick={() => setActiveTab('university')}
                  icon="🏫"
                  text={`Universitetet (${recommendations.university.length})`}
                />
              )}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <OverviewTab 
                recommendations={recommendations}
                onTabChange={setActiveTab}
              />
            )}

            {activeTab === 'career' && (
              <CareerTab 
                careers={recommendations.career}
                onViewDetails={(careerId) => navigate(`/recommendations/${careerId}`)}
              />
            )}

            {activeTab === 'university' && (
              <UniversityTab 
                universities={recommendations.university}
                onViewDetails={(universityId) => navigate(`/recommendations/${universityId}`)}
              />
            )}
          </div>
        )}

        {/* Help Section */}
        {recommendations.career.length === 0 && recommendations.university.length === 0 && !generating && (
          <HelpSection 
            userStatus={userStatus}
            onNavigate={navigate}
          />
        )}

      </div>
    </div>
  );
};
const StatusCard = ({ icon, title, value, status, subtitle, action }) => (
  <div style={{
    background: status === 'success' ? '#dcfce7' : status === 'warning' ? '#fef3c7' : '#fee2e2',
    border: `2px solid ${status === 'success' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444'}`,
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
      {title}
    </h3>
    <p style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
      {value}
    </p>
    <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: action ? '8px' : '0' }}>
      {subtitle}
    </p>
    {action && (
      <button
        onClick={action.onClick}
        style={{
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        {action.text}
      </button>
    )}
  </div>
);

const GenerationOption = ({ 
  icon, title, description, buttonText, mode, canGenerate, errorMessage, 
  isGenerating, onGenerate, color, isRecommended = false 
}) => (
  <div style={{
    background: 'white',
    border: `2px solid ${isRecommended && canGenerate ? color : '#e5e7eb'}`,
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
    opacity: canGenerate ? 1 : 0.5,
    position: 'relative'
  }}>
    {isRecommended && canGenerate && (
      <div style={{
        position: 'absolute',
        top: '-8px',
        right: '16px',
        background: color,
        color: 'white',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 'bold'
      }}>
        REKOMANDUAR
      </div>
    )}
    
    <div style={{ fontSize: '32px', marginBottom: '12px' }}>{icon}</div>
    <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
      {title}
    </h4>
    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
      {description}
    </p>
    <button
      onClick={() => onGenerate(mode)}
      disabled={!canGenerate || isGenerating}
      style={{
        width: '100%',
        background: canGenerate && !isGenerating ? color : '#9ca3af',
        color: 'white',
        border: 'none',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: canGenerate && !isGenerating ? 'pointer' : 'not-allowed'
      }}
    >
      {isGenerating ? 'Duke gjeneruar...' : buttonText}
    </button>
    {errorMessage && (
      <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px' }}>
        {errorMessage}
      </p>
    )}
  </div>
);

const TabButton = ({ active, onClick, icon, text }) => (
  <button
    onClick={onClick}
    style={{
      background: 'none',
      border: 'none',
      padding: '12px 0',
      fontSize: '16px',
      fontWeight: active ? 'bold' : 'normal',
      color: active ? '#3b82f6' : '#6b7280',
      borderBottom: active ? '3px solid #3b82f6' : '3px solid transparent',
      cursor: 'pointer'
    }}
  >
    {icon} {text}
  </button>
);


const OverviewTab = ({ recommendations, onTabChange }) => {
 
  if (!recommendations) {
    return <div>Duke ngarkuar...</div>;
  }

  const topCareer = recommendations.career?.[0];
  const topUniversity = recommendations.university?.[0];
  const analytics = recommendationService.getRecommendationAnalytics([
    ...(recommendations.career || []),
    ...(recommendations.university || [])
  ]);

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '30px'
      }}>
        
        {/* Career Summary */}
        {recommendations.career && recommendations.career.length > 0 && (
          <div style={{
            background: '#f0f9ff',
            border: '2px solid #3b82f6',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💼</div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>
              Rekomandimi Kryesor i Karrierës
            </h3>
            {topCareer && (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                  {topCareer.title}
                </h4>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                  {topCareer.description?.substring(0, 120)}...
                </p>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                  {topCareer.matchScore}% Përputhje
                </div>
              </div>
            )}
            <button
              onClick={() => onTabChange('career')}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Shiko të Gjitha Karrierat ({recommendations.career?.length || 0}) →
            </button>
          </div>
        )}

        {/* University Summary */}
        {recommendations.university && recommendations.university.length > 0 && (
          <div style={{
            background: '#f0fdf4',
            border: '2px solid #10b981',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏫</div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>
              Rekomandimi Kryesor i Universitetit
            </h3>
            {topUniversity && (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                  {topUniversity.universityName}
                </h4>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  📍 {topUniversity.location}
                </p>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                  {topUniversity.program}
                </p>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                  {topUniversity.matchScore}% Përputhje
                </div>
              </div>
            )}
            <button
              onClick={() => onTabChange('university')}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Shiko të Gjitha Universitetet ({recommendations.university?.length || 0}) →
            </button>
          </div>
        )}
      </div>

      {/* Analytics */}
      {analytics && (
        <div style={{
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
            📈 Statistika e Rekomandimeve:
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px'
          }}>
            <StatCard title="Gjithsej" value={analytics?.total || 0} color="#6b7280" />
            <StatCard title="Karriera" value={analytics?.byType?.career || 0} color="#3b82f6" />
            <StatCard title="Universitete" value={analytics?.byType?.university || 0} color="#10b981" />
            <StatCard title="Përputhje Mesatare" value={`${analytics?.averageMatchScore || 0}%`} color="#8b5cf6" />
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, color }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: '32px', fontWeight: 'bold', color }}>
      {value}
    </div>
    <div style={{ fontSize: '14px', color: '#6b7280' }}>{title}</div>
  </div>
);

const CareerTab = ({ careers, onViewDetails }) => {
  const getCategoryColor = (category) => {
    const colors = {
      'teknologji': '#3b82f6',
      'biznes': '#10b981',
      'shëndetësi': '#ef4444',
      'arsim': '#f59e0b',
      'inxhinieri': '#6366f1',
      'kreativitet': '#ec4899',
      'shkenca': '#8b5cf6'
    };
    return colors[category?.toLowerCase()] || '#6b7280';
  };

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '20px'
      }}>
        {careers.map((career, index) => (
          <CareerCard
            key={career.id || career.careerId || index}
            career={career}
            onViewDetails={onViewDetails}
            getCategoryColor={getCategoryColor}
          />
        ))}
      </div>
    </div>
  );
};

const CareerCard = ({ career, onViewDetails, getCategoryColor }) => (
  <div
    style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      border: '2px solid #e5e7eb',
      transition: 'all 0.2s ease',
      cursor: 'pointer'
    }}
    onClick={() => onViewDetails(career.id || career.careerId)}
  >
    {/* Career Header */}
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: `${getCategoryColor(career.category)}20`,
        color: getCategoryColor(career.category),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        marginRight: '12px'
      }}>
        💼
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
          {career.title}
        </h4>
        {career.category && (
          <div style={{
            background: `${getCategoryColor(career.category)}20`,
            color: getCategoryColor(career.category),
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'inline-block'
          }}>
            {career.category}
          </div>
        )}
      </div>
      <div style={{
        background: career.matchScore >= 80 ? '#dcfce7' : career.matchScore >= 60 ? '#fef3c7' : '#fee2e2',
        color: career.matchScore >= 80 ? '#16a34a' : career.matchScore >= 60 ? '#d97706' : '#dc2626',
        padding: '8px 12px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        {career.matchScore}%
      </div>
    </div>

    <p style={{
      fontSize: '14px',
      color: '#6b7280',
      lineHeight: '1.6',
      marginBottom: '16px'
    }}>
      {career.description?.substring(0, 150)}...
    </p>

    {career.matchReason && (
      <div style={{
        background: '#f8fafc',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <h5 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
          💡 Pse kjo karrierë:
        </h5>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
          {career.matchReason}
        </p>
      </div>
    )}

    <button
      style={{
        width: '100%',
        background: getCategoryColor(career.category),
        color: 'white',
        border: 'none',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer'
      }}
    >
      Mëso Më Shumë →
    </button>
  </div>
);

const UniversityTab = ({ universities, onViewDetails }) => (
  <div>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
      gap: '20px'
    }}>
      {universities.map((university, index) => (
        <UniversityCard
          key={university.id || university.universityId || index}
          university={university}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  </div>
);

const UniversityCard = ({ university, onViewDetails }) => {
  const getGradeStatusDisplay = (gradeStatus, gradeGap, meetsRequirement) => {
    switch (gradeStatus) {
      case 'eligible':
        return {
          color: '#10b981',
          background: '#dcfce7',
          icon: '✅',
          text: 'Ju plotësoni kërkesat',
          action: null
        };
      case 'close':
        return {
          color: '#f59e0b',
          background: '#fef3c7',
          icon: '⚡',
          text: `Duhen ${gradeGap?.toFixed(1) || '0.5'} pikë më shumë`,
          action: 'Përmirësoni pak notat!'
        };
      case 'needs_improvement':
        return {
          color: '#f97316',
          background: '#fed7aa',
          icon: '📈',
          text: `Duhen ${gradeGap?.toFixed(1) || '1.0'} pikë më shumë`,
          action: 'Fokusohuni në nota!'
        };
      case 'consider_alternatives':
        return {
          color: '#8b5cf6',
          background: '#ede9fe',
          icon: '🎯',
          text: 'Konsideroni alternativa',
          action: 'Shihni opsione të tjera'
        };
      default:
        return {
          color: '#6b7280',
          background: '#f3f4f6',
          icon: 'ℹ️',
          text: 'Informacion i disponueshëm',
          action: null
        };
    }
  };

  const gradeStatusInfo = getGradeStatusDisplay(
    university.gradeStatus, 
    university.gradeGap, 
    university.meetsGradeRequirement
  );
  
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        border: `2px solid ${gradeStatusInfo.color}20`,
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        position: 'relative'
      }}
      onClick={() => onViewDetails(university.id || university.universityId)}
    >
      {/* Status Badge */}
      {university.gradeStatus && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: gradeStatusInfo.background,
          color: gradeStatusInfo.color,
          padding: '6px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>{gradeStatusInfo.icon}</span>
          <span>{gradeStatusInfo.text}</span>
        </div>
      )}

      {/* University Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', marginTop: university.gradeStatus ? '12px' : '0' }}>
        <div style={{ fontSize: '32px', marginRight: '12px' }}>
          {university.type === 'public' ? '🏛️' : '🏢'}
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
            {university.universityName}
          </h4>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            📍 {university.location}
          </p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{
              background: university.type === 'public' ? '#dbeafe' : '#dcfce7',
              color: university.type === 'public' ? '#1e40af' : '#166534',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {university.type === 'public' ? 'Publik' : 'Privat'}
            </span>
            <div style={{
              background: university.matchScore >= 80 ? '#dcfce7' : university.matchScore >= 60 ? '#fef3c7' : '#fee2e2',
              color: university.matchScore >= 80 ? '#16a34a' : university.matchScore >= 60 ? '#d97706' : '#dc2626',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {university.matchScore}% Përputhje
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h5 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>
          📚 {university.program}
        </h5>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          {university.faculty} • {university.duration} vjet
        </p>
      </div>

      {/* Grade Status Section */}
      {university.gradeStatus && (
        <div style={{
          background: gradeStatusInfo.background,
          border: `1px solid ${gradeStatusInfo.color}40`,
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: gradeStatusInfo.action ? '8px' : '0'
          }}>
            <span style={{ fontSize: '16px' }}>{gradeStatusInfo.icon}</span>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: gradeStatusInfo.color 
            }}>
              {gradeStatusInfo.text}
            </span>
          </div>
          
          {gradeStatusInfo.action && (
            <p style={{ 
              fontSize: '12px', 
              color: gradeStatusInfo.color, 
              margin: 0,
              fontStyle: 'italic'
            }}>
              💡 {gradeStatusInfo.action}
            </p>
          )}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>💰 Tarifë Vjetore:</span>
          <br />
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>
            {university.tuitionFee ? recommendationService.formatCurrency(university.tuitionFee) : 'Nuk specifikohet'}
          </span>
        </div>
        <div>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>🌐 Gjuha:</span>
          <br />
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>
            {university.language || 'Shqip'}
          </span>
        </div>
      </div>

      {university.matchReason && (
        <div style={{
          background: '#f8fafc',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <h5 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
            💡 Pse ky universitet:
          </h5>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
            {university.matchReason}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          style={{
            flex: 1,
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '10px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Detajet →
        </button>
        {university.website && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(university.website, '_blank');
            }}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            🌐
          </button>
        )}
      </div>
    </div>
  );
};


const HelpSection = ({ userStatus, onNavigate }) => (
  <div style={{
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '40px',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎯</div>
    <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
      Gati për Rekomandimet Tuaja?
    </h3>
    <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '30px', maxWidth: '600px', margin: '0 auto 30px' }}>
      Për të marrë rekomandimet më të sakta, duhet të keni plotësuar të paktën 3 teste dhe të keni shtuar notat e maturës tuaja.
    </p>

    <div style={{
      background: '#f8fafc',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '500px',
      margin: '0 auto'
    }}>
      <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
        ✅ Hapat për të përfunduar:
      </h4>
      <ul style={{
        textAlign: 'left',
        fontSize: '14px',
        color: '#374151',
        lineHeight: '1.6',
        listStyle: 'none',
        padding: 0
      }}>
        {userStatus.completedTests < 3 && (
          <li style={{ marginBottom: '8px' }}>
            <strong>Plotësoni {3 - userStatus.completedTests} teste të tjera</strong> - 
            <button
              onClick={() => onNavigate('/tests')}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                textDecoration: 'underline',
                cursor: 'pointer',
                marginLeft: '4px'
              }}
            >
              Shkoni te testet →
            </button>
          </li>
        )}
        
        {userStatus.completedTests >= 3 && !userStatus.hasGrades && (
          <li style={{ marginBottom: '8px' }}>
            <strong>Shtoni notat e maturës tuaja</strong> - 
            <button
              onClick={() => onNavigate('/grades')}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                textDecoration: 'underline',
                cursor: 'pointer',
                marginLeft: '4px'
              }}
            >
              Shtoni notat →
            </button>
          </li>
        )}

        <li style={{ marginBottom: '8px' }}>
          • <strong>Gjeneroni rekomandimet</strong> duke përdorur butonat më lart
        </li>
        
        <li>
          • <strong>Eksploroni</strong> karrierat dhe universitetet që përputhen me ju
        </li>
      </ul>
    </div>
  </div>
);

export default Recommendations;