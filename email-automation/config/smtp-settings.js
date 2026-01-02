const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.krisskross.ai',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587/others
    auth: {
        user: process.env.EMAIL_ADDRESS || 'hello@krisskross.ai',
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production' // Set to true in production
    }
};

module.exports = { smtpConfig };
