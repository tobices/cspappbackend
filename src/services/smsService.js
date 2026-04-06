const axios = require('axios');
const querystring = require('querystring');

class SmsService {
  constructor() {
    this.username = process.env.HOLLATAGS_USERNAME;
    this.password = process.env.HOLLATAGS_PASSWORD;
    this.senderId = process.env.HOLLATAGS_SENDER_ID;
    this.baseURL = 'https://sms.hollatags.com/api';
    
    console.log('SMS Service Config:', {
      username: this.username,
      senderId: this.senderId,
      hasPassword: !!this.password
    });
  }

  async sendSMS(phoneNumber, message, options = {}) {
    try {
      // Clean phone number
      let cleanNumber = phoneNumber.toString().replace(/\D/g, '');
      if (cleanNumber.startsWith('0')) {
        cleanNumber = '234' + cleanNumber.substring(1);
      } else if (!cleanNumber.startsWith('234')) {
        cleanNumber = '234' + cleanNumber;
      }
      
      // Create form data with ONLY the required fields
      const formData = {
        user: this.username,
        pass: this.password,
        from: this.senderId,
        to: cleanNumber,
        msg: message
      };

      // DO NOT add any extra fields like 'subject'

      console.log('Sending SMS:', {
        to: cleanNumber,
        msgLength: message.length
      });

      const response = await axios.post(
        `${this.baseURL}/send`,
        querystring.stringify(formData),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 30000
        }
      );

      console.log('API Response:', response.data);
      
      if (response.data === 'sent') {
        return {
          success: true,
          message: 'SMS sent successfully',
          data: response.data
        };
      }
      
      if (response.data === 'error_param') {
        return {
          success: false,
          error: 'Invalid parameters. Check phone number format and credentials.'
        };
      }
      
      return {
        success: true,
        data: response.data
      };
      
    } catch (error) {
      console.error('SMS Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendBulkSMS(phoneNumbers, message) {
    const results = [];
    let successCount = 0;
    
    for (const number of phoneNumbers) {
      const result = await this.sendSMS(number, message);
      results.push(result);
      if (result.success) successCount++;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return {
      success: successCount > 0,
      totalSent: successCount,
      totalAttempted: phoneNumbers.length,
      results
    };
  }

  async checkBalance() {
    try {
      const formData = {
        user: this.username,
        pass: this.password,
      };
      
      const response = await axios.post(
        `${this.baseURL}/credit`,
        querystring.stringify(formData),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        }
      );
      
      return {
        success: true,
        balance: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendBirthdaySMS(user) {
    const message = `Happy Birthday ${user.fullName}! May God's blessings be upon you today. - CSPAPP Church`;
    return await this.sendSMS(user.phoneNumber, message);
  }

  async sendDonationConfirmation(user, donation) {
    const message = `Thank you ${user.fullName} for your ${donation.purpose} of ₦${donation.amount.toLocaleString()}. God bless you! - CSPAPP Church`;
    return await this.sendSMS(user.phoneNumber, message);
  }

  async sendWelcomeSMS(user) {
    const message = `Welcome to CSPAPP Church ${user.fullName}! We're excited to have you. God bless you!`;
    return await this.sendSMS(user.phoneNumber, message);
  }

  async sendEventReminder(user, event) {
    const message = `Reminder: ${event.title} at ${event.venue}. God bless you! - CSPAPP Church`;
    return await this.sendSMS(user.phoneNumber, message);
  }
}

module.exports = new SmsService();