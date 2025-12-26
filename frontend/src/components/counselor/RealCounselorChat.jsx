// frontend/src/components/counselor/RealCounselorChat.jsx 
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import './RealCounselorChat.css';

const RealCounselorChat = ({ counselorId, counselor, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const pollInterval = useRef(null);
  const lastMessageId = useRef(null);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

 
  const getAuthHeaders = useCallback(() => {
    const token = user?.token || user?.access_token || user?.accessToken || user?.jwt;
    console.log('🔑 Using auth token:', token ? 'Found' : 'Missing');
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }, [user]);

  const getUserInfo = useCallback(() => {
    return {
      id: user?.id || user?.userId || user?.USER_ID,
      name: user?.emri ? `${user.emri} ${user.surname || ''}`.trim() : (user?.fullName || user?.name || 'User'),
      initials: user?.emri ? `${user.emri[0]}${user.surname?.[0] || ''}` : (user?.name?.[0] || 'U')
    };
  }, [user]);

 
  const createOrGetRoom = useCallback(async () => {
    if (!counselorId || !user) return null;

    try {
      console.log('🏗️ Creating/getting room with counselor:', counselorId);
      setError(null);
      
      const response = await fetch(`${API_BASE}/counselor/chat/${counselorId}/create-room`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data.roomId) {
        console.log('✅ Room ready:', data.data.roomId);
        setRoomId(data.data.roomId);
        setIsConnected(true);
        return data.data.roomId;
      } else {
        throw new Error(data.message || 'Failed to create room');
      }
    } catch (error) {
      console.error('❌ Error creating room:', error);
      setError(`Failed to connect: ${error.message}`);
      setIsConnected(false);
      return null;
    }
  }, [counselorId, user, API_BASE, getAuthHeaders]);


  const loadRoomMessages = useCallback(async (currentRoomId, silent = false) => {
    if (!currentRoomId) return;

    try {
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }
      
      console.log('📥 Loading messages from room:', currentRoomId);
      
      const response = await fetch(`${API_BASE}/counselor/chat/room/${currentRoomId}/messages?limit=50`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 403) {
          setError('You do not have access to this room');
          return;
        }
        
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`📨 Loaded ${data.data.length} messages`);
        
        const processedMessages = data.data.map(msg => ({
          ...msg,
          isOwn: msg.sender?.userId === getUserInfo().id || msg.senderId === getUserInfo().id,
          initials: msg.sender?.username?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
        }));
        
        setMessages(processedMessages);
        
        if (processedMessages.length > 0) {
          lastMessageId.current = Math.max(...processedMessages.map(m => m.messageId));
        }
        
        if (!silent) {
          setTimeout(scrollToBottom, 100);
        }
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      if (!silent) {
        setError(`Failed to load messages: ${error.message}`);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [API_BASE, getAuthHeaders, getUserInfo]);


  const pollForNewMessages = useCallback(async () => {
    if (!roomId || !isConnected) return;

    try {
      const response = await fetch(`${API_BASE}/counselor/chat/room/${roomId}/messages?limit=10&after=${lastMessageId.current || 0}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
          console.log('🔄 New messages received:', data.data.length);
          
          const newMessages = data.data.filter(newMsg => 
            !messages.some(existingMsg => existingMsg.messageId === newMsg.messageId)
          );
          
          if (newMessages.length > 0) {
            const processedNewMessages = newMessages.map(msg => ({
              ...msg,
              isOwn: msg.sender?.userId === getUserInfo().id || msg.senderId === getUserInfo().id,
              initials: msg.sender?.username?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
            }));
            
            setMessages(prev => [...prev, ...processedNewMessages]);
            lastMessageId.current = Math.max(...data.data.map(m => m.messageId));
            setTimeout(scrollToBottom, 100);
          }
        }
      }
    } catch (error) {
      console.log('📡 Polling error:', error.message);
    }
  }, [roomId, isConnected, messages, API_BASE, getAuthHeaders, getUserInfo]);

  
  const sendMessage = useCallback(async (messageText) => {
    if (!roomId || !messageText.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      console.log('📤 Sending message to room:', roomId);
      
      const userInfo = getUserInfo();
      const tempMessage = {
        messageId: `temp_${Date.now()}`,
        text: messageText.trim(),
        messageText: messageText.trim(),
        type: 'text',
        messageType: 'text',
        sentAt: new Date().toISOString(),
        isOwn: true,
        sender: {
          userId: userInfo.id,
          username: userInfo.name,
          fullName: userInfo.name
        },
        senderId: userInfo.id,
        senderName: userInfo.name,
        initials: userInfo.initials,
        reactions: []
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setTimeout(scrollToBottom, 100);

      const response = await fetch(`${API_BASE}/counselor/chat/room/${roomId}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message_text: messageText.trim(),
          message_type: 'text'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Message sent successfully');
        
      
        setMessages(prev => 
          prev.map(msg => 
            msg.messageId === tempMessage.messageId ? {
              ...data.data,
              isOwn: true,
              initials: userInfo.initials
            } : msg
          )
        );
        
        lastMessageId.current = Math.max(lastMessageId.current || 0, data.data.messageId);
      }
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      setError(`Failed to send: ${error.message}`);
  
      setMessages(prev => prev.filter(msg => !msg.messageId.toString().startsWith('temp_')));
    } finally {
      setIsSending(false);
    }
  }, [roomId, isSending, API_BASE, getAuthHeaders, getUserInfo]);

  useEffect(() => {
    const initializeChat = async () => {
      if (!counselorId || !user) return;
      
      console.log('🚀 Initializing chat with counselor:', counselorId);
      const newRoomId = await createOrGetRoom();
      
      if (newRoomId) {
        await loadRoomMessages(newRoomId);
      }
    };

    initializeChat();
  }, [counselorId, user, createOrGetRoom, loadRoomMessages]);

  useEffect(() => {
    if (isConnected && roomId) {
      console.log('🔄 Starting message polling');
      pollInterval.current = setInterval(pollForNewMessages, 3000);
      
      return () => {
        if (pollInterval.current) {
          clearInterval(pollInterval.current);
          console.log('⏹️ Stopped message polling');
        }
      };
    }
  }, [isConnected, roomId, pollForNewMessages]);

 
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    await sendMessage(messageText);
  
    setTimeout(() => messageInputRef.current?.focus(), 100);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('sq-AL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!counselorId) {
    return (
      <div className="real-counselor-chat">
        <div className="chat-placeholder">
          <div className="placeholder-icon">💬</div>
          <h3>Select a counselor to start chatting</h3>
          <p>Choose an available counselor to begin a real conversation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="real-counselor-chat">
      {/* HEADER */}
      <div className="chat-header">
        <div className="counselor-info">
          <div className="avatar">
            <span>{getUserInitials(counselor?.fullName || 'Counselor')}</span>
            <div className={`status-dot ${isConnected ? 'online' : 'offline'}`}></div>
          </div>
          <div className="info">
            <h3>
              {counselor?.fullName || 'Këshillues'}
              <span className="real-badge">REAL DB</span>
            </h3>
            <p className="status">
              {isConnected ? '🟢 Connected' : '🔴 Connecting...'} - Database Chat
            </p>
          </div>
        </div>
        
        <div className="chat-actions">
          <button 
            className="action-btn" 
            title="Room Info"
            onClick={() => alert(`Room ID: ${roomId}\nCounselor: ${counselor?.fullName}\nMessages: ${messages.length}`)}
          >
            ℹ️
          </button>
          <button className="action-btn" onClick={onClose} title="Close">✕</button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="error-banner">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* MESSAGES */}
      <div className="messages-container">
        {isLoading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <span>Loading real messages from database...</span>
          </div>
        ) : (
          <div className="messages-list">
            {messages.length === 0 ? (
              <div className="welcome-message">
                <div className="welcome-icon">👋</div>
                <h4>Welcome to Real Chat!</h4>
                <p>This is a live database connection with {counselor?.fullName}</p>
                <p>All messages are saved to CHAT_MESSAGES table</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.messageId}
                  className={`message ${message.isOwn ? 'own' : 'other'} ${message.messageType === 'system' ? 'system' : ''}`}
                >
                  <div className="message-wrapper">
                    {!message.isOwn && message.messageType !== 'system' && (
                      <div className="avatar-small">
                        <span>{message.initials}</span>
                      </div>
                    )}
                    
                    <div className="message-content">
                      <div className="message-bubble">
                        <div className="message-text">
                          {message.text || message.messageText}
                        </div>
                        {message.messageType !== 'system' && (
                          <div className="message-time">
                            {formatTime(message.sentAt)}
                            {message.messageId.toString().startsWith('temp_') && (
                              <span className="sending-indicator"> ⏳</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* MESSAGE INPUT */}
      <form onSubmit={handleSendMessage} className="message-input-form">
        <div className="input-container">
          <input
            ref={messageInputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isConnected ? "Type your message..." : "Connecting..."}
            className="message-input"
            maxLength={1000}
            disabled={!isConnected || isSending}
          />
          
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending || !isConnected}
            className="send-button"
            title="Send real message to database"
          >
            {isSending ? '⏳' : '📤'}
          </button>
        </div>
        
        <div className="chat-info">
          💾 Messages saved to CHAT_MESSAGES • 🔄 Real-time polling • Room: {roomId || 'Creating...'}
        </div>
      </form>
    </div>
  );
};

export default RealCounselorChat;