require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

console.log('Testing Stripe API key...');
console.log('Key length:', process.env.STRIPE_SECRET_KEY?.length || 0);
console.log('Key prefix:', process.env.STRIPE_SECRET_KEY?.substring(0, 12) || 'undefined');

async function testStripe() {
  try {
    // Test a simple API call
    const products = await stripe.products.list({ limit: 1 });
    console.log('✅ Stripe API key is valid!');
    console.log('Test call succeeded:', products.object);
  } catch (error) {
    console.log('❌ Stripe API test failed:', error.message);
    console.log('Error type:', error.type);
    console.log('Error code:', error.code);
  }
}

testStripe();