
// frontend/src/components/recommendations/CareerRecommendations.js 

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import recommendationService from '../../services/recommendationService';

const CareerRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await recommendationService.getSmartRecommendations('career', 'auto');
      console.log('Career recommendations response:', response);
      
      if (response && response.success && response.data) {
        let careerData = [];
        if (response.data.career) {
          careerData = response.data.career;
        } else if (Array.isArray(response.data)) {
          careerData = response.data;
        }
        
        console.log('Career data to display:', careerData);
        setRecommendations(careerData);
      } else {
        console.warn('Unexpected response format:', response);
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Error fetching career recommendations:', error);
      setError('Gabim në ngarkimin e rekomandimeve të karrierës');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRecommendations = async () => {
    try {
      setGenerating(true);
      const response = await recommendationService.generateCareerRecommendations();
      if (response && response.success && response.data) {
        setRecommendations(response.data);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setError(error.message || 'Gabim në gjenerimin e rekomandimeve');
    } finally {
      setGenerating(false);
    }
  };

  const handleLearnMore = (career) => {
    
    const careerInfo = {
      title: career.title || career.careerName || 'Karrierë e Panjohur',
      category: career.category || 'Kategori e Panjohur',
      matchScore: Math.round(career.matchScore || 0),
      description: typeof career.description === 'string' 
        ? career.description 
        : career.description?.display 
        ? career.description.display 
        : 'Përshkrim i paqartë për këtë karrierë.',
      matchReason: career.matchReason || 'Bazuar në rezultatet e testeve tuaja',
      salary: career.salaryRange?.display || career.salaryRange || 'Paga e papërcaktuar',
      outlook: career.jobOutlook || 'Perspektiva mesatare',
      education: career.educationLevel || 'Bachelor',
      skills: Array.isArray(career.skills) 
        ? career.skills.join(', ') 
        : career.skills || 'Aftësi të ndryshme'
    };
    
    const modalContent = `
═══════════════════════════════════════
           DETAJE TË KARRIERËS
═══════════════════════════════════════

📋 TITULLI: ${careerInfo.title}
📂 KATEGORIA: ${careerInfo.category}  
📊 PËRPUTHJA: ${careerInfo.matchScore}%

📝 PËRSHKRIMI: 
${careerInfo.description}

💡 PSE ËSHTË PËR JU:
${careerInfo.matchReason}

💰 PAGA PRITSHME: ${careerInfo.salary}
📈 PERSPEKTIVA E PUNËS: ${careerInfo.outlook}  
🎓 ARSIMI I KËRKUAR: ${careerInfo.education}

🛠️ AFTËSI TË NEVOJSHME:
${careerInfo.skills}

═══════════════════════════════════════
    `;
    
    alert(modalContent);
    
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ color: '#6b7280' }}>Duke ngarkuar rekomandimet e karrierës...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 0' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: '#1f2937',
          marginBottom: '12px'
        }}>
          Rekomandimet e Karrierës
        </h1>
        <p style={{ 
          fontSize: '18px', 
          color: '#6b7280',
          maxWidth: '600px',
          margin: '0 auto 32px'
        }}>
          Zbuloni karrierat që përputhen me personalitetin, aftësitë dhe interesat tuaja bazuar në rezultatet e testeve.
        </p>

        {recommendations.length === 0 && !error && (
          <button
            onClick={handleGenerateRecommendations}
            disabled={generating}
            style={{ 
              padding: '12px 24px', 
              fontSize: '16px',
              background: generating ? '#9ca3af' : '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: generating ? 'not-allowed' : 'pointer'
            }}
          >
            {generating ? 'Duke gjeneruar...' : 'Gjeneroni Rekomandime Karriere'}
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ 
          background: '#fee2e2', 
          border: '1px solid #fecaca', 
          color: '#dc2626',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <span>{error}</span>
          <br />
          <button 
            onClick={handleGenerateRecommendations}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Provoni Përsëri
          </button>
        </div>
      )}

      {/* Recommendations Grid */}
      {recommendations.length > 0 && (
        <>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
              Karrierat Tuaja të Rekomanduara ({recommendations.length})
            </h2>
            <button
              onClick={handleGenerateRecommendations}
              disabled={generating}
              style={{
                padding: '8px 16px',
                background: generating ? '#9ca3af' : '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: generating ? 'not-allowed' : 'pointer'
              }}
            >
              {generating ? 'Duke përditësuar...' : 'Përditëso'}
            </button>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
            gap: '24px' 
          }}>
            {recommendations.map((career, index) => (
              <CareerCard
                key={career.id || career.careerId || index}
                career={career}
                onLearnMore={handleLearnMore}
                index={index}
              />
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {recommendations.length === 0 && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎯</div>
          <h3 style={{ fontSize: '20px', color: '#6b7280', marginBottom: '8px' }}>
            Nuk ka rekomandime karriere ende
          </h3>
          <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
            Plotësoni të paktën tre teste për të marrë rekomandime të personalizuara karriere.
          </p>
        </div>
      )}
    </div>
  );
};

const CareerCard = ({ career, onLearnMore, index }) => {
 
  const safeGetValue = (value, fallback = 'N/A') => {
    if (!value) return fallback;
    
    if (typeof value === 'string') return value;
    
    if (typeof value === 'number') return value.toString();
    
    if (typeof value === 'object' && value !== null) {
     
      if (value.display) return value.display;
      if (value.min !== undefined && value.max !== undefined) {
        return `${value.min} - ${value.max} EUR/muaj`;
      }
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return fallback;
    }
    
    return String(value);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'teknologji': '#3b82f6',
      'technology': '#3b82f6',
      'biznes': '#10b981',
      'business': '#10b981',
      'shëndetësi': '#ef4444',
      'healthcare': '#ef4444',
      'arsim': '#f59e0b',
      'education': '#f59e0b',
      'inxhinieri': '#6366f1',
      'engineering': '#6366f1',
      'kreativitet': '#ec4899',
      'creative': '#ec4899',
      'shkenca': '#8b5cf6',
      'science': '#8b5cf6',
      'design': '#ec4899',
      'management': '#10b981',
      'transport': '#f59e0b'
    };
    
    const categoryLower = safeGetValue(category, '').toLowerCase();
    return colors[categoryLower] || '#6b7280';
  };

  const getMatchScoreColor = (score) => {
    const numScore = parseInt(score) || 0;
    if (numScore >= 80) return '#10b981';
    if (numScore >= 60) return '#f59e0b';
    return '#ef4444';
  };
  const title = safeGetValue(career.title || career.careerName, 'Karrierë e Panjohur');
  const description = safeGetValue(career.description, 'Përshkrim i paqartë për këtë karrierë.');
  const category = safeGetValue(career.category, 'Kategori');
  const matchScore = Math.round(career.matchScore || 50);
  const matchReason = safeGetValue(career.matchReason, 'Bazuar në rezultatet e testeve tuaja.');
  const salaryDisplay = safeGetValue(career.salaryRange, 'Paga e papërcaktuar');
  const jobOutlook = safeGetValue(career.jobOutlook, 'Mesatar');
  const educationLevel = safeGetValue(career.educationLevel, 'Bachelor');

  return (
    <div 
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        transition: 'all 0.3s ease',
        position: 'relative'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{
          fontSize: '40px',
          marginRight: '16px'
        }}>
          💼
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#1f2937',
            marginBottom: '8px'
          }}>
            {title}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              background: `${getCategoryColor(category)}20`,
              color: getCategoryColor(category),
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'capitalize'
            }}>
              {category}
            </span>
            <div style={{
              background: matchScore >= 80 ? '#dcfce7' : matchScore >= 60 ? '#fef3c7' : '#fee2e2',
              color: getMatchScoreColor(matchScore),
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {matchScore}% Përputhje
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p style={{ 
        fontSize: '14px', 
        color: '#6b7280',
        lineHeight: 1.6,
        marginBottom: '16px'
      }}>
        {description}
      </p>

      {/* Details */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '12px',
          fontSize: '14px'
        }}>
          <div>
            <span style={{ color: '#9ca3af', fontWeight: '500' }}>💰 Paga:</span>
            <br />
            <span style={{ color: '#374151', fontWeight: '600' }}>
              {salaryDisplay}
            </span>
          </div>
          <div>
            <span style={{ color: '#9ca3af', fontWeight: '500' }}>📈 Perspektiva:</span>
            <br />
            <span style={{ 
              color: jobOutlook.toLowerCase().includes('lartë') ? '#16a34a' : 
                     jobOutlook.toLowerCase().includes('mesatar') ? '#d97706' : '#dc2626',
              fontWeight: '600',
              textTransform: 'capitalize'
            }}>
              {jobOutlook}
            </span>
          </div>
        </div>
      </div>

     
      <div style={{ marginBottom: '16px' }}>
        <span style={{ color: '#9ca3af', fontWeight: '500', fontSize: '14px' }}>
          🎓 Arsimi: 
        </span>
        <span style={{ color: '#374151', fontSize: '14px', marginLeft: '8px' }}>
          {educationLevel}
        </span>
      </div>

    
      <div style={{ 
        background: '#f8fafc', 
        padding: '12px', 
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <h4 style={{ 
          fontSize: '14px', 
          fontWeight: '600', 
          color: '#374151',
          marginBottom: '8px'
        }}>
          💡 Pse kjo karrierë për ju:
        </h4>
        <p style={{ 
          fontSize: '14px', 
          color: '#6b7280',
          lineHeight: 1.5,
          margin: 0
        }}>
          {matchReason}
        </p>
      </div>

      <button
        onClick={() => onLearnMore(career)}
        style={{
          width: '100%',
          padding: '12px',
          background: '#4f46e5', 
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#4338ca';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = '#4f46e5';
        }}
      >
        📖 Mëso Më Shumë
      </button>
    </div>
  );
};

export default CareerRecommendations;