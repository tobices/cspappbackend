const paystackService = require('./paystackService');
const emailService = require('./emailService');
const smsService = require('./smsService');

module.exports = {
  paystackService,
  emailService,
  smsService,
  
  // Service factory
  getService: (serviceName) => {
    const services = {
      payment: paystackService,
      email: emailService,
      sms: smsService
    };
    return services[serviceName];
  },
  
  // Initialize all services
  initializeServices: () => {
    console.log('Initializing services...');
    // Add any service initialization logic here
    return {
      paystack: paystackService,
      email: emailService,
      sms: smsService
    };
  }
};