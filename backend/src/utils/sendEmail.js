const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create a transporter using your SMTP credentials
    // Note: In production, configure these in .env
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
        port: process.env.SMTP_PORT || 2525,
        auth: {
            user: process.env.SMTP_EMAIL || 'your_smtp_user',
            pass: process.env.SMTP_PASSWORD || 'your_smtp_pass'
        }
    });

    const message = {
        from: `${process.env.FROM_NAME || 'Youth Action Network'} <${process.env.FROM_EMAIL || 'noreply@yanrwanda.org'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    const info = await transporter.sendMail(message);

    console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;
