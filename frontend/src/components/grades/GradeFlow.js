
// frontend/src/components/grades/GradeFlow.js 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gradeService } from '../../services/gradeService';
import { toast } from 'react-hot-toast';

const GradeFlow = () => {
  const navigate = useNavigate();
  const [selectedGradeMethod, setSelectedGradeMethod] = useState(null);
  const [yearlyGrades, setYearlyGrades] = useState({
    year1: '',
    year2: '',
    year3: ''
  });
  const [maturaGrades, setMaturaGrades] = useState({
    gjuheShqipe: '',
    matematike: '',
    anglisht: '',
    LendeMeZgjedhje: ''
  });
  const [gradesSaved, setGradesSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saveResult, setSaveResult] = useState(null);

  const validateAndFormatGrade = (value, inputType = 'matura') => {
    const cleanValue = value.toString().trim();
    
    if (!cleanValue) return { isValid: true, value: '', message: '' };
    
    const numValue = parseFloat(cleanValue);
    
    if (isNaN(numValue)) {
      return { 
        isValid: false, 
        value: cleanValue, 
        message: 'Vendosni një notë të vlefshme (p.sh. 8.5)' 
      };
    }
    
    const minGrade = inputType === 'yearly' ? 5.0 : 4.0;
    const maxGrade = 10.0;
    
    if (numValue < minGrade || numValue > maxGrade) {
      return { 
        isValid: false, 
        value: cleanValue, 
        message: `Nota duhet të jetë midis ${minGrade} dhe ${maxGrade}` 
      };
    }
    
    const decimalParts = cleanValue.split('.');
    if (decimalParts.length > 1 && decimalParts[1].length > 2) {
      return { 
        isValid: false, 
        value: cleanValue, 
        message: 'Maksimum 2 shifra pas presjes (p.sh. 8.75)' 
      };
    }
    
    const formattedValue = Number(numValue.toFixed(2)).toString();
    
    return { 
      isValid: true, 
      value: formattedValue, 
      message: '' 
    };
  };


  const handleGradeChange = (value, field, type = 'matura') => {
    const validation = validateAndFormatGrade(value, type);
    
    if (type === 'yearly') {
      setYearlyGrades(prev => ({
        ...prev,
        [field]: validation.value
      }));
    } else {
      setMaturaGrades(prev => ({
        ...prev,
        [field]: validation.value
      }));
    }
    
    if (!validation.isValid) {
      setFieldErrors(prev => ({ ...prev, [field]: validation.message }));
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };


  const validateAllGrades = () => {
    const errors = [];
    
    Object.entries(yearlyGrades).forEach(([key, value]) => {
      if (value) {
        const validation = validateAndFormatGrade(value, 'yearly');
        if (!validation.isValid) {
          errors.push(`Viti ${key.slice(-1)}: ${validation.message}`);
        }
      }
    });
    
    Object.entries(maturaGrades).forEach(([key, value]) => {
      if (value) {
        const validation = validateAndFormatGrade(value, 'matura');
        if (!validation.isValid) {
          const subjectNames = {
            gjuheShqipe: 'Gjuhë Shqipe',
            matematike: 'Matematikë', 
            anglisht: 'Anglisht',
            LendeMeZgjedhje: 'Lëndë me Zgjedhje'
          };
          errors.push(`${subjectNames[key]}: ${validation.message}`);
        }
      }
    });
    
    return errors;
  };


  const ErrorMessage = ({ field }) => {
    if (!fieldErrors[field]) return null;
    
    return (
      <div style={{
        color: '#dc2626',
        fontSize: '12px',
        marginTop: '4px',
        fontWeight: '500'
      }}>
        ⚠️ {fieldErrors[field]}
      </div>
    );
  };
  const handleDetailedMethod = () => {
    console.log('🚨 GOING TO DETAILED INTERFACE');
    setSelectedGradeMethod('detailed');
  };

  const saveDetailedGrades = async () => {
    console.log('🔥 SAVE BUTTON CLICKED');
    console.log('🔥 yearlyGrades:', yearlyGrades);
    console.log('🔥 maturaGrades:', maturaGrades);
 
    const validationErrors = validateAllGrades();
    console.log('🔥 VALIDATION ERRORS:', validationErrors);
    if (validationErrors.length > 0) {
      toast.error(`Ju lutem korrigoni: ${validationErrors.join(', ')}`);
      return;
    }

    const hasYearlyGrades = yearlyGrades.year1 || yearlyGrades.year2 || yearlyGrades.year3;
    const hasMaturaGrades = maturaGrades.gjuheShqipe || maturaGrades.matematike || maturaGrades.anglisht || maturaGrades.LendeMeZgjedhje;
    
    console.log('🔥 HAS YEARLY:', hasYearlyGrades);
    console.log('🔥 HAS MATURA:', hasMaturaGrades);
    
    if (!hasYearlyGrades && !hasMaturaGrades) {
      console.log('🔥 NO GRADES ENTERED - STOPPING');
      toast.error('Ju lutem vendosni të paktën një notë');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Duke ruajtur notat...');
    
    try {
      const gradesToSave = [];
      console.log('🔥 STARTING TO BUILD GRADES ARRAY');
      
      if (yearlyGrades.year1) {
        gradesToSave.push({
          subjectName: 'Mesatarja Vjetore Viti 1',
          grade: parseFloat(yearlyGrades.year1),
          yearTaken: new Date().getFullYear() - 2,
          gradeType: 'yearly',
          isMaturaSubject: 0
        });
      }
      
      if (yearlyGrades.year2) {
        gradesToSave.push({
          subjectName: 'Mesatarja Vjetore Viti 2',
          grade: parseFloat(yearlyGrades.year2),
          yearTaken: new Date().getFullYear() - 1,
          gradeType: 'yearly',
          isMaturaSubject: 0
        });
      }
      
      if (yearlyGrades.year3) {
        gradesToSave.push({
          subjectName: 'Mesatarja Vjetore Viti 3',
          grade: parseFloat(yearlyGrades.year3),
          yearTaken: new Date().getFullYear(),
          gradeType: 'yearly',
          isMaturaSubject: 0
        });
      }
      
      const subjectNames = {
        gjuheShqipe: 'Gjuhë dhe Letërsi Shqipe',
        matematike: 'Matematikë',
        anglisht: 'Gjuhë e Huaj (Anglisht)',
        LendeMeZgjedhje: 'Lende me Zgjedhje'
      };
      
      Object.entries(maturaGrades).forEach(([subject, grade]) => {
        if (grade) {
          gradesToSave.push({
            subjectName: subjectNames[subject],
            grade: parseFloat(grade),
            yearTaken: new Date().getFullYear(),
            gradeType: 'matura',
            isMaturaSubject: 1
          });
        }
      });
      
      console.log('🔥 TOTAL GRADES TO SAVE:', gradesToSave.length);
      console.log('🔥 GRADES ARRAY:', gradesToSave);
      
      if (gradesToSave.length === 0) {
        toast.dismiss(loadingToast);
        toast.error('Asnjë notë e vlefshme për t\'u ruajtur');
        return;
      }
      
  
      const result = await gradeService.bulkSaveGrades(gradesToSave);
      console.log('🔥 BULK SAVE RESULT:', result);
      
      toast.dismiss(loadingToast);
      
      setSaveResult(result);
      setGradesSaved(true);
      
      if (result.success) {
        toast.success('Notat u ruajtën me sukses! 🎉', { duration: 3000 });
      } else {
        toast.error(result.message, { duration: 4000 });
        
    
        if (result.data?.saved > 0) {
          setTimeout(() => {
            toast.success(`${result.data.saved} nota u ruajtën me sukses`, { duration: 3000 });
          }, 800);
        }
      }
      
    } catch (error) {
      console.error('❌ FATAL ERROR saving detailed grades:', error);
      toast.dismiss(loadingToast);
      toast.error('Gabim në ruajtjen e notave. Ju lutem provoni përsëri.', { duration: 4000 });
      
      setSaveResult({
        success: false,
        message: 'Gabim në komunikim me serverin',
        data: { saved: 0, errors: 1, total: 1 }
      });
      setGradesSaved(true);
      
    } finally {
      setLoading(false);
    }
  };


  const showRecommendationsPage = () => {
    navigate('/recommendations?source=grades');
  };

  const goBack = () => {
    setSelectedGradeMethod(null);
    setGradesSaved(false);
    setSaveResult(null);
  };


  const tryAgain = () => {
    setGradesSaved(false);
    setSaveResult(null);

  };

  const goBackToTests = () => {
    navigate('/tests');
  };

  if (selectedGradeMethod === 'detailed') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '20px' 
      }}>
        <div style={{ 
          maxWidth: '900px', 
          width: '100%', 
          background: 'white', 
          borderRadius: '16px', 
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)', 
          padding: '40px' 
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px' }}>
              Mesataret + Matura
            </h2>
            <p style={{ color: '#6b7280' }}>
              Vendosni mesataret vjetore dhe notat e maturës. Çdo herë që ruani, do të merrni rekomandime të reja!
            </p>
          </div>

          {gradesSaved ? (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{
                background: saveResult?.success ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${saveResult?.success ? '#16a34a' : '#dc2626'}`,
                borderRadius: '8px',
                padding: '24px'
              }}>
                <div style={{ 
                  color: saveResult?.success ? '#16a34a' : '#dc2626', 
                  fontWeight: '600', 
                  fontSize: '18px',
                  marginBottom: '12px'
                }}>
                  {saveResult?.success ? '✅ Notat u ruajtën me sukses!' : '⚠️ Disa probleme ndodhën'}
                </div>
                
                {saveResult?.data && (
                  <div style={{ 
                    color: '#6b7280', 
                    fontSize: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    {saveResult.data.saved > 0 && (
                      <div>📝 {saveResult.data.saved} nota u ruajtën me sukses</div>
                    )}
                    {saveResult.data.errors > 0 && (
                      <div style={{ color: '#dc2626' }}>
                        ❌ {saveResult.data.errors} gabime ndodhën
                      </div>
                    )}
                    <div style={{ marginTop: '8px', fontSize: '13px', color: '#9ca3af' }}>
                      Mund të provoni versione të ndryshme notash për rekomandime të ndryshme
                    </div>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button
                  onClick={showRecommendationsPage}
                  style={{
                    background: 'linear-gradient(135deg, #16a34a, #15803d)',
                    color: 'white',
                    padding: '16px 32px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    margin: '0 auto'
                  }}
                >
                  🎯 Shiko Rekomandimet
                </button>

                <button
                  onClick={tryAgain}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    margin: '0 auto'
                  }}
                >
                  🔄 Provo Nota të Tjera
                </button>

                <button
                  onClick={goBack}
                  style={{
                    background: '#f3f4f6',
                    color: '#6b7280',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    margin: '0 auto'
                  }}
                >
                  ← Fillimi
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Yearly Averages */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
                  📊 Mesataret Vjetore (Opsionale)
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '16px' 
                }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#374151', 
                      marginBottom: '8px' 
                    }}>
                      Viti 1 (5.0-10.0)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="10"
                      step="0.01"
                      value={yearlyGrades.year1}
                      onChange={(e) => handleGradeChange(e.target.value, 'year1', 'yearly')}
                      placeholder="8.75"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: `2px solid ${fieldErrors.year1 ? '#dc2626' : '#d1d5db'}`,
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none',
                        backgroundColor: fieldErrors.year1 ? '#fef2f2' : 'white'
                      }}
                      disabled={loading}
                    />
                    <ErrorMessage field="year1" />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#374151', 
                      marginBottom: '8px' 
                    }}>
                      Viti 2 (5.0-10.0)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="10"
                      step="0.01"
                      value={yearlyGrades.year2}
                      onChange={(e) => handleGradeChange(e.target.value, 'year2', 'yearly')}
                      placeholder="8.75"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: `2px solid ${fieldErrors.year2 ? '#dc2626' : '#d1d5db'}`,
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none',
                        backgroundColor: fieldErrors.year2 ? '#fef2f2' : 'white'
                      }}
                      disabled={loading}
                    />
                    <ErrorMessage field="year2" />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#374151', 
                      marginBottom: '8px' 
                    }}>
                      Viti 3 (5.0-10.0)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="10"
                      step="0.01"
                      value={yearlyGrades.year3}
                      onChange={(e) => handleGradeChange(e.target.value, 'year3', 'yearly')}
                      placeholder="8.75"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: `2px solid ${fieldErrors.year3 ? '#dc2626' : '#d1d5db'}`,
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none',
                        backgroundColor: fieldErrors.year3 ? '#fef2f2' : 'white'
                      }}
                      disabled={loading}
                    />
                    <ErrorMessage field="year3" />
                  </div>
                </div>
              </div>

              {/* Matura Grades */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
                  🎯 Notat e Maturës (Opsionale)
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '16px' 
                }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#374151', 
                      marginBottom: '8px' 
                    }}>
                      Gjuhë dhe Letërsi Shqipe (4.0-10.0)
                    </label>
                    <input
                      type="number"
                      min="4"
                      max="10"
                      step="0.01"
                      value={maturaGrades.gjuheShqipe}
                      onChange={(e) => handleGradeChange(e.target.value, 'gjuheShqipe', 'matura')}
                      placeholder="8.75"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: `2px solid ${fieldErrors.gjuheShqipe ? '#dc2626' : '#d1d5db'}`,
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none',
                        backgroundColor: fieldErrors.gjuheShqipe ? '#fef2f2' : 'white'
                      }}
                      disabled={loading}
                    />
                    <ErrorMessage field="gjuheShqipe" />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#374151', 
                      marginBottom: '8px' 
                    }}>
                      Matematikë (4.0-10.0)
                    </label>
                    <input
                      type="number"
                      min="4"
                      max="10"
                      step="0.01"
                      value={maturaGrades.matematike}
                      onChange={(e) => handleGradeChange(e.target.value, 'matematike', 'matura')}
                      placeholder="8.75"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: `2px solid ${fieldErrors.matematike ? '#dc2626' : '#d1d5db'}`,
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none',
                        backgroundColor: fieldErrors.matematike ? '#fef2f2' : 'white'
                      }}
                      disabled={loading}
                    />
                    <ErrorMessage field="matematike" />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#374151', 
                      marginBottom: '8px' 
                    }}>
                      Gjuhë e Huaj (Anglisht) (4.0-10.0)
                    </label>
                    <input
                      type="number"
                      min="4"
                      max="10"
                      step="0.01"
                      value={maturaGrades.anglisht}
                      onChange={(e) => handleGradeChange(e.target.value, 'anglisht', 'matura')}
                      placeholder="8.75"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: `2px solid ${fieldErrors.anglisht ? '#dc2626' : '#d1d5db'}`,
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none',
                        backgroundColor: fieldErrors.anglisht ? '#fef2f2' : 'white'
                      }}
                      disabled={loading}
                    />
                    <ErrorMessage field="anglisht" />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#374151', 
                      marginBottom: '8px' 
                    }}>
                      Lende Me Zgjedhje (4.0-10.0)
                    </label>
                    <input
                      type="number"
                      min="4"
                      max="10"
                      step="0.01"
                      value={maturaGrades.LendeMeZgjedhje}
                      onChange={(e) => handleGradeChange(e.target.value, 'LendeMeZgjedhje', 'matura')}
                      placeholder="8.75"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: `2px solid ${fieldErrors.LendeMeZgjedhje ? '#dc2626' : '#d1d5db'}`,
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none',
                        backgroundColor: fieldErrors.LendeMeZgjedhje ? '#fef2f2' : 'white'
                      }}
                      disabled={loading}
                    />
                    <ErrorMessage field="LendeMeZgjedhje" />
                  </div>
                </div>
              </div>

              {/* Helper Text */}
              <div style={{
                background: '#e0f2fe',
                border: '1px solid #0284c7',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <p style={{ color: '#0c4a6e', fontSize: '14px', margin: 0 }}>
                  ✨ <strong>Provo scenario të ndryshme:</strong> Mund të ruani nota të ndryshme sa herë që dëshironi për të marrë rekomandime të ndryshme. Sistemi ruan automatikisht çdo version!
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={goBack}
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: '#f3f4f6',
                    color: '#6b7280',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1
                  }}
                >
                  ← Prapa
                </button>
                <button
                  onClick={saveDetailedGrades}
                  disabled={loading}
                  style={{
                    flex: 2,
                    background: loading ? '#9ca3af' : 'linear-gradient(135deg, #16a34a, #15803d)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Duke ruajtur...' : '💾 Ruaj dhe Shiko Rekomandimet'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '20px' 
    }}>
      <div style={{ 
        maxWidth: '600px', 
        width: '100%', 
        background: 'white', 
        borderRadius: '16px', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)', 
        padding: '40px' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#dbeafe',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '24px'
          }}>
            🎓
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px' }}>
            Vendosja e Notave
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Vendosni notat tuaja akademike për të marrë rekomandime të personalizuara për karrierën dhe universitetet.
          </p>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
            Mesataret + Matura = (VKM)
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            Vendosni mesataret vjetore dhe notat e maturës për rekomandime të sakta.
          </p>

          <button 
            onClick={handleDetailedMethod}
            disabled={loading}
            style={{
              width: '100%',
              padding: '32px',
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              color: 'white',
              borderRadius: '12px',
              border: 'none',
              textAlign: 'center',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.5 : 1,
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
            }}
            onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => (e.target.style.transform = 'translateY(0)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '32px', marginRight: '16px' }}>🚀</span>
              <span style={{ fontSize: '24px', fontWeight: 'bold' }}>Filloni Vendosjen e Notave </span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px', margin: 0 }}>
              Vendosni mesataret vjetore dhe notat e maturës së bashku
            </p>
          </button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={goBackToTests}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: '#f3f4f6',
              color: '#6b7280',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => !loading && (e.target.style.background = '#e5e7eb')}
            onMouseOut={(e) => (e.target.style.background = '#f3f4f6')}
          >
            ← Kthehu te Testet
          </button>
        </div>
      </div>
    </div>
  );
};

export default GradeFlow;



