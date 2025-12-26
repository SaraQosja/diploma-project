// backend/utils/helpers.js - COMPLETE HELPER UTILITIES FOR CHAT SYSTEM
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class ChatHelpers {
    /**
     * MESSAGE FORMATTING AND VALIDATION
     */
    
    // Sanitize message text
    static sanitizeMessage(text) {
        if (!text || typeof text !== 'string') return '';
        
        return text
            .trim()
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '') // Remove emojis if needed
            .substring(0, 2000); // Limit length
    }

    // Validate message content
    static validateMessage(messageData) {
        const errors = [];
        
        if (!messageData.text || messageData.text.trim().length === 0) {
            errors.push('Mesazhi nuk mund të jetë bosh');
        }
        
        if (messageData.text && messageData.text.length > 2000) {
            errors.push('Mesazhi nuk mund të jetë më shumë se 2000 karaktere');
        }
        
        const validTypes = ['TEXT', 'IMAGE', 'FILE', 'VOICE', 'REPLY', 'SYSTEM'];
        if (messageData.messageType && !validTypes.includes(messageData.messageType)) {
            errors.push('Lloji i mesazhit nuk është i vlefshëm');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Format message for display
    static formatMessage(message) {
        return {
            id: message.id,
            text: this.sanitizeMessage(message.text),
            type: message.type || 'TEXT',
            sentAt: this.formatTimestamp(message.sentAt),
            sender: {
                id: message.sender?.id,
                username: message.sender?.username,
                fullName: message.sender?.fullName,
                profilePicture: message.sender?.profilePicture || '/images/default-avatar.png'
            },
            replyTo: message.replyTo ? {
                id: message.replyTo.id,
                text: message.replyTo.text?.substring(0, 100) + (message.replyTo.text?.length > 100 ? '...' : ''),
                username: message.replyTo.username
            } : null,
            isBot: message.sender?.username === 'CareerBot',
            reactions: message.reactions || []
        };
    }

    /**
     * SESSION MANAGEMENT
     */
    
    // Generate session subject based on content
    static generateSessionSubject(firstMessage, sessionType) {
        if (!firstMessage) {
            return sessionType === 'STUDENT_BOT' ? 'Chat me CareerBot' : 'Sesion këshillimi';
        }
        
        const text = firstMessage.substring(0, 50);
        const keywords = this.extractKeywords(text);
        
        if (keywords.length > 0) {
            return `Pyetje për: ${keywords.slice(0, 3).join(', ')}`;
        }
        
        return text.length > 30 ? text.substring(0, 30) + '...' : text;
    }
    
    // Extract keywords from text
    static extractKeywords(text) {
        const keywords = [];
        const lowerText = text.toLowerCase();
        
        const keywordMap = {
            'universitet': ['universitet', 'university', 'fakultet'],
            'karrierë': ['karrier', 'career', 'punë', 'profesion'],
            'test': ['test', 'provim', 'vlerësim', 'notë'],
            'bursë': ['bursë', 'scholarship', 'financim'],
            'aplikim': ['aplikim', 'application', 'regjistrim'],
            'orientim': ['orientim', 'drejtim', 'këshillë'],
            'aftësi': ['aftësi', 'skill', 'talent'],
            'CV': ['cv', 'curriculum', 'aplikim'],
            'intervistë': ['intervistë', 'interview']
        };
        
        for (const [keyword, variations] of Object.entries(keywordMap)) {
            if (variations.some(variation => lowerText.includes(variation))) {
                keywords.push(keyword);
            }
        }
        
        return keywords;
    }

    /**
     * FILE HANDLING
     */
    
    // Handle file upload for messages
    static async handleFileUpload(file, userId, sessionId) {
        try {
            // Generate unique filename
            const fileExtension = path.extname(file.originalname);
            const fileName = `${Date.now()}_${userId}_${crypto.randomBytes(8).toString('hex')}${fileExtension}`;
            
            // Create upload directory if it doesn't exist
            const uploadDir = path.join(process.cwd(), 'uploads', 'chat', sessionId.toString());
            await fs.mkdir(uploadDir, { recursive: true });
            
            // Save file
            const filePath = path.join(uploadDir, fileName);
            await fs.writeFile(filePath, file.buffer);
            
            // Return file info
            return {
                fileName,
                originalName: file.originalname,
                filePath: `/uploads/chat/${sessionId}/${fileName}`,
                fileSize: file.size,
                mimeType: file.mimetype,
                uploadedAt: new Date()
            };
            
        } catch (error) {
            console.error('Error handling file upload:', error);
            throw new Error('Gabim në ngarkimin e file-it');
        }
    }

    // Validate uploaded file
    static validateFile(file) {
        const errors = [];
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'text/plain',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (!file) {
            errors.push('Asnjë file nuk u zgjodh');
            return { isValid: false, errors };
        }
        
        if (file.size > maxSize) {
            errors.push('File-i është shumë i madh (maksimumi 10MB)');
        }
        
        if (!allowedTypes.includes(file.mimetype)) {
            errors.push('Lloji i file-it nuk është i lejuar');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * TIME AND DATE UTILITIES
     */
    
    // Format timestamp for display
    static formatTimestamp(timestamp) {
        if (!timestamp) return null;
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return 'Tani';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} min më parë`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} orë më parë`;
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} ditë më parë`;
        } else {
            return date.toLocaleDateString('sq-AL', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    // Get time of day greeting
    static getGreeting() {
        const hour = new Date().getHours();
        
        if (hour < 12) {
            return 'Mirëmëngjes';
        } else if (hour < 17) {
            return 'Mirëdita';
        } else {
            return 'Mirëmbrëma';
        }
    }

    /**
     * NOTIFICATION HELPERS
     */
    
    // Generate notification text
    static generateNotificationText(type, data) {
        switch (type) {
            case 'new_message':
                return `${data.senderName}: ${data.messageText?.substring(0, 50)}${data.messageText?.length > 50 ? '...' : ''}`;
            
            case 'session_started':
                return `Sesion i ri i chat-it me ${data.counselorName || 'CareerBot'}`;
            
            case 'session_ended':
                return 'Sesioni i chat-it përfundoi';
            
            case 'counselor_joined':
                return `${data.counselorName} u bashkua në sesion`;
            
            case 'file_shared':
                return `${data.senderName} ndau një file: ${data.fileName}`;
            
            default:
                return 'Njoftim i ri';
        }
    }

    // Send push notification (placeholder for future implementation)
    static async sendPushNotification(userId, title, body, data = {}) {
        // Here you would integrate with Firebase Cloud Messaging or similar service
        console.log(`📱 Push notification to user ${userId}: ${title} - ${body}`);
        
        // For now, just log the notification
        return {
            success: true,
            notificationId: crypto.randomBytes(16).toString('hex'),
            sentAt: new Date()
        };
    }

    /**
     * SEARCH AND FILTERING
     */
    
    // Search messages by content
    static searchMessages(messages, query) {
        if (!query || query.trim() === '') return messages;
        
        const searchTerm = query.toLowerCase().trim();
        
        return messages.filter(message => 
            message.text?.toLowerCase().includes(searchTerm) ||
            message.sender?.fullName?.toLowerCase().includes(searchTerm) ||
            message.sender?.username?.toLowerCase().includes(searchTerm)
        );
    }

    // Filter sessions by criteria
    static filterSessions(sessions, filters) {
        let filtered = sessions;
        
        if (filters.status) {
            filtered = filtered.filter(session => session.status === filters.status);
        }
        
        if (filters.type) {
            filtered = filtered.filter(session => session.sessionType === filters.type);
        }
        
        if (filters.counselorId) {
            filtered = filtered.filter(session => session.counselorId === filters.counselorId);
        }
        
        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            filtered = filtered.filter(session => new Date(session.createdAt) >= fromDate);
        }
        
        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            filtered = filtered.filter(session => new Date(session.createdAt) <= toDate);
        }
        
        return filtered;
    }

    /**
     * BOT RESPONSE HELPERS
     */
    
    // Analyze message for bot response
    static analyzeMessageForBot(messageText) {
        const analysis = {
            intent: 'general',
            entities: [],
            confidence: 0.5,
            keywords: []
        };
        
        const lowerText = messageText.toLowerCase();
        
        // Intent detection
        if (lowerText.includes('universitet') || lowerText.includes('university')) {
            analysis.intent = 'university_info';
            analysis.confidence = 0.8;
        } else if (lowerText.includes('karrier') || lowerText.includes('career')) {
            analysis.intent = 'career_guidance';
            analysis.confidence = 0.8;
        } else if (lowerText.includes('test') || lowerText.includes('provim')) {
            analysis.intent = 'test_help';
            analysis.confidence = 0.8;
        } else if (lowerText.includes('bursë') || lowerText.includes('scholarship')) {
            analysis.intent = 'scholarship_info';
            analysis.confidence = 0.8;
        }
        
        // Extract entities (universities, careers, etc.)
        const universityPattern = /(universiteti|university)\s+([a-zA-ZëçŽ\s]+)/gi;
        const careerPattern = /(inxhinier|mjek|mësues|jurist|ekonomist|arkitekt|informatikan)/gi;
        
        let match;
        while ((match = universityPattern.exec(messageText)) !== null) {
            analysis.entities.push({ type: 'university', value: match[2].trim() });
        }
        
        while ((match = careerPattern.exec(messageText)) !== null) {
            analysis.entities.push({ type: 'career', value: match[0] });
        }
        
        // Extract keywords
        analysis.keywords = this.extractKeywords(messageText);
        
        return analysis;
    }

    // Generate contextual bot response
    static generateContextualResponse(analysis, userProfile = null) {
        const { intent, entities, keywords } = analysis;
        let response = '';
        
        switch (intent) {
            case 'university_info':
                response = this.getUniversityResponse(entities, userProfile);
                break;
            case 'career_guidance':
                response = this.getCareerResponse(entities, userProfile);
                break;
            case 'test_help':
                response = this.getTestResponse(keywords, userProfile);
                break;
            case 'scholarship_info':
                response = this.getScholarshipResponse(userProfile);
                break;
            default:
                response = this.getGeneralResponse();
        }
        
        return response;
    }

    static getUniversityResponse(entities, userProfile) {
        if (entities.length > 0) {
            const university = entities[0].value;
            return `Për ${university}, mund t'ju ndihmoj me informacione të detajuara për programet, kriteret e pranimit dhe afatet. Çfarë aspekti ju intereson më shumë?`;
        }
        
        return `Për universitetet, mund t'ju jap informacione për:
• Programet e studimit dhe fakultetet
• Kriteret e pranimit dhe dokumentacionin
• Afatet e aplikimeve
• Mundësitë e bursave dhe financimit

Në çfarë universiteti keni interes?`;
    }

    static getCareerResponse(entities, userProfile) {
        if (entities.length > 0) {
            const career = entities[0].value;
            return `Karriera si ${career} është një zgjedhje interesante! Mund t'ju ndihmoj me:
• Aftësitë e nevojshme për këtë profesion
• Programet universitare që ju përgatiten
• Mundësitë e punës dhe perspektivat
• Hapat e ardhshëm që duhet të ndiqni

Çfarë ju intereson të dini më shumë?`;
        }
        
        return `Për orientimin e karrierës, mund t'ju ndihmoj me:
• Identifikimin e talenteve dhe interesave tuaja
• Eksplorimin e fushave profesionale
• Planifikimin e rrugës akademike
• Këshilla për zhvillimin profesional

Në çfarë fushe keni më shumë interes?`;
    }

    static getTestResponse(keywords, userProfile) {
        return `Për testet dhe vlerësimet, jam këtu për t'ju ndihmuar me:
• Përgatitjen për teste specifike
• Strategji studimi efikase
• Analizimin e rezultateve
• Përmirësimin e performance-it

Çfarë testi po përgatitni ose çfarë vështirësie keni hasur?`;
    }

    static getScholarshipResponse(userProfile) {
        return `Për bursavo dhe financimin e studimeve:
• Lloje të ndryshme bursash (akademike, sociale, sportive)
• Kriteret dhe procedurat e aplikimit
• Afatet dhe dokumentacioni i nevojshëm
• Këshilla për një aplikim të suksesshëm

A keni në mendje ndonjë lloj specifik burse?`;
    }

    static getGeneralResponse() {
        const responses = [
            `${this.getGreeting()}! Si mund t'ju ndihmoj sot me orientimin tuaj akademik dhe profesional?`,
            'Jam këtu për t\'ju ndihmuar me çdo pyetje që keni për universitetet, karrierën ose zhvillimin tuaj profesional.',
            'Çfarë ju intereson të diskutojmë? Mund të flasim për universitete, teste, karriera ose çdo gjë tjetër që ju shqetëson.',
            'Si mund t\'ju orientoj më mirë? Jam i specializuar në këshilla për zgjedhjen e universitetit dhe planifikimin e karrierës.'
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    /**
     * ERROR HANDLING
     */
    
    // Format error for client
    static formatError(error, context = '') {
        console.error(`Chat Error${context ? ` (${context})` : ''}:`, error);
        
        return {
            success: false,
            message: process.env.NODE_ENV === 'development' 
                ? error.message 
                : 'Ka ndodhur një gabim. Ju lutemi provoni përsëri.',
            timestamp: new Date(),
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        };
    }

    // Validate environment
    static validateEnvironment() {
        const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
        const missing = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }
}

module.exports = ChatHelpers;