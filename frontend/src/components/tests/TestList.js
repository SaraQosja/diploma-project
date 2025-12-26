
// frontend/src/components/tests/TestList.js 
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { testService } from '../../services/testService';
import { toast } from 'react-hot-toast';

const TestList = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('tests');
  const [userResults, setUserResults] = useState([]);
  
  const navigate = useNavigate();
  const location = useLocation();

 
  useEffect(() => {
    if (location.state?.testCompleted) {
      if (location.state?.message) {
        toast.success(location.state.message);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (activeTab === 'tests') {
      fetchTests();
      fetchUserResults();
    }
  }, [activeTab]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await testService.getAllTests();
      if (response.success) {
        setTests(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
      setError('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserResults = async () => {
    try {
      const response = await testService.getUserResults();
      if (response.success) {
        setUserResults(response.data || []);
      }
    } catch (error) {
      console.warn('Could not fetch user results:', error);
      setUserResults([]);
    }
  };

  const isTestCompleted = (testId) => {
    return userResults.some(result => result.testId === testId || result.testId === testId.toString());
  };

  const getTestIcon = (testType) => {
    switch (testType) {
      case 'personality': return '🧠';
      case 'aptitude': return '⚡';
      case 'interest': return '❤️';
      case 'skills': return '🛠️';
      case 'values': return '⭐';
      case 'career': return '💼';
      default: return '📝';
    }
  };

  const getTestColor = (testType) => {
    switch (testType) {
      case 'personality': return '#3b82f6';
      case 'aptitude': return '#10b981';
      case 'interest': return '#f59e0b';
      case 'skills': return '#8b5cf6';
      case 'values': return '#ef4444';
      case 'career': return '#06b6d4';
      default: return '#6b7280';
    }
  };

  const getTestTypeTitle = (testType) => {
    switch (testType) {
      case 'personality': return 'Personality Tests';
      case 'aptitude': return 'Aptitude Tests';
      case 'interest': return 'Interest Inventories';
      case 'skills': return 'Skills Assessments';
      case 'values': return 'Values Assessment';
      case 'career': return 'Career Orientation';
      default: return 'Tests';
    }
  };

  const handleStartTest = (testId) => {
    navigate(`/tests/${testId}`);
  };

  const handleRetakeTest = (testId, testTitle) => {
    const confirmRetake = window.confirm(
      `Dëshironi ta ribëni testin "${testTitle}"? Rezultati i vjetër do të zëvendësohet.`
    );
    
    if (confirmRetake) {
      console.log('🔄 Retaking test:', testId);
     
      navigate(`/tests/${testId}`);
      window.location.reload();
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tests':
        return renderTestsContent();
      case 'results':
        return renderResultsRedirect();
      default:
        return renderTestsContent();
    }
  };

  const renderResultsRedirect = () => {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎯</div>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
          View Your Results & Recommendations
        </h2>
        <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
          Complete your tests and get personalized career and university recommendations based on your results.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/recommendations')}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '16px 32px',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            🎯 View Recommendations
          </button>
          
          <button
            onClick={() => navigate('/recommendations/flow')}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '16px 32px',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            🚀 Smart Flow
          </button>
        </div>
      </div>
    );
  };

  const renderTestsContent = () => {
    const groupedTests = tests.reduce((groups, test) => {
      const category = test.category || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(test);
      return groups;
    }, {});

    if (loading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px' 
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid #e5e7eb', 
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p style={{ color: '#6b7280' }}>Loading tests...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ fontSize: '20px', color: '#ef4444', marginBottom: '8px' }}>
            Error Loading Tests
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>{error}</p>
          <button 
            onClick={fetchTests}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return (
      <div>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#1f2937',
            marginBottom: '12px'
          }}>
            📝 Career Assessments
          </h1>
          <p style={{ 
            fontSize: '18px', 
            color: '#6b7280',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Discover your strengths, interests, and ideal career paths through our comprehensive assessments.
          </p>
        </div>

        {Object.keys(groupedTests).map(testType => (
          <div key={testType} style={{ marginBottom: '48px' }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#1f2937',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '32px', marginRight: '12px' }}>
                {getTestIcon(testType)}
              </span>
              {getTestTypeTitle(testType)}
            </h2>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
              gap: '24px' 
            }}>
              {groupedTests[testType].map(test => (
                <TestCard
                  key={test.id}
                  test={test}
                  color={getTestColor(testType)}
                  isCompleted={isTestCompleted(test.id)}
                  onStartTest={() => handleStartTest(test.id)}
                  onRetakeTest={() => handleRetakeTest(test.id, test.title)}
                />
              ))}
            </div>
          </div>
        ))}

        {tests.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📋</div>
            <h3 style={{ fontSize: '20px', color: '#6b7280', marginBottom: '8px' }}>
              No tests available
            </h3>
            <p style={{ color: '#9ca3af' }}>
              Tests will be available soon. Check back later!
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '20px 0' }}>
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #e5e7eb',
        marginBottom: '32px',
        background: 'white',
        borderRadius: '12px 12px 0 0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        {[
          { key: 'tests', label: '📝 Take Tests', description: 'Career assessments' },
          { key: 'results', label: '🎯 Results & Recommendations', description: 'View outcomes' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: '20px 24px',
              background: activeTab === tab.key ? '#3b82f6' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#6b7280',
              border: 'none',
              borderBottom: `4px solid ${activeTab === tab.key ? '#1d4ed8' : 'transparent'}`,
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center',
              borderRadius: activeTab === tab.key ? '8px 8px 0 0' : '0'
            }}
          >
            <div style={{ marginBottom: '4px' }}>
              {tab.label}
            </div>
            <div style={{ 
              fontSize: '12px', 
              opacity: 0.8,
              fontWeight: '400'
            }}>
              {tab.description}
            </div>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{
        background: 'white',
        borderRadius: '0 0 12px 12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        padding: '32px',
        minHeight: '500px'
      }}>
        {renderTabContent()}
      </div>

      {/* CSS for animations */}
      <style>
        {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Button overrides to fix CSS conflicts */
        .test-retake-btn {
          all: unset !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
          padding: 12px 24px !important;
          border-radius: 8px !important;
          font-size: 16px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          box-sizing: border-box !important;
        }
        
        .test-retake-btn:hover {
          opacity: 0.9 !important;
          transform: scale(1.02) !important;
        }
        `}
      </style>
    </div>
  );
};

const TestCard = ({ test, color, isCompleted, onStartTest, onRetakeTest }) => {
  return (
    <div 
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        border: `2px solid ${isCompleted ? '#10b981' : `${color}20`}`,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        position: 'relative'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 8px 32px ${color}30`;
        e.currentTarget.style.borderColor = isCompleted ? '#10b981' : `${color}50`;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
        e.currentTarget.style.borderColor = isCompleted ? '#10b981' : `${color}20`;
      }}
    >
     
      {isCompleted && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: '#10b981',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          ✅ Plotësuar
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ 
          fontSize: '20px', 
          fontWeight: 'bold', 
          color: '#1f2937',
          marginBottom: '8px'
        }}>
          {test.title}
        </h3>
        <p style={{ 
          fontSize: '14px', 
          color: '#6b7280',
          lineHeight: 1.6,
          marginBottom: '16px'
        }}>
          {test.description}
        </p>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        fontSize: '14px',
        color: '#6b7280'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '16px' }}>⏱️ {test.duration} min</span>
          <span>📝 {test.questionCount} questions</span>
        </div>
      </div>

   
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          className="test-retake-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔥 BUTTON CLICKED!', { isCompleted, testId: test.id });
            
            if (isCompleted) {
              onRetakeTest();
            } else {
              onStartTest();
            }
          }}
          style={{
            flex: 1,
            background: isCompleted ? 
              'linear-gradient(135deg, #f59e0b, #d97706)' : 
              color,
            color: 'white'
          }}
        >
          {isCompleted ? '🔄 Ribëj Testin' : 'Fillo Testin →'}
        </button>

        {isCompleted && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('📊 Results clicked for:', test.title);
              alert(`Shiko rezultatet për: ${test.title}`);
            }}
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            📊
          </button>
        )}
      </div>
    </div>
  );
};

export default TestList;

