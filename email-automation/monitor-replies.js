require('dotenv').config({ path: '.env.local' });
const { checkForReplies } = require('./reply-checker');

// Default check interval: 5 minutes (300000 ms)
const CHECK_INTERVAL = parseInt(process.env.REPLY_CHECK_INTERVAL || '300000');

console.log(`🕰️ Email Reply Monitor started.`);
console.log(`Checking every ${CHECK_INTERVAL / 1000} seconds...`);

// Initial check immediately
checkForReplies();

// Schedule periodic checks
setInterval(() => {
    checkForReplies();
}, CHECK_INTERVAL);
