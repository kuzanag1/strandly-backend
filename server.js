const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
require('dotenv').config();

// Debug environment variables
console.log('🔍 Environment Variables Debug:');
console.log('STRIPE_SECRET_KEY present:', !!process.env.STRIPE_SECRET_KEY);
console.log('STRIPE_SECRET_KEY length:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 0);
console.log('RESEND_API_KEY present:', !!process.env.RESEND_API_KEY);
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Resend for email delivery
const resend = new Resend(process.env.RESEND_API_KEY);

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://www.strandly.shop',
      'https://strandly.shop',
      'https://strandly-hair-analysis.netlify.app',
      'http://localhost:3000'
    ].filter(Boolean);
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date(),
    service: 'strandly-backend',
    version: '1.0.0'
  });
});

// QUIZ ENDPOINTS - Simplified like Tressence
app.post('/api/quiz/submit', async (req, res) => {
  try {
    const quizData = req.body;
    const quizId = require('uuid').v4();
    
    // Save quiz data to database (with better error handling)
    try {
      const result = await pool.query(
        'INSERT INTO quiz_submissions (id, data, created_at) VALUES ($1, $2, NOW()) RETURNING *',
        [quizId, JSON.stringify(quizData)]
      );
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Continue without database save for now
    }
    
    res.json({
      success: true,
      quizId: quizId,
      message: 'Quiz submitted successfully'
    });
  } catch (error) {
    console.error('Quiz submission error:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// PAYMENT ENDPOINTS - With Mock Mode for Development
app.post('/api/payment/create-checkout', async (req, res) => {
  try {
    const { quizId } = req.body;
    
    console.log('Creating payment session for quizId:', quizId);
    console.log('Mock payments enabled:', !!process.env.MOCK_PAYMENTS);
    
    // Mock payment mode for development/testing
    if (process.env.MOCK_PAYMENTS === 'true') {
      const mockSessionId = 'cs_mock_' + Date.now();
      const mockUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success.html?session_id=${mockSessionId}&quiz_id=${quizId}&mock=true`;
      
      console.log('🧪 Mock payment session created:', mockSessionId);
      
      return res.json({ 
        sessionId: mockSessionId,
        url: mockUrl,
        mock: true
      });
    }
    
    // Real Stripe payment mode
    console.log('Stripe API key available:', !!process.env.STRIPE_SECRET_KEY);
    console.log('Frontend URL:', process.env.FRONTEND_URL);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Professional Hair Analysis',
            description: 'Personalized hair analysis with expert recommendations',
          },
          unit_amount: 2900, // $29.00
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'https://www.strandly.shop'}/success.html?session_id={CHECKOUT_SESSION_ID}&quiz_id=${quizId}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://www.strandly.shop'}/quiz.html`,
      metadata: {
        quizId: quizId
      }
    });

    console.log('Payment session created successfully:', session.id);
    
    res.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Detailed payment creation error:', error.message);
    console.error('Error type:', error.type);
    console.error('Error code:', error.code);
    res.status(500).json({ 
      error: 'Failed to create payment session',
      details: error.message 
    });
  }
});

// Payment Intent - With Mock Mode Support
app.post('/api/payment/create-intent', async (req, res) => {
  try {
    const { quizId, amount = 2900, currency = 'usd' } = req.body;
    
    console.log('Creating payment intent for quizId:', quizId);
    
    // Mock payment mode
    if (process.env.MOCK_PAYMENTS === 'true') {
      const mockClientSecret = 'pi_mock_' + Date.now() + '_secret_mock';
      const mockPaymentIntentId = 'pi_mock_' + Date.now();
      
      console.log('🧪 Mock payment intent created:', mockPaymentIntentId);
      
      return res.json({ 
        clientSecret: mockClientSecret,
        paymentIntentId: mockPaymentIntentId,
        mock: true
      });
    }
    
    // Real Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // $29.00 in cents
      currency: currency,
      metadata: {
        quizId: quizId,
        service: 'hair_analysis'
      },
      description: 'Professional Hair Analysis - Strandly'
    });

    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Payment intent creation error:', error.message);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error.message 
    });
  }
});

// Webhook endpoint - Simplified like Tressence
app.post('/api/stripe/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('Payment completed for session:', session.id);
    
    // Handle successful payment
    try {
      await handlePaymentSuccess(session);
    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  }

  res.json({received: true});
});

async function handlePaymentSuccess(session) {
  const quizId = session.metadata.quizId;
  console.log('Handling payment success for quiz:', quizId);
  
  // Generate and send hair analysis
  try {
    // Get quiz data from database
    const quizResult = await pool.query('SELECT data FROM quiz_submissions WHERE id = $1', [quizId]);
    
    if (quizResult.rows.length > 0) {
      const quizData = quizResult.rows[0].data;
      await generateAndSendAnalysis(session.customer_details.email, quizData);
    }
  } catch (error) {
    console.error('Error in payment success handler:', error);
  }
}

async function generateAndSendAnalysis(email, quizData) {
  console.log('Generating analysis for email:', email);
  
  const analysis = `
Hi there!

Thank you for your Strandly hair analysis purchase. Based on your quiz responses, here's your personalized hair care analysis:

**Your Hair Profile:**
${JSON.stringify(quizData, null, 2)}

**Recommendations:**
• Use sulfate-free shampoo
• Deep condition weekly
• Avoid heat styling when possible
• Use hair oil for extra nourishment

Best regards,
The Strandly Team
  `;
  
  try {
    await resend.emails.send({
      from: 'analysis@strandly.com',
      to: email,
      subject: 'Your Strandly Hair Analysis Results',
      text: analysis
    });
    
    console.log('Analysis email sent to:', email);
  } catch (error) {
    console.error('Failed to send analysis email:', error);
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Stripe configured:', !!process.env.STRIPE_SECRET_KEY);
  console.log('Database URL set:', !!process.env.DATABASE_URL);
});

module.exports = app;