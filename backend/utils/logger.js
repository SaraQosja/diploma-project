// backend/utils/logger.js
// Simple logger për WebSocket system

class Logger {
    static info(message, ...args) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] INFO:`, message, ...args);
    }

    static error(message, ...args) {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] ERROR:`, message, ...args);
    }

    static warn(message, ...args) {
        const timestamp = new Date().toISOString();
        console.warn(`[${timestamp}] WARN:`, message, ...args);
    }

    static debug(message, ...args) {
        if (process.env.NODE_ENV === 'development') {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] DEBUG:`, message, ...args);
        }
    }
}

module.exports = Logger;