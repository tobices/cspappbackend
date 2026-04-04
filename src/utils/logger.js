const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// Get current timestamp
const getTimestamp = () => {
  return new Date().toISOString();
};

// Write to log file
const writeToFile = (level, message, meta = {}) => {
  const logEntry = {
    timestamp: getTimestamp(),
    level,
    message,
    ...meta
  };
  
  const logString = JSON.stringify(logEntry) + '\n';
  const fileName = `${new Date().toISOString().split('T')[0]}.log`;
  const filePath = path.join(logsDir, fileName);
  
  fs.appendFile(filePath, logString, (err) => {
    if (err) console.error('Error writing to log file:', err);
  });
  
  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    const color = level === 'error' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : '\x1b[32m';
    console.log(`${color}[${level.toUpperCase()}]\x1b[0m`, message, meta);
  }
};

// Logger methods
const logger = {
  error: (message, meta = {}) => {
    writeToFile('error', message, meta);
  },
  
  warn: (message, meta = {}) => {
    writeToFile('warn', message, meta);
  },
  
  info: (message, meta = {}) => {
    writeToFile('info', message, meta);
  },
  
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      writeToFile('debug', message, meta);
    }
  },
  
  // Log API requests
  api: (req, res, responseTime) => {
    logger.info(`${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  },
  
  // Log database operations
  db: (operation, collection, filter = {}) => {
    logger.debug(`Database ${operation}`, {
      operation,
      collection,
      filter
    });
  },
  
  // Log payment events
  payment: (event, data) => {
    logger.info(`Payment: ${event}`, {
      event,
      ...data
    });
  },
  
  // Log communication events
  communication: (type, recipients, status) => {
    logger.info(`Communication: ${type}`, {
      type,
      recipientsCount: recipients?.length,
      status
    });
  }
};

module.exports = logger;