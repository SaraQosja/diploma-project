import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { testService } from '../services/testService';
import { recommendationService } from '../services/recommendationService';
import CounselorDashboard from '../components/dashboard/CounselorDashboard';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    testsTaken: 0,
    recommendations: 0,
    progress: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
   
    if (user?.role !== 'counselor') {
      const fetchStats = async () => {
        try {
          let testsTaken = 0;
          let totalRecs = 0;

          try {
            const testsResponse = await testService.getUserResults();
            testsTaken = testsResponse.success ? testsResponse.data.results.length : 0;
          } catch (error) {
            console.log('Tests API not available yet, using mock data');
            testsTaken = 3;
          }

          try {
            const recsResponse = await recommendationService.getRecommendationStats();
            const recStats = recsResponse.success ? recsResponse.data.stats : {};
            totalRecs = (recStats.career?.total || 0) + (recStats.university?.total || 0);
          } catch (error) {
            console.log('Using mock recommendations data until backend is ready');
            totalRecs = 12;
          }
          
          const progress = Math.min((testsTaken / 3) * 100, 100);

          setStats({
            testsTaken,
            recommendations: totalRecs,
            progress: Math.round(progress)
          });
        } catch (error) {
          console.error('Error fetching dashboard stats:', error);
          setStats({
            testsTaken: 3,
            recommendations: 12,
            progress: 85
          });
        } finally {
          setLoading(false);
        }
      };

      fetchStats();
    }
  }, [user?.role]);

  if (user?.role === 'counselor') {
    return <CounselorDashboard />;
  }

  const handleLogout = async () => {
    await logout();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const isStudent = user?.role === 'nxenes';
  const isCounselor = user?.role === 'counselor';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <nav style={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '16px 0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '24px', marginRight: '8px' }}>🎯</span>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>CareerGuide</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <NavLink onClick={() => navigate('/dashboard')} active={true}>
                🏠 Dashboard
              </NavLink>
              <NavLink onClick={() => navigate('/profile')}>
                👤 Profile
              </NavLink>
              <NavLink onClick={() => navigate('/tests')}>
                🎓Tests & Grades
              </NavLink>
              <NavLink onClick={() => navigate('/recommendations')}>
                🎯 Recommendations
              </NavLink>
              <NavLink onClick={() => navigate('/chat')}>
                💬 Chat
              </NavLink>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                  {getGreeting()}
                </p>
                <p style={{ margin: 0, fontWeight: '600', color: '#1f2937' }}>
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
              <div 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/profile')}
              >
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#dc2626',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
              >
                Logout 🚪
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main style={{ padding: '40px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '40px',
            marginBottom: '30px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>
              {isStudent ? '🎓' : isCounselor ? '👨‍🏫' : '👤'}
            </div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: '#1f2937',
              marginBottom: '12px'
            }}>
              Welcome back, {user?.firstName}!
            </h1>
            <p style={{ 
              fontSize: '18px', 
              color: '#6b7280',
              marginBottom: '20px'
            }}>
              {isStudent && "Ready to explore your career possibilities?"}
              {isCounselor && "Ready to guide students towards their future?"}
              {!isStudent && !isCounselor && "Welcome to your dashboard"}
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: user?.role === 'nxenes' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(79, 70, 229, 0.1)',
              color: user?.role === 'nxenes' ? '#16a34a' : '#4f46e5',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <span style={{ marginRight: '8px' }}>
                {user?.role === 'nxenes' ? '🎓' : user?.role === 'counselor' ? '👨‍🏫' : '👤'}
              </span>
              {user?.role === 'nxenes' ? 'Student' : 
               user?.role === 'counselor' ? 'Career Counselor' : 'User'}
              {user?.isVerified ? ' ✅' : ' ⏳'}
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '24px',
            marginBottom: '30px'
          }}>
            
            <div 
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'transform 0.2s ease',
                cursor: 'pointer'
              }}
              onClick={() => navigate('/tests')}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px'
                }}>
                  <span style={{ fontSize: '24px' }}>📝</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                    Tests Taken
                  </h3>
                  <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
                    {loading ? '...' : stats.testsTaken}
                  </p>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                Complete assessments to discover your strengths
              </p>
            </div>

            <div 
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'transform 0.2s ease',
                cursor: 'pointer'
              }}
              onClick={() => navigate('/recommendations')}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px'
                }}>
                  <span style={{ fontSize: '24px' }}>🎯</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                    Recommendations
                  </h3>
                  <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
                    {loading ? '...' : stats.recommendations}
                  </p>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                Personalized career suggestions for you
              </p>
            </div>

            <div 
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'transform 0.2s ease',
                cursor: 'pointer'
              }}
              onClick={() => navigate('/progress')}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px'
                }}>
                  <span style={{ fontSize: '24px' }}>🏆</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                    Progress Score
                  </h3>
                  <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6' }}>
                    {loading ? '...' : `${stats.progress}%`}
                  </p>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                Your career discovery progress
              </p>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#1f2937',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              🚀 Start Your Journey
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '20px' 
            }}>
              
              <ActionCard 
                icon="🧠"
                title="Personality Test"
                description="Discover your unique personality traits and work preferences"
                color="#3b82f6"
                onClick={() => navigate('/tests')}
              />
              <ActionCard 
                icon="⚡"
                title="Skills Assessment"
                description="Evaluate your abilities and identify your strongest skills"
                color="#10b981"
                onClick={() => navigate('/tests')}
              />
              <ActionCard 
                icon="❤️"
                title="Interest Inventory"
                description="Explore careers that align with your passions"
                color="#f59e0b"
                onClick={() => navigate('/tests')}
              />
              <ActionCard 
                icon="🎓"
                title="Career Explorer"
                description="Browse career options and requirements"
                color="#8b5cf6"
                onClick={() => navigate('/recommendations')}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const NavLink = ({ children, onClick, active = false }) => {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
        color: active ? '#4f46e5' : '#6b7280',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      onMouseOver={(e) => {
        if (!active) {
          e.target.style.background = 'rgba(79, 70, 229, 0.05)';
          e.target.style.color = '#4f46e5';
        }
      }}
      onMouseOut={(e) => {
        if (!active) {
          e.target.style.background = 'transparent';
          e.target.style.color = '#6b7280';
        }
      }}
    >
      {children}
    </button>
  );
};

const ActionCard = ({ icon, title, description, color, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: `2px solid ${color}20`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 8px 24px ${color}30`;
        e.currentTarget.style.borderColor = `${color}50`;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        e.currentTarget.style.borderColor = `${color}20`;
      }}
    >
      <div style={{ 
        fontSize: '32px', 
        marginBottom: '12px',
        textAlign: 'center'
      }}>
        {icon}
      </div>
      <h3 style={{ 
        fontSize: '16px', 
        fontWeight: '600', 
        color: '#1f2937',
        marginBottom: '8px',
        textAlign: 'center'
      }}>
        {title}
      </h3>
      <p style={{ 
        fontSize: '14px', 
        color: '#6b7280',
        lineHeight: 1.5,
        textAlign: 'center',
        margin: 0
      }}>
        {description}
      </p>
    </div>
  );
};

export default Dashboard;