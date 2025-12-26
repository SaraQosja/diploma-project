//frontend/src/components/dashboard/ActiveChats.js

import React, { useState, useEffect } from 'react';
import { chatService } from '../../services/api';

const ActiveChats = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveChats();
  }, []);

  const loadActiveChats = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/counselor/active-chats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      } else {
        console.error('Failed to load chats');
        setChats([]);
      }
      
    } catch (error) {
      console.error('Error loading chats:', error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = (chatId) => {

    console.log('Opening chat:', chatId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'waiting': return '#f59e0b';
      case 'ended': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'waiting': return 'Waiting';
      case 'ended': return 'Ended';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="active-chats">
        <div className="chats-header">
          <h3>Active Chats</h3>
        </div>
        <div className="chats-loading">
          <div className="loading-spinner"></div>
          <p>Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="active-chats">
      <div className="chats-header">
        <h3>Active Chats</h3>
        <button className="refresh-btn" onClick={loadActiveChats}>
          ↻ Refresh
        </button>
      </div>

      {chats.length === 0 ? (
        <div className="no-chats">
          <div className="no-chats-icon">💬</div>
          <h4>No active chats</h4>
          <p>Students will appear here when they start chatting with you.</p>
        </div>
      ) : (
        <div className="chats-list">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${chat.unreadCount > 0 ? 'unread' : ''}`}
              onClick={() => handleChatClick(chat.id)}
            >
              <div className="chat-avatar">
                {chat.studentName.charAt(0)}
              </div>
              
              <div className="chat-content">
                <div className="chat-header">
                  <h4 className="student-name">{chat.studentName}</h4>
                  <span 
                    className="chat-status"
                    style={{ color: getStatusColor(chat.status) }}
                  >
                    {getStatusText(chat.status)}
                  </span>
                </div>
                
                <p className="last-message">{chat.lastMessage}</p>
                
                <div className="chat-footer">
                  <span className="timestamp">{chat.timestamp}</span>
                  {chat.unreadCount > 0 && (
                    <span className="unread-badge">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="chats-footer">
        <button className="view-all-btn">
          View All Chat History
        </button>
      </div>
    </div>
  );
};

export default ActiveChats;