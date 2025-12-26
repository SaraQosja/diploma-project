

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; 
import RealCounselorChat from '../components/counselor/RealCounselorChat';
import './CounselorChatPage.css';

const CounselorChatPage = () => {
  const { user } = useAuth(); 
  const [counselors, setCounselors] = useState([]);
  const [mySessions, setMySessions] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (user?.token) {
      setUserRole(user.roli || user.role);
      loadRealCounselors();
      loadRealSessions();
    }
  }, [user]);

  
  const loadRealCounselors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/counselor/available`, {
        headers: {
          'Authorization': `Bearer ${user.token}`, 
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCounselors(data.data || []);
        
        if (data.data.length === 0) {
          setError('Nuk ka këshillues të regjistruar akoma. Kontaktoni administratorin.');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Gabim në ngarkimin e këshilluesve');
      }
    } catch (error) {
      console.error('Error loading real counselors:', error);
      setError('Gabim në lidhjen me serverin. Ju lutem provoni përsëri.');
    } finally {
      setLoading(false);
    }
  };

  const loadRealSessions = async () => {
    try {
      const response = await fetch(`${API_BASE}/counselor/my-sessions`, {
        headers: {
          'Authorization': `Bearer ${user.token}`, 
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMySessions(data.data || []);
      } else {
        console.error('Failed to load sessions');
      }
    } catch (error) {
      console.error('Error loading real sessions:', error);
    }
  };

 
  const startRealSession = async (counselor) => {
    if (!counselor.isAvailable) {
      alert('Ky këshillues nuk është i disponueshëm momentalisht.');
      return;
    }

    try {
      const subject = prompt('Shkruani subjektin e sesionit (opsionale):');
      if (subject === null) return; 
      
      const response = await fetch(`${API_BASE}/counselor/start-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`, 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          counselorId: counselor.id, 
          subject: subject || undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
      
        setActiveChat(data.data.roomId); 
        setSelectedCounselor(counselor); 
        loadRealSessions(); 
        
      
        if (data.data.isExisting) {
          alert('U rilidh me sesionin ekzistues me këtë këshillues.');
        } else {
          alert('Sesioni u krijua me sukses! Filloni të chatoni.');
        }
      } else {
        alert(data.message || 'Gabim në krijimin e sesionit');
      }
    } catch (error) {
      console.error('Error starting real session:', error);
      alert('Gabim në krijimin e sesionit. Ju lutem provoni përsëri.');
    }
  };

  const openRealSession = (session) => {
    setActiveChat(session.roomId); 
    
   
    const counselorName = session.otherParticipant;
    setSelectedCounselor({
      fullName: counselorName,
      specialization: 'Specialist në orientim karriere',
      id: session.counselorId 
    });
  };

  
  const closeChat = () => {
    setActiveChat(null);
    setSelectedCounselor(null);
    loadRealSessions(); 
  };

  const toggleAvailability = async () => {
    if (userRole !== 'counselor') return;

    try {
      const newAvailability = !user.isAvailable;
      
      const response = await fetch(`${API_BASE}/counselor/availability`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isAvailable: newAvailability
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
     
        loadRealCounselors();
      } else {
        alert(data.message || 'Gabim në përditësimin e disponueshmërisë');
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('Gabim në përditësimin e disponueshmërisë');
    }
  };


  const applyToBeCounselor = async () => {
    const bio = prompt('Shkruani biografinë tuaj profesionale (min 50 karaktere):');
    if (!bio || bio.length < 50) {
      alert('Biografia duhet të jetë të paktën 50 karaktere.');
      return;
    }

    const specialization = prompt('Shkruani specializimin tuaj:');
    if (!specialization || specialization.length < 3) {
      alert('Specializimi duhet të jetë të paktën 3 karaktere.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/counselor/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          counselorBio: bio,
          specialization: specialization,
          experience: ''
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Aplikimi juaj u pranua! Tani jeni këshillues i verifikuar.');
        window.location.reload(); 
      } else {
        alert(data.message || 'Gabim në aplikimin për këshillues');
      }
    } catch (error) {
      console.error('Error applying to be counselor:', error);
      alert('Gabim në aplikimin për këshillues');
    }
  };

  if (!user) {
    return (
      <div className="counselor-chat-page">
        <div className="auth-required">
          <h2>Duhet të jeni të loguar</h2>
          <p>Për të përdorur chat-in me këshillues, ju duhet të jeni të loguar në llogari.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="counselor-chat-page">
      {/* Page Header */}
      <div className="page-header">
        <h1>💬 Chat me Këshillues të Vërtetë</h1>
        <p>Bisedoni me këshillues të vërtetë për karrierën tuaj</p>
        <div className="user-info">
          Përshëndetje, <strong>{user.emri} {user.surname}</strong>!
          {userRole === 'counselor' && (
            <div className="counselor-controls">
              <span className="counselor-badge">👨‍💼 Këshillues</span>
              <button 
                className="toggle-availability-btn"
                onClick={toggleAvailability}
                title="Ndrysho disponueshmërinë"
              >
                {user.isAvailable ? '🟢 Online' : '🔴 Offline'}
              </button>
            </div>
          )}
          {userRole !== 'counselor' && (
            <button 
              className="apply-counselor-btn"
              onClick={applyToBeCounselor}
              title="Apliko për të qenë këshillues"
            >
              👨‍💼 Bëhu Këshillues
            </button>
          )}
        </div>
      </div>

      <div className="counselor-layout">
        {/* Real Counselors Sidebar */}
        <div className="counselor-sidebar">
          {/* Error Display */}
          {error && (
            <div className="error-message">
              <span>❌ {error}</span>
              <button onClick={() => setError(null)}>✕</button>
            </div>
          )}

          {/* Real Available Counselors */}
          <div className="sidebar-section">
            <h3>
              🟢 Këshillues të Vërtetë Online 
              ({counselors.filter(c => c.isAvailable).length})
            </h3>
            {loading ? (
              <div className="loading">
                <div className="loading-spinner"></div>
                <span>Duke ngarkuar këshilluesit e vërtetë...</span>
              </div>
            ) : (
              <div className="counselors-list">
                {counselors.filter(c => c.isAvailable).map(counselor => (
                  <div 
                    key={counselor.id} 
                    className="counselor-card real-counselor available"
                    onClick={() => startRealSession(counselor)}
                    title={`Chat me ${counselor.fullName} - REAL counselor`}
                  >
                    <div className="counselor-avatar">
                      <span>{counselor.initials}</span>
                      <div className="status-dot online real"></div>
                    </div>
                    <div className="counselor-info">
                      <h4>
                        {counselor.fullName} 
                        <span className="real-badge">REAL</span>
                      </h4>
                      <p className="specialization">{counselor.specialization}</p>
                      <p className="bio">{counselor.bio}</p>
                      <span className="status">🟢 Online tani</span>
                      <span className="joined-date">
                        Anëtar që nga: {new Date(counselor.joinedDate).toLocaleDateString('sq-AL')}
                      </span>
                    </div>
                  </div>
                ))}
                
                {/* Offline Counselors */}
                {counselors.filter(c => !c.isAvailable).length > 0 && (
                  <div className="offline-section">
                    <h4>🔴 Këshillues Offline ({counselors.filter(c => !c.isAvailable).length})</h4>
                    {counselors.filter(c => !c.isAvailable).map(counselor => (
                      <div key={counselor.id} className="counselor-card real-counselor offline">
                        <div className="counselor-avatar">
                          <span>{counselor.initials}</span>
                          <div className="status-dot offline"></div>
                        </div>
                        <div className="counselor-info">
                          <h4>
                            {counselor.fullName} 
                            <span className="real-badge">REAL</span>
                          </h4>
                          <p className="specialization">{counselor.specialization}</p>
                          <span className="status">
                            🔴 Offline - Aktiv: {new Date(counselor.lastActive).toLocaleString('sq-AL')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No Counselors Message */}
                {counselors.length === 0 && !loading && (
                  <div className="no-counselors">
                    <div className="no-counselors-icon">👨‍💼</div>
                    <h4>Nuk ka këshillues akoma</h4>
                    <p>Këshilluesit do të shfaqen këtu kur të regjistrohen në sistem.</p>
                    <button 
                      className="apply-counselor-btn"
                      onClick={applyToBeCounselor}
                    >
                      Bëhu i pari që aplikon!
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Real Chat Sessions */}
          <div className="sidebar-section">
            <h3>📋 Bisedat e Mia të Vërteta ({mySessions.length})</h3>
            <div className="sessions-list">
              {mySessions.map(session => (
                <div 
                  key={session.roomId}
                  className={`session-card real-session ${session.isActive ? 'active' : 'closed'}`}
                  onClick={() => openRealSession(session)}
                  title="Bisedë e vërtetë me këshillues real"
                >
                  <div className="session-info">
                    <h4>
                      {session.name} 
                      <span className="real-badge">REAL</span>
                    </h4>
                    <p className="last-message">{session.lastMessage}</p>
                    <span className="session-status">
                      {session.isActive ? '🟢 Aktiv' : '🔴 Mbyllur'} - REAL chat
                    </span>
                  </div>
                  <div className="session-meta">
                    <span className="message-count">{session.messageCount} mesazhe të vërteta</span>
                    <span className="other-participant">me {session.otherParticipant}</span>
                    <span className="session-role">Si: {session.userRole}</span>
                    {session.lastMessageTime && (
                      <span className="last-active">
                        {new Date(session.lastMessageTime).toLocaleString('sq-AL')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {mySessions.length === 0 && (
                <div className="no-sessions">
                  <div className="no-sessions-icon">💬</div>
                  <h4>Nuk keni biseda akoma</h4>
                  <p>Filloni një bisedë të vërtetë me një këshillues për të parë historikun këtu.</p>
                </div>
              )}
            </div>
          </div>

          {/* Refresh Button */}
          <div className="sidebar-actions">
            <button 
              className="refresh-btn"
              onClick={() => {
                loadRealCounselors();
                loadRealSessions();
              }}
              disabled={loading}
            >
              🔄 Rifresko
            </button>
          </div>
        </div>

        {/* Real Chat Area */}
        <div className="chat-area">
          <RealCounselorChat
            roomId={activeChat} 
            counselor={selectedCounselor} 
            onClose={closeChat}
            onSessionClose={() => {
              loadRealSessions();
              alert('Sesioni real u mbyll');
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CounselorChatPage;