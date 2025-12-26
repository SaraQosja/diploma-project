//frontend/src/components/dashboard/CounselorOverview.js 

import React, { useState, useEffect } from 'react';

const CounselorOverview = () => {
  const [stats, setStats] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const [statsResponse, chatsResponse] = await Promise.all([
        fetch('/api/counselor/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/counselor/active-chats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }
      
      if (chatsResponse.ok) {
        const chatsData = await chatsResponse.json();
        setChats(chatsData.chats);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        color: '#6b7280',
        fontSize: '18px'
      }}>
        Loading your dashboard...
      </div>
    );
  }

  const defaultStats = {
    totalStudentsHelped: 0,
    activeChats: 0,
    sessionsToday: 0,
    messagesSent: 0
  };

  const currentStats = stats || defaultStats;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Statistics Section */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h3 style={{
          margin: '0 0 24px 0',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#1f2937',
          textAlign: 'center'
        }}>
          Your Statistics
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          {[
            {
              value: currentStats.totalStudentsHelped,
              label: 'Students Helped',
              icon: '👥',
              color: '#3b82f6',
              bgColor: 'rgba(59, 130, 246, 0.1)'
            },
            {
              value: currentStats.activeChats,
              label: 'Active Chats',
              icon: '💬',
              color: '#10b981',
              bgColor: 'rgba(16, 185, 129, 0.1)'
            },
            {
              value: currentStats.sessionsToday,
              label: 'Sessions Today',
              icon: '📅',
              color: '#f59e0b',
              bgColor: 'rgba(245, 158, 11, 0.1)'
            },
            {
              value: currentStats.messagesSent,
              label: 'Messages Sent',
              icon: '📝',
              color: '#8b5cf6',
              bgColor: 'rgba(139, 92, 246, 0.1)'
            }
          ].map((stat, index) => (
            <div
              key={index}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                border: `2px solid ${stat.bgColor}`,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 8px 24px ${stat.color}30`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
              }}
            >
              <div style={{
                fontSize: '32px',
                marginBottom: '12px'
              }}>
                {stat.icon}
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: stat.color,
                marginBottom: '8px'
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Chats Section */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1f2937'
          }}>
            Active Chats
          </h3>
          <button
            onClick={loadData}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            Refresh
          </button>
        </div>
        
        {chats.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <h4 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '20px', 
              fontWeight: '600',
              color: '#374151'
            }}>
              No active chats
            </h4>
            <p style={{ margin: 0, fontSize: '16px' }}>
              Students will appear here when they start chatting with you.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {chats.map((chat) => (
              <div
                key={chat.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  marginRight: '12px'
                }}>
                  {chat.studentName?.charAt(0) || 'S'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>
                      {chat.studentName}
                    </h4>
                    <span style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      {chat.timestamp}
                    </span>
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    Status: {chat.status}
                  </p>
                </div>
                {chat.unreadCount > 0 && (
                  <div style={{
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {chat.unreadCount}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h3 style={{
          margin: '0 0 24px 0',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#1f2937',
          textAlign: 'center'
        }}>
          Quick Actions
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {[
            { label: 'View All Students', icon: '👥', color: '#3b82f6' },
            { label: 'Chat History', icon: '📜', color: '#10b981' },
            { label: 'Update Profile', icon: '⚙️', color: '#f59e0b' }
          ].map((action, index) => (
            <button
              key={index}
              style={{
                background: 'white',
                border: `2px solid rgba(${action.color === '#3b82f6' ? '59, 130, 246' : action.color === '#10b981' ? '16, 185, 129' : '245, 158, 11'}, 0.2)`,
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = `rgba(${action.color === '#3b82f6' ? '59, 130, 246' : action.color === '#10b981' ? '16, 185, 129' : '245, 158, 11'}, 0.1)`;
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 8px 24px rgba(${action.color === '#3b82f6' ? '59, 130, 246' : action.color === '#10b981' ? '16, 185, 129' : '245, 158, 11'}, 0.3)`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                fontSize: '32px',
                marginBottom: '12px'
              }}>
                {action.icon}
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937'
              }}>
                {action.label}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CounselorOverview;