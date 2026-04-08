const axios = require('axios');

class PaystackService {
  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY;
    this.baseURL = 'https://api.paystack.co';
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async initializeTransaction(email, amount, metadata = {}) {
    try {
      const callbackUrl = process.env.PAYSTACK_CALLBACK_URL;
      console.log('Using callback URL:', callbackUrl);
      
      const response = await this.axiosInstance.post('/transaction/initialize', {
        email,
        amount: amount * 100, // Paystack expects amount in kobo
        currency: 'NGN',
        metadata,
        callback_url: callbackUrl,
      });

      return {
        success: true,
        data: response.data.data,
        authorizationUrl: response.data.data.authorization_url,
        reference: response.data.data.reference,
      };
    } catch (error) {
      console.error('Paystack initialization error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Payment initialization failed',
      };
    }
  }

  async verifyTransaction(reference) {
    try {
      const response = await this.axiosInstance.get(`/transaction/verify/${reference}`);
      
      if (response.data.data.status === 'success') {
        return {
          success: true,
          data: response.data.data,
        };
      }
      
      return {
        success: false,
        error: 'Transaction not successful',
      };
    } catch (error) {
      console.error('Paystack verification error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Transaction verification failed',
      };
    }
  }

  verifyWebhook(signature, payload) {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return hash === signature;
  }
}

module.exports = new PaystackService();