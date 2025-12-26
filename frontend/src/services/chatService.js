// frontend/src/services/chatService.js 
import io from 'socket.io-client';

class RealChatService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    this.wsURL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
    this.messageCallbacks = new Map();
    this.statusCallbacks = new Set();
  }

  
  
  setAuthToken(token) {
    this.token = token;
   
    if (token) {
      localStorage.setItem('chat_token', token);
    } else {
      localStorage.removeItem('chat_token');
    }
  }

  getAuthToken() {
    return this.token || localStorage.getItem('chat_token');
  }

  getAuthHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }



  async apiCall(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  }



  async connectWebSocket(token) {
    if (this.socket?.connected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.wsURL, {
          auth: { token },
          transports: ['websocket', 'polling'],
          timeout: 20000,
          forceNew: true,
          autoConnect: true
        });

        this.socket.on('connect', () => {
          console.log('✅ WebSocket connected:', this.socket.id);
          this.isConnected = true;
          this.setupEventHandlers();
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ WebSocket connection failed:', error);
          this.isConnected = false;
          reject(error);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 WebSocket disconnected:', reason);
          this.isConnected = false;
          
         
          if (reason === 'io server disconnect') {
            setTimeout(() => this.connectWebSocket(token), 3000);
          }
        });

        this.socket.on('connection_established', (data) => {
          console.log('📡 Connection established:', data);
        });

      } catch (error) {
        console.error('WebSocket setup failed:', error);
        reject(error);
      }
    });
  }

  setupEventHandlers() {
    if (!this.socket) return;


    this.socket.on('new_message', (data) => {
      console.log('📨 New message received:', data);
      const { roomId, message } = data;
      const callbacks = this.messageCallbacks.get(roomId);
      if (callbacks) {
        callbacks.forEach(callback => callback(message));
      }
    });

    this.socket.on('user_status_change', (data) => {
      console.log('👤 User status change:', data);
      this.statusCallbacks.forEach(callback => callback(data));
    });

   
    this.socket.on('user_joined_room', (data) => {
      console.log('👥 User joined room:', data);
    });

    this.socket.on('user_left_room', (data) => {
      console.log('👋 User left room:', data);
    });

    this.socket.on('user_typing', (data) => {
      console.log('⌨️ User typing:', data);
     
    });


    this.socket.on('message_error', (error) => {
      console.error('Message error:', error);
    });

    this.socket.on('room_error', (error) => {
      console.error('Room error:', error);
    });
  }



  async getChatRooms() {
    try {
      return await this.apiCall('/chat/rooms');
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      throw error;
    }
  }

  async createChatRoom(name, description, type = 'public') {
    try {
      return await this.apiCall('/chat/rooms', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          type,
          is_private: type === 'private'
        })
      });
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  }

  async joinRoom(roomId) {
    try {
      const response = await this.apiCall(`/chat/rooms/${roomId}/join`, {
        method: 'POST'
      });

  
      if (this.socket?.connected) {
        this.socket.emit('join_room', { roomId });
      }

      return response;
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  }

 

  async getRoomMessages(roomId, page = 1, limit = 50) {
    try {
      return await this.apiCall(`/chat/rooms/${roomId}/messages?page=${page}&limit=${limit}`);
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async sendMessage(roomId, messageText, messageType = 'text') {
    try {
   
      const response = await this.apiCall(`/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          message_text: messageText,
          message_type: messageType
        })
      });

      if (this.socket?.connected) {
        this.socket.emit('send_message', {
          roomId,
          text: messageText,
          messageType
        });
      }

      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }


  async sendAIMessage(message) {
    try {
      return await this.apiCall('/chat/ai', {
        method: 'POST',
        body: JSON.stringify({ message })
      });
    } catch (error) {
      console.error('Error sending AI message:', error);
      throw error;
    }
  }

  
  async getAvailableCounselors() {
    try {
      return await this.apiCall('/chat/counselors');
    } catch (error) {
      console.error('Error fetching counselors:', error);
      throw error;
    }
  }

  async requestCounselorSession(counselorId, subject, message) {
    try {
      return await this.apiCall('/chat/counselor/request', {
        method: 'POST',
        body: JSON.stringify({
          counselorId,
          subject,
          message
        })
      });
    } catch (error) {
      console.error('Error requesting counselor session:', error);
      throw error;
    }
  }


  async updateOnlineStatus(status = 'ONLINE') {
    try {
      return await this.apiCall('/chat/status', {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  }

  async getOnlineUsers() {
    try {
      return await this.apiCall('/chat/online-users');
    } catch (error) {
      console.error('Error fetching online users:', error);
      throw error;
    }
  }


  async searchMessages(query, roomId = null) {
    try {
      const params = new URLSearchParams({ q: query });
      if (roomId) params.append('room_id', roomId);
      
      return await this.apiCall(`/chat/search?${params}`);
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }


  async getChatStats() {
    try {
      return await this.apiCall('/chat/stats');
    } catch (error) {
      console.error('Error fetching chat stats:', error);
      throw error;
    }
  }



  onNewMessage(roomId, callback) {
    if (!this.messageCallbacks.has(roomId)) {
      this.messageCallbacks.set(roomId, new Set());
    }
    this.messageCallbacks.get(roomId).add(callback);


    return () => {
      const callbacks = this.messageCallbacks.get(roomId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.messageCallbacks.delete(roomId);
        }
      }
    };
  }

  onUserStatusChange(callback) {
    this.statusCallbacks.add(callback);
    
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  

  startTyping(roomId) {
    if (this.socket?.connected) {
      this.socket.emit('typing_start', { roomId });
    }
  }

  stopTyping(roomId) {
    if (this.socket?.connected) {
      this.socket.emit('typing_stop', { roomId });
    }
  }


  async initialize(token) {
    try {
      this.setAuthToken(token);
      await this.connectWebSocket(token);
      await this.updateOnlineStatus('ONLINE');
      return true;
    } catch (error) {
      console.error('Chat initialization failed:', error);
      throw error;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.messageCallbacks.clear();
    this.statusCallbacks.clear();
  }

  async healthCheck() {
    try {
      return await this.apiCall('/chat/health');
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  get connected() {
    return this.isConnected && this.socket?.connected;
  }

  get connectionId() {
    return this.socket?.id;
  }



  handleError(error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new Error('Nuk mund të lidhet me serverin. Kontrolloni lidhjen dhe provoni përsëri.');
    } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return new Error('Ju nuk jeni të autorizuar. Ju lutemi kyçuni përsëri.');
    } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
      return new Error('Nuk keni të drejtë për këtë veprim.');
    } else if (error.message.includes('404') || error.message.includes('Not Found')) {
      return new Error('Resursi që kërkoni nuk u gjet.');
    } else if (error.message.includes('500')) {
      return new Error('Gabim i brendshëm i serverit. Provoni përsëri më vonë.');
    } else {
      return error;
    }
  }
}


const realChatService = new RealChatService();
export default realChatService;