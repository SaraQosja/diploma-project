
// frontend/src/components/tests/TakeTest.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { testService } from '../../services/testService';

const TakeTest = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  
  const [allTests, setAllTests] = useState([]);
  const [allUserResults, setAllUserResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const [selectedTestForRetake, setSelectedTestForRetake] = useState(null);

  
  const getCompletedTestIds = () => allUserResults.map(r => r.testId?.toString()) || [];
  const areAllTestsCompleted = () => getCompletedTestIds().length >= allTests.length && allTests.length > 0;


  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        let tests = [];
        try {
          const testsResponse = await testService.getAllTests();
          if (testsResponse?.success && testsResponse?.data?.length > 0) {
         
            tests = testsResponse.data.map(test => ({
              id: test.id,
              title: processClob(test.title) || 'Test',
              description: processClob(test.description) || 'Përshkrim nuk është i disponueshëm',
              duration: test.duration || 15,
              questionCount: test.questionCount || 0,
              category: processClob(test.category) || 'General'
            }));
            console.log('✅ Loaded tests from API:', tests.length);
          } else {
            console.warn('⚠️ No tests from API, using fallback');
            tests = getFallbackTests();
          }
        } catch (apiError) {
          console.warn('⚠️ API failed, using fallback tests:', apiError.message);
          tests = getFallbackTests();
        }
        
        setAllTests(tests);

      
        try {
          const resultsResponse = await testService.getUserResults();
          if (resultsResponse?.success) {
            setAllUserResults(resultsResponse.data || []);
          }
        } catch (resultError) {
          console.warn('⚠️ Could not load user results:', resultError.message);
          setAllUserResults([]);
        }

      } catch (error) {
        console.error('❌ Error loading data:', error);
        setError('Problem me ngarkimin e të dhënave. Duke përdorur të dhëna standarde.');
        setAllTests(getFallbackTests());
        setAllUserResults([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const processClob = (data) => {
    if (!data) return '';
    
    if (typeof data === 'string') {
      return data;
    }
 
    if (typeof data === 'object') {
      const str = data.toString();
      if (str && str !== '[object Object]') {
        return str;
      }
    }
    
    return '';
  };

  const getFallbackTests = () => [
    {
      id: 1,
      title: "Test Interesash",
      description: "Zbuloni interesat dhe pasionet tuaja për të gjetur rrugë karriere që përputhen me atë që ju motivon.",
      duration: 10,
      questionCount: 25,
      category: "interest"
    },
    {
      id: 2,
      title: "Test Aftësish Logjike", 
      description: "Vlerësoni aftësitë tuaja natyrore dhe pikat e forta njohëse për të identifikuar karriera ku mund të shkëlqeni.",
      duration: 20,
      questionCount: 15,
      category: "aptitude"
    },
    {
      id: 3,
      title: "Test Personaliteti",
      description: "Vlerësoni tiparet dhe karakteristikat tuaja të personalitetit për të kuptuar preferencat tuaja të punës.",
      duration: 15,
      questionCount: 20,
      category: "personality"
    }
  ];

  const handleRetakeTest = async (testId) => {
    try {
      setLoading(true);
      
      if (testService.resetTestResult) {
        const response = await testService.resetTestResult(testId);
        if (response?.success) {
          
          const updatedResults = await testService.getUserResults();
          if (updatedResults?.success) {
            setAllUserResults(updatedResults.data || []);
          }
          setShowRetakeModal(false);
          navigate(`/tests/${testId}`);
          return;
        }
      }
      
     
      setAllUserResults(prev => prev.filter(r => r.testId?.toString() !== testId.toString()));
      setShowRetakeModal(false);
      alert('⚠️ Reset API nuk është gati. Duke përdorur metodë lokale.');
      navigate(`/tests/${testId}`);
      
    } catch (error) {
      console.error('❌ Retake error:', error);
      setError('Gabim në rivendosjen e testit: ' + error.message);
      setShowRetakeModal(false);
    } finally {
      setLoading(false);
    }
  };

  const RetakeModal = () => {
    if (!showRetakeModal || !selectedTestForRetake) return null;
    
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.7)', display: 'flex', 
        justifyContent: 'center', alignItems: 'center', zIndex: 999999
      }}>
        <div style={{
          background: 'white', borderRadius: '16px', padding: '32px',
          maxWidth: '400px', width: '90%', textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px' }}>
            Ribëj Testin?
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px', lineHeight: '1.5' }}>
            <strong>{selectedTestForRetake.title}</strong><br/>
            Kjo do të fshijë rezultatin tuaj aktual. Jeni i sigurt?
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => setShowRetakeModal(false)} style={{
              background: 'rgba(107,114,128,0.1)', color: '#6b7280',
              border: '2px solid rgba(107,114,128,0.3)', padding: '10px 20px',
              borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
            }}>
              Anulo
            </button>
            <button onClick={() => handleRetakeTest(selectedTestForRetake.id)} style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white',
              border: 'none', padding: '10px 20px', borderRadius: '8px',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer'
            }}>
              Po, Ribëje
            </button>
          </div>
        </div>
      </div>
    );
  };

 
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px', height: '60px', border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white', borderRadius: '50%',
            animation: 'spin 1s linear infinite', margin: '0 auto 24px'
          }}></div>
          <p style={{ color: 'white', fontSize: '18px', fontWeight: '500' }}>
            Duke ngarkuar...
          </p>
        </div>
      </div>
    );
  }

  if (testId && /^\d+$/.test(testId)) {  
  return <TestInterface testId={testId} navigate={navigate} />;
}

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
    
        <div style={{
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
          borderRadius: '20px', padding: '40px', marginBottom: '30px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)', textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📝</div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px' }}>
            Testet e Vlerësimit
          </h1>
          <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '20px' }}>
            Plotësoni testet për rekomandime të personalizuara
          </p>

          <div style={{
            background: '#f0f9ff', border: '2px solid #3b82f6', borderRadius: '12px',
            padding: '20px', marginTop: '24px'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e40af', marginBottom: '12px' }}>
              🎯 Progresi: {getCompletedTestIds().length}/{allTests.length} Teste të Plotësuara
            </div>
            <div style={{ width: '100%', height: '12px', background: '#e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{
                width: `${allTests.length > 0 ? (getCompletedTestIds().length/allTests.length) * 100 : 0}%`,
                height: '100%', background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #ef4444', color: '#dc2626',
              padding: '12px', borderRadius: '8px', marginTop: '16px', fontSize: '14px'
            }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '24px',
          marginBottom: '40px'
        }}>
          {allTests.map((test) => {
            const isCompleted = getCompletedTestIds().includes(test.id?.toString());
            
            return (
              <div key={test.id} style={{
                background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
                borderRadius: '16px', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: isCompleted ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.2)',
                transition: 'transform 0.2s ease', position: 'relative'
              }}
              onMouseOver={(e) => !isCompleted && (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {isCompleted && (
                  <div style={{
                    position: 'absolute', top: '16px', right: '16px',
                    background: '#10b981', color: 'white', padding: '6px 12px',
                    borderRadius: '12px', fontSize: '12px', fontWeight: '600'
                  }}>
                    ✅ Plotësuar
                  </div>
                )}

                <div style={{ fontSize: '32px', marginBottom: '16px' }}>📝</div>
                
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                  {test.title || 'Test'}
                </h3>
                
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.4' }}>
                  {test.description || 'Përshkrim nuk është i disponueshëm'}
                </p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {[
                    { icon: '⏱️', text: `${test.duration || 15} min` },
                    { icon: '❓', text: `${test.questionCount || 0} pyetje` },
                    { icon: '🎯', text: test.category || 'Tjetër' }
                  ].map((item, i) => (
                    <span key={i} style={{ 
                      fontSize: '12px', color: '#6b7280', background: '#f3f4f6',
                      padding: '4px 8px', borderRadius: '8px'
                    }}>
                      {item.icon} {item.text}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => {
                    if (isCompleted) {
                      setSelectedTestForRetake(test);
                      setShowRetakeModal(true);
                    } else {
                      navigate(`/tests/${test.id}`);
                    }
                  }}
                  style={{
                    width: '100%',
                    background: isCompleted 
                      ? 'rgba(249,158,11,0.1)' 
                      : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    color: isCompleted ? '#d97706' : 'white',
                    border: isCompleted ? '2px solid rgba(249,158,11,0.3)' : 'none',
                    padding: '12px 20px', borderRadius: '8px',
                    fontSize: '14px', fontWeight: '600', cursor: 'pointer'
                  }}
                >
                  {isCompleted ? '🔄 Ribëj Testin' : '🚀 Fillo Testin'}
                </button>
              </div>
            );
          })}
        </div>

       
        {areAllTestsCompleted() && (
          <div style={{
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
            borderRadius: '20px', padding: '50px 40px', textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>🏆</div>
            <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
              Urime! Të gjitha testet u plotësuan!
            </h3>
            <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px' }}>
              Tani mund të shikoni rekomandimet tuaja personale ose të shtoni notat për rekomandime më të sakta.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/recommendations?source=tests')} style={{
                background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
                border: 'none', padding: '16px 32px', borderRadius: '10px',
                fontSize: '16px', fontWeight: '600', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
              }}>
                🎯 Shiko Rekomandimet nga Teste
              </button>
              
              <button onClick={() => navigate('/grades')} style={{
  background: 'rgba(59,130,246,0.1)', color: '#3b82f6',
  border: '2px solid #3b82f6', padding: '16px 32px', borderRadius: '10px',
  fontSize: '16px', fontWeight: '600', cursor: 'pointer'
}}>
  📚 Shto Notat
</button>
            </div>
          </div>
        )}
      </div>

      <RetakeModal />

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const TestInterface = ({ testId, navigate }) => {
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadTest = async () => {
      try {
        setLoading(true);
        const response = await testService.getTest(testId);
        
        if (response?.success && response?.data) {
          const testData = response.data;
          
          const processedTest = {
            ...testData,
            title: processClob(testData.title) || 'Test',
            description: processClob(testData.description) || 'Përshkrim nuk është i disponueshëm',
            questions: testData.questions?.map(q => ({
              ...q,
              text: processClob(q.text) || 'Pyetje',
              type: processClob(q.type) || 'scale',
              options: processOptions(q.options),
              category: processClob(q.category) || 'General'
            })) || []
          };
          
          if (processedTest.questions.length === 0) {
            throw new Error('Test nuk ka pyetje të disponueshme');
          }
          
          setTest(processedTest);
          setTimeLeft((processedTest.duration || 15) * 60);
        } else {
          throw new Error('Test nuk ka pyetje të disponueshme');
        }
      } catch (error) {
        setError(error.message || 'Gabim në ngarkimin e testit');
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [testId]);

  const processClob = (data) => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (typeof data === 'object') {
      const str = data.toString();
      return (str && str !== '[object Object]') ? str : '';
    }
    return '';
  };

  const processOptions = (options) => {
    if (!options) return [];
    
    try {
      if (Array.isArray(options)) return options;
      
      if (typeof options === 'string') {
   
        if (options.startsWith('[') || options.startsWith('{')) {
          return JSON.parse(options);
        }
     
        return options.split(',').map(opt => opt.trim());
      }
      
      
      if (typeof options === 'object') {
        const str = options.toString();
        if (str && str !== '[object Object]') {
          if (str.startsWith('[') || str.startsWith('{')) {
            return JSON.parse(str);
          }
          return str.split(',').map(opt => opt.trim());
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error processing options:', error);
      return [];
    }
  };

 
  useEffect(() => {
    if (timeLeft > 0 && !showInstructions && !isSubmitting) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showInstructions) {
      handleSubmit();
    }
  }, [timeLeft, showInstructions, isSubmitting]);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const response = await testService.submitTest(testId, { answers, timeTaken: 1 });
      if (response?.success) {
        alert('Testi u dorëzua me sukses!');
        navigate('/tests');
      } else {
        throw new Error('Gabim në dorëzim');
      }
    } catch (error) {
      setError(error.message);
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px', height: '60px', border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white', borderRadius: '50%',
            animation: 'spin 1s linear infinite', margin: '0 auto 24px'
          }}></div>
          <p style={{ color: 'white', fontSize: '18px' }}>Duke ngarkuar testin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.95)', borderRadius: '16px', padding: '60px 40px',
          textAlign: 'center', maxWidth: '600px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>⚠️</div>
          <h3 style={{ fontSize: '24px', color: '#ef4444', marginBottom: '12px' }}>Gabim</h3>
          <p style={{ color: '#6b7280', marginBottom: '32px' }}>{error}</p>
          <button onClick={() => navigate('/tests')} style={{
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white',
            border: 'none', padding: '14px 28px', borderRadius: '8px',
            fontSize: '16px', fontWeight: '600', cursor: 'pointer'
          }}>
            ← Kthehu te Testet
          </button>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div style={{ 
        minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.95)', borderRadius: '16px', padding: '60px 40px',
          textAlign: 'center', maxWidth: '500px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>📝</div>
          <h3 style={{ fontSize: '24px', color: '#1f2937', marginBottom: '12px' }}>Test #{testId}</h3>
          <p style={{ color: '#6b7280', marginBottom: '32px' }}>
            Test interface do të implementohet kur backend-i të jetë plotësisht gati.
          </p>
          <button onClick={() => navigate('/tests')} style={{
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white',
            border: 'none', padding: '14px 28px', borderRadius: '8px',
            fontSize: '16px', fontWeight: '600', cursor: 'pointer'
          }}>
            ← Kthehu te Testet
          </button>
        </div>
      </div>
    );
  }


  if (showInstructions) {
    const safeTitle = processClob(test.title) || 'Test';
    const safeDescription = processClob(test.description) || 'Përshkrim nuk është i disponueshëm';
    
    return (
      <div style={{ 
        minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            background: 'rgba(255,255,255,0.95)', borderRadius: '16px', padding: '40px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📝</div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
              {safeTitle}
            </h1>
            <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px', lineHeight: '1.6' }}>
              {safeDescription}
            </p>
            
        
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '20px',
              marginBottom: '32px'
            }}>
              <div style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏱️</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                  {test.duration ? `${test.duration} min` : '15 min'}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Kohëzgjatja</div>
              </div>
              
              <div style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📝</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                  {test.questions ? test.questions.length : 0}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Pyetje</div>
              </div>
              
              <div style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                  {processClob(test.category) || 'Tjetër'}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Kategoria</div>
              </div>
            </div>

            {/* Instructions */}
            <div style={{
              background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '12px',
              padding: '20px', marginBottom: '32px', textAlign: 'left'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#92400e', marginBottom: '12px' }}>
                📋 Udhëzime:
              </h3>
              <ul style={{ color: '#92400e', fontSize: '14px', lineHeight: '1.6', margin: 0, paddingLeft: '20px' }}>
                <li>Përgjigjuni të gjitha pyetjeve me sinqeritet</li>
                <li>Zgjidhni opsionin që ju përshkruan më mirë</li>
                <li>Nuk ka përgjigje të sakta ose të gabuara</li>
                <li>Dorëzoni vetëm kur të keni mbaruar</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => navigate('/tests')} style={{
                background: 'rgba(107,114,128,0.1)', color: '#6b7280',
                border: '2px solid rgba(107,114,128,0.3)', padding: '12px 24px',
                borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer'
              }}>
                ← Kthehu
              </button>

              <button onClick={() => setShowInstructions(false)} style={{
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white',
                border: 'none', padding: '12px 32px', borderRadius: '8px',
                fontSize: '16px', fontWeight: '600', cursor: 'pointer'
              }}>
                Fillo Testin →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  
  const currentQ = test.questions[currentQuestion];
  const safeQuestionText = processClob(currentQ?.text) || 'Pyetje nuk është e disponueshme';
  const safeTestTitle = processClob(test.title) || 'Test';
  
  return (
    <div style={{ 
      minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
 
        <div style={{
          background: 'rgba(255,255,255,0.95)', borderRadius: '16px', padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
              {safeTestTitle}
            </h1>
            <div style={{ 
              background: timeLeft < 300 ? '#fef2f2' : '#f0f9ff',
              color: timeLeft < 300 ? '#dc2626' : '#2563eb',
              padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold'
            }}>
              ⏱️ {formatTime(timeLeft)}
            </div>
          </div>
          
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Pyetja {currentQuestion + 1} nga {test.questions.length}
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.95)', borderRadius: '16px', padding: '32px',
          marginBottom: '24px', minHeight: '300px'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <span style={{ 
              fontSize: '14px', color: '#6b7280', background: '#f3f4f6',
              padding: '4px 12px', borderRadius: '12px'
            }}>
              {processClob(currentQ?.category) || 'Pyetje'}
            </span>
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '32px', lineHeight: 1.6 }}>
            {safeQuestionText}
          </h2>

          <div style={{ marginBottom: '32px' }}>
       
            {currentQ.type === 'multiple_choice' && currentQ.options && currentQ.options.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentQ.options.map((option, index) => {
                  const optionValue = typeof option === 'object' ? option.value : option;
                  const optionLabel = typeof option === 'object' ? option.label : option;
                  
                  return (
                    <label
                      key={index}
                      style={{
                        display: 'flex', alignItems: 'center', padding: '16px',
                        background: answers[currentQ.id] === optionValue ? '#e0e7ff' : '#f8fafc',
                        border: `2px solid ${answers[currentQ.id] === optionValue ? '#3b82f6' : '#e2e8f0'}`,
                        borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease'
                      }}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQ.id}`}
                        value={optionValue}
                        checked={answers[currentQ.id] === optionValue}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                        style={{ marginRight: '12px' }}
                      />
                      <span style={{ fontSize: '16px', color: '#374151' }}>{optionLabel}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {currentQ.type === 'yes_no' && (
              <div style={{ display: 'flex', gap: '16px' }}>
                {['Po', 'Jo'].map((option) => (
                  <button
                    key={option}
                    onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: option }))}
                    style={{
                      flex: 1, padding: '16px',
                      background: answers[currentQ.id] === option ? '#3b82f6' : 'white',
                      color: answers[currentQ.id] === option ? 'white' : '#374151',
                      border: `2px solid ${answers[currentQ.id] === option ? '#3b82f6' : '#e2e8f0'}`,
                      borderRadius: '12px', fontSize: '16px', fontWeight: '600',
                      cursor: 'pointer', transition: 'all 0.2s ease'
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
            {(currentQ.type === 'scale' || currentQ.type === 'rating' || !currentQ.type || 
              (currentQ.type !== 'multiple_choice' && currentQ.type !== 'yes_no')) && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Aspak dakord</span>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Plotësisht dakord</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: value }))}
                      style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: answers[currentQ.id] === value ? '#3b82f6' : 'white',
                        color: answers[currentQ.id] === value ? 'white' : '#374151',
                        border: `2px solid ${answers[currentQ.id] === value ? '#3b82f6' : '#e2e8f0'}`,
                        fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: answers[currentQ.id] === value ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                      }}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      
        <div style={{
          background: 'rgba(255,255,255,0.95)', borderRadius: '16px', padding: '24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            style={{
              background: currentQuestion === 0 ? '#f3f4f6' : 'white',
              color: currentQuestion === 0 ? '#9ca3af' : '#374151',
              border: '2px solid #e2e8f0', padding: '12px 24px', borderRadius: '8px',
              fontSize: '16px', fontWeight: '600', 
              }}
          >
            ← E Mëparshme
          </button>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              {currentQuestion + 1} nga {test.questions.length}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
              {answers[currentQ.id] ? '✓ U përgjigj' : 'Pa përgjigje'}
            </div>
          </div>

          {currentQuestion === test.questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                background: isSubmitting ? '#9ca3af' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: 'white', border: 'none', padding: '12px 32px', borderRadius: '8px',
                fontSize: '16px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              {isSubmitting ? 'Duke Dorëzuar...' : 'Dorëzo Testin'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(Math.min(test.questions.length - 1, currentQuestion + 1))}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white',
                border: 'none', padding: '12px 24px', borderRadius: '8px',
                fontSize: '16px', fontWeight: '600', cursor: 'pointer'
              }}
            >
              Tjetra →
            </button>
          )}
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #ef4444', color: '#dc2626',
            padding: '16px', borderRadius: '8px', marginTop: '16px', textAlign: 'center'
          }}>
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default TakeTest;