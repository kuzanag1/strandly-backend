require('dotenv').config();

console.log('Environment variables check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Loaded (sk_test_...)' : '❌ Not loaded');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Loaded (re_...)' : '❌ Not loaded');

// Test Stripe initialization
try {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  console.log('Stripe initialization: ✅ Success');
} catch (error) {
  console.log('Stripe initialization: ❌ Failed -', error.message);
}