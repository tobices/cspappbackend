const axios = require('axios');

class SmsService {
  constructor() {
    this.apiKey = process.env.HOLLATAGS_API_KEY;
    this.username = process.env.HOLLATAGS_USERNAME;
    this.senderId = process.env.HOLLATAGS_SENDER_ID;
    this.baseURL = process.env.HOLLATAGS_BASE_URL;
  }

  // Send single SMS
  async sendSMS(phoneNumber, message) {
    try {
      // Clean phone number (remove spaces and special chars)
      const cleanNumber = phoneNumber.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
      
      const payload = {
        username: this.username,
        api_key: this.apiKey,
        to: cleanNumber,
        from: this.senderId,
        sms: message,
        type: '0', // 0 = normal SMS
      };

      const response = await axios.post(`${this.baseURL}/send`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      console.log(`SMS sent to ${cleanNumber}:`, response.data);
      
      return {
        success: true,
        data: response.data,
        messageId: response.data.message_id
      };
    } catch (error) {
      console.error('SMS sending error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'SMS sending failed'
      };
    }
  }

  // Send bulk SMS
  async sendBulkSMS(phoneNumbers, message) {
    try {
      const results = [];
      // Send to each number (HollaTags might support batch, sending individually for reliability)
      for (const phoneNumber of phoneNumbers) {
        const result = await this.sendSMS(phoneNumber, message);
        results.push({ phoneNumber, ...result });
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return {
        success: true,
        results,
        totalSent: results.filter(r => r.success).length,
        totalFailed: results.filter(r => !r.success).length
      };
    } catch (error) {
      console.error('Bulk SMS error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send donation confirmation SMS
  async sendDonationConfirmation(user, donation) {
    const message = `Thank you ${user.fullName} for your ${donation.purpose} donation of ₦${donation.amount.toLocaleString()}. God bless you! - CSPAPP Church`;
    return await this.sendSMS(user.phoneNumber, message);
  }

  // Send event reminder SMS
  async sendEventReminder(user, event) {
    const message = `Reminder: ${event.title} today at ${event.time} at ${event.venue}. Don't be late! - CSPAPP Church`;
    return await this.sendSMS(user.phoneNumber, message);
  }

  // Send birthday SMS
  async sendBirthdaySMS(user) {
    const message = `Happy Birthday ${user.fullName}! May God's blessings be upon you today and always. - CSPAPP Church`;
    return await this.sendSMS(user.phoneNumber, message);
  }

  // Send verification SMS
  async sendVerificationCode(phoneNumber, code) {
    const message = `Your CSPAPP verification code is: ${code}. Valid for 10 minutes.`;
    return await this.sendSMS(phoneNumber, message);
  }
}

module.exports = new SmsService();