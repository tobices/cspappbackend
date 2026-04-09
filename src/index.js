/**
 * CSPAPP Backend - Main Entry Point
 * Church Management System API
 */
const dotenv = require('dotenv');
dotenv.config();
// Import birthday job (this will initialize the scheduler)
require('./jobs/birthdayJob');
// Verify critical environment variables
if (!process.env.MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI is not defined in .env file');
  console.log('Please create a .env file with MONGODB_URI=mongodb://localhost:27017/cspapp');
  process.exit(1);
}

const app = require('./app');
const mongoose = require('mongoose');
const config = require('./config');
const { logger } = require('./utils');
const { initializeServices } = require('./services');


// Global error handlers
process.on('uncaughtException', (error) => {
  logger.error('UNCAUGHT EXCEPTION! 💥', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Start server function
const startServer = async () => {
  try {
    // Initialize services
    initializeServices();
    
    // Start express server
    const server = app.listen(config.serverConfig.port, () => {
      console.log('\n=================================');
      console.log('🎉 CSPAPP BACKEND IS RUNNING! 🎉');
      console.log('=================================');
      console.log(`📍 Environment: ${config.serverConfig.env}`);
      console.log(`🚀 Server URL: http://localhost:${config.serverConfig.port}`);
      console.log(`📚 API Docs: http://localhost:${config.serverConfig.port}/api/docs`);
      console.log(`❤️  Health Check: http://localhost:${config.serverConfig.port}/health`);
      console.log('=================================\n');
      
      logger.info(`Server started on port ${config.serverConfig.port}`, {
        environment: config.serverConfig.env,
        port: config.serverConfig.port,
        apiUrl: `http://localhost:${config.serverConfig.port}/api/v1`
      });
    });
    
    // Handle graceful shutdown
    const gracefulShutdown = async () => {
      logger.info('Received shutdown signal, closing gracefully...');
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await mongoose.connection.close(false);
          logger.info('MongoDB connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error closing MongoDB connection', { error: error.message });
          process.exit(1);
        }
      });
      
      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };
    
    // Handle shutdown signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
    return server;
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('UNHANDLED REJECTION! 💥', { error: error.message, stack: error.stack });
  // Don't exit immediately, give it time to log
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

// Export for testing
module.exports = { startServer };