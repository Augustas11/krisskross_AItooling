require('dotenv').config({ path: '.env.local' });

const emailPass = process.env.EMAIL_PASSWORD;
const imapPass = process.env.IMAP_PASSWORD;
const user = process.env.EMAIL_ADDRESS;
const imapHost = process.env.IMAP_HOST;

console.log('User:', user);
console.log('IMAP Host:', imapHost);
console.log('Email Pass defined?', !!emailPass);
if (emailPass) {
    console.log('Email Pass length:', emailPass.length);
    console.log('Email Pass first char:', emailPass[0]);
    console.log('Email Pass last char:', emailPass[emailPass.length - 1]);
}
console.log('IMAP Pass defined?', !!imapPass);
