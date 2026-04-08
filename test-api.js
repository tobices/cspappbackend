const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
  console.log('Testing email with config:');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('User:', process.env.SMTP_USER);
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    // Send test email (send to your own email)
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: 'biobakutobi@gmail.com', // Change to your email
      subject: 'Test Email from CSPAPP',
      html: '<h1>Hello!</h1><p>This is a test email from your local CSPAPP server.</p>',
    });
    
    console.log('✅ Test email sent! Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Email error:', error.message);
  }
}

testEmail();