const { MailSafeProClient } = require('./dist/index.js');

console.log('✅ MailSafeProClient:', typeof MailSafeProClient);

const client = new MailSafeProClient({
  apiKey: 'test_key_12345678901234567890',
});

console.log('✅ Client initialized:', client.version);
console.log('✅ SDK is working!');