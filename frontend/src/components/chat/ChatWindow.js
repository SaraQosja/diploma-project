// frontend/src/components/chat/ChatWindow.js 
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import './ChatWindow.css';

const ChatWindow = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('discussions');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [counselors, setCounselors] = useState([]);
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [counselorSearch, setCounselorSearch] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [lastMessageId, setLastMessageId] = useState(null);
  
  const [forumMessages, setForumMessages] = useState([]);
  const [aiChatMessages, setAiChatMessages] = useState([]);

  const [showRealCounselorChat, setShowRealCounselorChat] = useState(false);
  const [selectedCounselorData, setSelectedCounselorData] = useState(null);
  
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const pollInterval = useRef(null);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const isLoggedIn = !!(user && (user.token || user.id || user.emri || user.emaili));

  const getUserDisplayName = useCallback(() => {
    if (!user) return 'User';
    if (user.full_name) return user.full_name;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    if (user.first_name) return user.first_name;
    if (user.emri && user.surname) return `${user.emri} ${user.surname}`;
    if (user.emri) return user.emri;
    if (user.fullName) return user.fullName;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if (user.name) return user.name;
    if (user.username) return user.username;
    if (user.emaili) return user.emaili.split('@')[0];
    if (user.email) return user.email.split('@')[0];
    return 'User';
  }, [user]);

  const getUserId = useCallback(() => {
    return user?.id || user?.user_id || user?.userId || user?.USER_ACCOUNT_ID || 'temp_user';
  }, [user]);

 
  const saveToStorage = useCallback(() => {
    try {
      if (forumMessages.length > 0) {
        localStorage.setItem('chat_forumMessages', JSON.stringify(forumMessages));
      }
      if (aiChatMessages.length > 0) {
        localStorage.setItem('chat_aiChatMessages', JSON.stringify(aiChatMessages));
      }
      localStorage.setItem('chat_activeTab', activeTab);
    } catch (error) {
      console.log('Error saving to storage:', error);
    }
  }, [forumMessages, aiChatMessages, activeTab]);

  
  const loadFromStorage = useCallback(() => {
    try {
      const savedForum = localStorage.getItem('chat_forumMessages');
      const savedAI = localStorage.getItem('chat_aiChatMessages');
      const savedTab = localStorage.getItem('chat_activeTab');
      
      if (savedForum) {
        const parsedForum = JSON.parse(savedForum);
        setForumMessages(parsedForum);
        console.log('Loaded', parsedForum.length, 'forum messages from storage');
      }
      
      if (savedAI) {
        const parsedAI = JSON.parse(savedAI);
        setAiChatMessages(parsedAI);
        console.log('Loaded', parsedAI.length, 'AI messages from storage');
      }

      if (savedTab && ['discussions', 'ai', 'counselors'].includes(savedTab)) {
        setActiveTab(savedTab);
      }
    } catch (error) {
      console.log('Error loading from storage:', error);
    }
  }, []);

 
  useEffect(() => {
    if (forumMessages.length > 0 || aiChatMessages.length > 0) {
      saveToStorage();
    }
  }, [forumMessages, aiChatMessages, saveToStorage]);


  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);


  const loadRealCounselors = useCallback(async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      const possibleToken = user?.token || user?.access_token || user?.accessToken;
      if (isLoggedIn && possibleToken) {
        headers['Authorization'] = `Bearer ${possibleToken}`;
      } else if (user?.id || user?.user_id) {
        headers['X-User-ID'] = user.id || user.user_id;
      }
      
      const response = await fetch(`${API_BASE}/chat/counselors`, { headers });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setCounselors(data.data);
        }
      }
    } catch (error) {
      setCounselors([]);
    }
  }, [user, isLoggedIn, API_BASE]);

  const loadForumMessages = useCallback(async () => {
    try {
      let headers = { 'Content-Type': 'application/json' };
      const possibleToken = user?.token || user?.access_token || user?.accessToken || user?.authToken || user?.jwt;
      
      if (isLoggedIn) {
        if (possibleToken) {
          const token = possibleToken.toString().trim();
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          if (user?.id || user?.user_id) {
            headers['X-User-ID'] = user.id || user.user_id;
            headers['X-User-Name'] = getUserDisplayName();
          }
        }
      }
      
      const response = await fetch(`${API_BASE}/chat/rooms/1/messages?limit=50`, { headers });

      if (response.ok) {
        const data = await response.json();
        const messagesData = data.success ? data.data : (Array.isArray(data) ? data : []);
        
      
        setForumMessages(prevStored => {
          const combinedMessages = [...prevStored];
          
          messagesData.forEach(newMsg => {
            if (!combinedMessages.some(stored => stored.messageId === newMsg.messageId)) {
              combinedMessages.push(newMsg);
            }
          });
          
          return combinedMessages.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
        });
        
        if (messagesData.length > 0) {
          const latestMessage = messagesData[messagesData.length - 1];
          setLastMessageId(latestMessage.messageId);
        }
      }
    } catch (error) {
      console.log('Network error:', error);
    }
  }, [user, isLoggedIn, API_BASE, getUserDisplayName]);

  const handleDiscussionMessage = async (messageText) => {
    const tempMessageId = `temp_${Date.now()}`;
    
    const userMessage = {
      messageId: tempMessageId,
      text: messageText,
      sender: {
        userId: getUserId(),
        username: user?.username || user?.emaili || 'user',
        fullName: getUserDisplayName()
      },
      sentAt: new Date().toISOString(),
      type: 'text',
      replyTo: replyingTo ? replyingTo.messageId : null
    };

    setForumMessages(prev => [...prev, userMessage]);
    setMessages(prev => [...prev, userMessage]);
    setReplyingTo(null);
    setTimeout(scrollToBottom, 100);

    try {
      let headers = { 'Content-Type': 'application/json' };
      const possibleToken = user?.token || user?.access_token || user?.accessToken || user?.authToken || user?.jwt;
      
      if (possibleToken) {
        headers['Authorization'] = `Bearer ${possibleToken}`;
      } else if (user?.id || user?.user_id) {
        headers['X-User-ID'] = user.id || user.user_id;
        headers['X-User-Name'] = getUserDisplayName();
      }
      
      const response = await fetch(`${API_BASE}/chat/rooms/1/messages`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          message_text: messageText,
          sender_name: getUserDisplayName(),
          message_type: 'text'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const realMessage = {
            ...data.data,
            sender: { ...data.data.sender, fullName: getUserDisplayName() }
          };

          setForumMessages(prev => 
            prev.map(msg => msg.messageId === tempMessageId ? realMessage : msg)
          );
          setMessages(prev => 
            prev.map(msg => msg.messageId === tempMessageId ? realMessage : msg)
          );
          setLastMessageId(data.data.messageId);
        }
        setError(null);
      } else {
        setError('Mesazhi u ruajt lokalisht');
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      setError('Mesazhi u ruajt lokalisht');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleAIMessage = async (messageText) => {
    const userMessage = {
      messageId: `user_${Date.now()}`,
      text: messageText,
      sender: {
        username: user?.username || 'student',
        fullName: getUserDisplayName()
      },
      sentAt: new Date(),
      type: 'text'
    };
    
    setAiChatMessages(prev => [...prev, userMessage]);
    setMessages(prev => [...prev, userMessage]);
    scrollToBottom();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/chat/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: messageText,
          conversation_history: aiChatMessages.slice(-6).map(msg => ({
            sender: msg.sender?.username === (user?.username || 'student') ? 'user' : 'assistant',
            text: msg.text
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        
     
        if (data.success && data.data?.botResponse) {
          const botMessage = {
            messageId: `bot_${Date.now()}`,
            text: data.data.botResponse,
            sender: { username: 'CareerBot', fullName: 'CareerBot AI' },
            sentAt: new Date(),
            type: 'text'
          };
          setAiChatMessages(prev => [...prev, botMessage]);
          setMessages(prev => [...prev, botMessage]);
        }
      } else {
        throw new Error('Server error');
      }

    } catch (error) {
      const errorMessage = {
        messageId: `error_${Date.now()}`,
        text: "Gabim në komunikim me AI-në. Provoni përsëri.",
        sender: { username: 'CareerBot', fullName: 'CareerBot AI' },
        sentAt: new Date(),
        type: 'text'
      };
      setAiChatMessages(prev => [...prev, errorMessage]);
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    if (activeTab === 'ai') {
      await handleAIMessage(messageText);
    } else if (activeTab === 'discussions') {
      await handleDiscussionMessage(messageText);
    }

    setTimeout(() => { messageInputRef.current?.focus(); }, 100);
  };


  const selectCounselor = (counselor) => {
    if (!isLoggedIn) {
      setError('Duhet te jeni te kycur per te chatuar me keshillues');
      return;
    }
    setSelectedCounselorData(counselor);
    setShowRealCounselorChat(true);
  };

  const closeCounselorChat = () => {
    setShowRealCounselorChat(false);
    setSelectedCounselorData(null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('sq-AL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const clearStoredMessages = () => {
    localStorage.removeItem('chat_forumMessages');
    localStorage.removeItem('chat_aiChatMessages');
    localStorage.removeItem('chat_activeTab');
    setForumMessages([]);
    setAiChatMessages([]);
    setMessages([]);
    console.log('Chat storage cleared');
  };


  useEffect(() => {
    setIsConnected(true);
    setError(null);
    
    if (isLoggedIn) {
      loadForumMessages();
      loadRealCounselors();
    }
  }, [isLoggedIn, loadForumMessages, loadRealCounselors]);


  useEffect(() => {
    if (activeTab === 'discussions') {
      setMessages(forumMessages);
    } else if (activeTab === 'ai') {
      if (aiChatMessages.length === 0) {
        const welcomeMessage = {
          messageId: 'ai_welcome',
          text: `Pershendetje ${getUserDisplayName()}! Une jam CareerBot, asistenti juaj inteligjent per karriere. Si mund t'ju ndihmoj sot?`,
          sender: { username: 'CareerBot', fullName: 'CareerBot AI' },
          sentAt: new Date(),
          type: 'text'
        };
        setAiChatMessages([welcomeMessage]);
        setMessages([welcomeMessage]);
      } else {
        setMessages(aiChatMessages);
      }
    }
    setTimeout(scrollToBottom, 100);
  }, [activeTab, forumMessages, aiChatMessages, getUserDisplayName]);


  if (showRealCounselorChat && selectedCounselorData) {
    return (
      <div className="error">
        <h3>RealCounselorChat component not ready</h3>
        <p>Counselor chat functionality coming soon...</p>
        <button onClick={closeCounselorChat}>Close</button>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {/* Connection Status */}
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? 'Sistem aktiv' : 'Pa lidhje'}
        {isLoggedIn && <span style={{ marginLeft: '10px' }}>👤 {getUserDisplayName()}</span>}
        
        {/* DEBUG: Clear storage button */}
        {process.env.NODE_ENV === 'development' && (
          <button 
            onClick={clearStoredMessages} 
            style={{ marginLeft: '10px', fontSize: '12px', padding: '2px 6px' }}
            title="Clear stored messages (dev only)"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="chat-container">
        {/* Sidebar */}
        <div className="chat-sidebar">
          <div className="tabs">
            <button
              className={activeTab === 'discussions' ? 'active' : ''}
              onClick={() => {
                setActiveTab('discussions');
                setSelectedCounselor(null);
                setReplyingTo(null);
              }}
            >
              Forum Real
              {isLoggedIn ? (
                <span className="tab-count available">
                  {forumMessages.length > 0 ? forumMessages.length : 'Persistent'}
                </span>
              ) : (
                <span className="tab-count unavailable">Login</span>
              )}
            </button>
            <button
              className={activeTab === 'counselors' ? 'active' : ''}
              onClick={() => {
                setActiveTab('counselors');
                setSelectedCounselor(null);
                setMessages([]);
              }}
            >
              Keshilluesit
              {counselors.filter(c => c.isAvailable).length > 0 && (
                <span className="tab-count available">
                  {counselors.filter(c => c.isAvailable).length}
                </span>
              )}
            </button>
            <button
              className={activeTab === 'ai' ? 'active' : ''}
              onClick={() => {
                setActiveTab('ai');
              }}
            >
              AI Bot
              {aiChatMessages.length > 0 && (
                <span className="tab-count available">{aiChatMessages.length}</span>
              )}
            </button>
          </div>

          {/* Counselor Tab Content */}
          {activeTab === 'counselors' && (
            <div className="tab-content">
              <div className="tab-header">
                <h3>Keshilluesit</h3>
                <p>Zgjidhni nje keshillues per te chatuar</p>
              </div>
              
              <div className="search-container" style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Kerko keshillues..."
                  value={counselorSearch}
                  onChange={(e) => setCounselorSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div className="counselors-list">
                {counselors
                  .filter(counselor => 
                    counselorSearch === '' || 
                    counselor.fullName?.toLowerCase().includes(counselorSearch.toLowerCase()) ||
                    counselor.bio?.toLowerCase().includes(counselorSearch.toLowerCase())
                  )
                  .map(counselor => (
                    <div 
                      key={counselor.id} 
                      className="counselor-item"
                      onClick={() => selectCounselor(counselor)}
                      style={{
                        padding: '12px',
                        border: '2px solid #4caf50',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        cursor: 'pointer',
                        backgroundColor: 'white',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: counselor.isAvailable ? '#4caf50' : '#999',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '14px'
                        }}>
                          {counselor.initials || counselor.fullName?.charAt(0) || '?'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '14px' }}>
                            {counselor.fullName}
                            <span style={{
                              background: '#4caf50',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              marginLeft: '8px'
                            }}>
                              REAL
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                            {counselor.bio || 'Keshillues profesional'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                }
                
                {counselors.length === 0 && (
                  <div className="no-counselors">
                    <div className="no-counselors-icon">👨‍💼</div>
                    <h4>Nuk ka keshillues te disponueshem</h4>
                    <button 
                      className="btn-contact"
                      onClick={loadRealCounselors}
                    >
                      Rifresko nga Databaza
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="chat-main">
          {/* Chat Header */}
          <div className="chat-header">
            <div className="room-info">
              <h3>
                {activeTab === 'discussions' && `Forum Real (${forumMessages.length})`}
                {activeTab === 'ai' && `CareerBot AI (${aiChatMessages.length})`}
                {activeTab === 'counselors' && 'Keshilluesit'}
              </h3>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {activeTab === 'discussions' && '💾 Mesazhet ruhen automatikisht'}
                {activeTab === 'ai' && '🤖 Biseda me AI ruhet automatikisht'}
                {activeTab === 'counselors' && 'Chat real me keshillues'}
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="messages-container">
            {activeTab === 'counselors' && (
              <div className="no-counselors">
                <div className="no-counselors-icon">👨‍💼</div>
                <h4>Zgjidhni nje Keshillues</h4>
                <p>Zgjidhni nje keshillues nga lista per te filluar nje bisede.</p>
              </div>
            )}
            
            {activeTab !== 'counselors' && (
              <div className="messages-list">
                {/* Login prompt for forum */}
                {activeTab === 'discussions' && !isLoggedIn && (
                  <div className="login-prompt" style={{
                    background: '#fff3cd',
                    border: '1px solid #ffeaa7',
                    padding: '16px',
                    margin: '16px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <h4>Forum Real me Databaze</h4>
                    <p>Mesazhet ruhen ne CHAT_MESSAGES dhe jane te perhershme.</p>
                    <p>Duhet te jeni te kycur per te marre pjese.</p>
                    <button onClick={() => window.location.href = '/login'}>
                      Kycuni ne Website
                    </button>
                  </div>
                )}

                {/* Messages */}
                {(isLoggedIn || activeTab !== 'discussions') && messages.map((message, index) => (
                  <div
                    key={message.messageId || index}
                    className={`message ${
                      message.sender?.userId === getUserId() || 
                      message.sender?.username === (user?.username || user?.emaili) ? 'own' : 'other'
                    } ${message.type === 'system' ? 'system' : ''}`}
                  >
                    <div className="message-content">
                      <div className="message-header">
                        <span className="sender-name">
                          {message.sender?.fullName || message.sender?.username || 'User'}
                          {message.sender?.userId === getUserId() && ' (Ju)'}
                        </span>
                        <span className="message-time">
                          {formatTime(message.sentAt)}
                        </span>
                      </div>
                      <div className="message-text">
                        {message.text}
                        {message.messageId?.toString().startsWith('temp_') && (
                          <span style={{ opacity: 0.6, fontSize: '12px' }}> ⏳</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="message other">
                    <div className="message-content">
                      <div className="message-header">
                        <span className="sender-name">CareerBot AI</span>
                      </div>
                      <div className="message-text typing">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          {((activeTab === 'discussions' && isLoggedIn) || activeTab === 'ai') && (
            <form onSubmit={handleSendMessage} className="message-input-form">
              <div className="input-container">
                <input
                  ref={messageInputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={
                    activeTab === 'discussions' ? 
                    `Shkruani si ${getUserDisplayName()}...` : 
                    'Pyet CareerBot-in...'
                  }
                  className="message-input"
                  maxLength={1000}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isLoading}
                  className="send-button"
                >
                  {isLoading ? '⏳' : '📤'} Publiko
                </button>
              </div>
              {activeTab === 'discussions' && isLoggedIn && (
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                  💾 Mesazhet ruhen automatikisht • Real-time • Persistent storage
                </div>
              )}
              {activeTab === 'ai' && (
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                  🤖 AI chat ruhet automatikisht • {aiChatMessages.length} mesazhe ne storage
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;