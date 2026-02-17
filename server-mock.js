require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 5000;

// Mock Stripe for testing
const mockStripe = {
  checkout: {
    sessions: {
      create: async (params) => {
        const sessionId = 'cs_test_' + Math.random().toString(36).substring(7);
        return {
          id: sessionId,
          url: `https://checkout.stripe.com/pay/${sessionId}`,
          metadata: params.metadata || {},
          mode: params.mode,
          line_items: params.line_items
        };
      }
    }
  },
  webhooks: {
    constructEvent: (body, signature, secret) => {
      // Mock webhook event
      return {
        id: 'evt_test_' + Math.random().toString(36).substring(7),
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_mock',
            metadata: { quizId: 'test-quiz-id' }
          }
        }
      };
    }
  }
};

// Try to initialize real Stripe, fall back to mock
let stripe;
let isUsingMockStripe = false;

async function initializeStripe() {
  try {
    console.log('🔧 Testing Stripe API key...');
    const realStripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Test the key with a simple API call
    await realStripe.products.list({ limit: 1 });
    
    stripe = realStripe;
    isUsingMockStripe = false;
    console.log('✅ Real Stripe API key is valid and working');
    return true;
  } catch (error) {
    console.log('⚠️  Stripe API key test failed:', error.message);
    console.log('🎭 Using mock Stripe for testing instead');
    stripe = mockStripe;
    isUsingMockStripe = true;
    return false;
  }
}

// Initialize Resend for email delivery
const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory storage for testing
const inMemoryStore = {
  quizSubmissions: new Map(),
  payments: new Map(),
  emails: new Map()
};

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date(),
    service: 'strandly-backend-mock',
    version: '1.0.0-mock',
    storage: 'in-memory',
    stripe: isUsingMockStripe ? 'mock' : 'real',
    submissions: inMemoryStore.quizSubmissions.size,
    payments: inMemoryStore.payments.size
  });
});

// QUIZ ENDPOINTS
app.post('/api/quiz/submit', async (req, res) => {
  try {
    const quizData = req.body;
    const quizId = require('uuid').v4();
    
    console.log('📝 Quiz submission received:', {
      quizId,
      email: quizData.email,
      questions: Object.keys(quizData).length
    });
    
    // Save quiz data to in-memory store
    inMemoryStore.quizSubmissions.set(quizId, {
      id: quizId,
      data: quizData,
      paymentStatus: 'pending',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    res.json({
      success: true,
      quizId: quizId,
      message: 'Quiz submitted successfully',
      testMode: true
    });
  } catch (error) {
    console.error('Quiz submission error:', error);
    res.status(500).json({ error: 'Failed to submit quiz', details: error.message });
  }
});

// PAYMENT ENDPOINTS
app.post('/api/payment/create-checkout', async (req, res) => {
  try {
    const { quizId } = req.body;
    
    console.log('💳 Creating checkout session for quiz:', quizId, isUsingMockStripe ? '(MOCK MODE)' : '(REAL STRIPE)');
    
    // Verify quiz exists
    const submission = inMemoryStore.quizSubmissions.get(quizId);
    if (!submission) {
      return res.status(404).json({ error: 'Quiz submission not found' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Professional Hair Analysis by Strandly',
            description: 'Personalized hair analysis with expert recommendations',
          },
          unit_amount: 2900, // $29.00
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'https://strandly-hair-analysis.netlify.app'}/success?session_id={CHECKOUT_SESSION_ID}&quiz_id=${quizId}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://strandly-hair-analysis.netlify.app'}/quiz`,
      metadata: {
        quizId: quizId
      }
    });

    // Store payment session info
    inMemoryStore.payments.set(session.id, {
      sessionId: session.id,
      quizId,
      amount: 2900,
      status: 'pending',
      createdAt: new Date(),
      isMock: isUsingMockStripe
    });

    console.log('✅ Checkout session created:', session.id);

    res.json({ 
      sessionId: session.id,
      url: session.url,
      mockMode: isUsingMockStripe,
      message: isUsingMockStripe ? 'Mock payment session created for testing' : 'Real Stripe payment session created'
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ error: 'Failed to create payment session', details: error.message });
  }
});

app.post('/api/payment/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (isUsingMockStripe) {
      // Mock webhook for testing
      event = {
        id: 'evt_test_' + Date.now(),
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_mock_' + Date.now(),
            metadata: { quizId: 'mock-quiz-id' }
          }
        }
      };
      console.log('🎣 Mock webhook received:', event.type);
    } else {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      console.log('🎣 Real webhook received:', event.type);
    }
  } catch (err) {
    console.error('Webhook processing failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const quizId = session.metadata.quizId;
    
    console.log('💰 Payment completed for quiz:', quizId);
    
    // Update payment status in memory
    if (inMemoryStore.payments.has(session.id)) {
      const payment = inMemoryStore.payments.get(session.id);
      payment.status = 'completed';
      payment.completedAt = new Date();
      inMemoryStore.payments.set(session.id, payment);
    }
    
    // Update quiz submission status
    if (inMemoryStore.quizSubmissions.has(quizId)) {
      const submission = inMemoryStore.quizSubmissions.get(quizId);
      submission.paymentStatus = 'completed';
      submission.stripeSessionId = session.id;
      submission.status = 'processing';
      submission.updatedAt = new Date();
      inMemoryStore.quizSubmissions.set(quizId, submission);
      
      // Trigger hair analysis and email sending
      processHairAnalysis(quizId);
    }
  }

  res.json({received: true, mockMode: isUsingMockStripe});
});

// Mock payment completion endpoint for testing
app.post('/api/test/complete-payment', async (req, res) => {
  if (!isUsingMockStripe) {
    return res.status(400).json({ error: 'Only available in mock mode' });
  }
  
  const { sessionId } = req.body;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId required' });
  }
  
  const payment = inMemoryStore.payments.get(sessionId);
  if (!payment) {
    return res.status(404).json({ error: 'Payment session not found' });
  }
  
  console.log('🧪 Simulating payment completion for session:', sessionId);
  
  // Simulate the webhook
  const mockEvent = {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: sessionId,
        metadata: { quizId: payment.quizId }
      }
    }
  };
  
  // Process the mock webhook
  const session = mockEvent.data.object;
  const quizId = session.metadata.quizId;
  
  // Update payment status
  payment.status = 'completed';
  payment.completedAt = new Date();
  inMemoryStore.payments.set(sessionId, payment);
  
  // Update quiz submission
  if (inMemoryStore.quizSubmissions.has(quizId)) {
    const submission = inMemoryStore.quizSubmissions.get(quizId);
    submission.paymentStatus = 'completed';
    submission.stripeSessionId = sessionId;
    submission.status = 'processing';
    submission.updatedAt = new Date();
    inMemoryStore.quizSubmissions.set(quizId, submission);
    
    // Process analysis
    processHairAnalysis(quizId);
  }
  
  res.json({
    success: true,
    message: 'Mock payment completed and analysis triggered',
    quizId,
    sessionId
  });
});

// HAIR ANALYSIS ENGINE (same as before)
async function processHairAnalysis(quizId) {
  try {
    console.log('🧬 Processing hair analysis for quiz:', quizId);
    
    const submission = inMemoryStore.quizSubmissions.get(quizId);
    if (!submission) {
      throw new Error('Quiz submission not found');
    }
    
    const quizData = submission.data;
    const analysis = await generateHairAnalysis(quizData);
    
    submission.analysisResults = analysis;
    submission.status = 'completed';
    submission.updatedAt = new Date();
    inMemoryStore.quizSubmissions.set(quizId, submission);
    
    await sendAnalysisEmail(quizData.email, analysis, quizId);
    
    console.log('✅ Hair analysis completed for quiz:', quizId);
    
  } catch (error) {
    console.error('Hair analysis processing error:', error);
  }
}

async function generateHairAnalysis(quizData) {
  return {
    timestamp: new Date(),
    hairType: {
      texture: quizData['hair-texture'] || 'normal',
      thickness: quizData['hair-thickness'] || 'medium',
      primaryConcern: quizData['hair-concern'] || 'general',
      classification: 'medium-texture'
    },
    scalpHealth: {
      type: quizData['scalp-type'] || 'normal',
      issues: [],
      severity: 'healthy'
    },
    damageLevel: {
      score: 2,
      level: 'moderate',
      factors: quizData['chemical-treatments'] || []
    },
    recommendations: [
      'Use a gentle, sulfate-free shampoo to protect your hair',
      'Deep condition weekly to maintain moisture balance',
      'Protect hair from heat damage with thermal protectants'
    ],
    products: [
      {
        category: 'Shampoo',
        recommendation: 'Gentle, sulfate-free formula for daily use',
        frequency: '2-3 times per week',
        priceRange: '$15-25'
      }
    ],
    routinePlan: {
      daily: ['Gentle brushing with wide-tooth comb'],
      washDay: ['Sulfate-free shampoo', 'Moisturizing conditioner'],
      weekly: ['Deep conditioning treatment'],
      frequency: quizData['wash-frequency'] || '2-3 times per week'
    },
    testMode: true
  };
}

async function sendAnalysisEmail(email, analysis, quizId) {
  try {
    const emailContent = generateEmailContent(analysis);
    
    console.log('📧 Sending analysis email to:', email);
    
    const emailId = require('uuid').v4();
    inMemoryStore.emails.set(emailId, {
      id: emailId,
      quizId,
      email,
      status: 'sending',
      sentAt: new Date()
    });

    const { data, error } = await resend.emails.send({
      from: 'Strandly Hair Analysis <noreply@strandly.shop>',
      to: [email],
      subject: '🌟 Your Personalized Hair Analysis Results - Strandly',
      html: emailContent
    });

    if (error) {
      console.error('Email sending error:', error);
      const emailRecord = inMemoryStore.emails.get(emailId);
      emailRecord.status = 'failed';
      emailRecord.error = error;
      inMemoryStore.emails.set(emailId, emailRecord);
      return false;
    }

    console.log('✅ Analysis email sent successfully');
    
    const emailRecord = inMemoryStore.emails.get(emailId);
    emailRecord.status = 'sent';
    emailRecord.resendId = data.id;
    inMemoryStore.emails.set(emailId, emailRecord);
    
    return true;
  } catch (error) {
    console.error('Email delivery error:', error);
    return false;
  }
}

function generateEmailContent(analysis) {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #667eea;">🌟 Your Strandly Hair Analysis</h1>
          <p style="color: #666;">Personalized insights for your unique hair profile</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
          <h2 style="color: #4A90E2;">Hair Profile Summary</h2>
          <p><strong>Hair Type:</strong> ${analysis.hairType.classification}</p>
          <p><strong>Primary Concern:</strong> ${analysis.hairType.primaryConcern}</p>
          <p><strong>Damage Level:</strong> ${analysis.damageLevel.level}</p>
        </div>
        
        <h2 style="color: #4A90E2;">🎯 Your Personalized Recommendations</h2>
        <ul>
          ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
        
        <div style="margin-top: 40px; padding: 25px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; text-align: center;">
          <h3 style="margin-top: 0; color: white;">Thank You for Choosing Strandly!</h3>
          <p style="margin-bottom: 0;">Your personalized hair analysis is complete. For questions, contact support@strandly.shop</p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>Analysis generated on ${new Date().toLocaleDateString()}</p>
          ${analysis.testMode ? '<p><em>This is a test mode analysis</em></p>' : ''}
        </div>
      </body>
    </html>
  `;
}

// Test endpoints
app.get('/api/test/status', (req, res) => {
  res.json({
    service: 'strandly-backend-mock',
    status: 'operational',
    stripe: isUsingMockStripe ? 'mock' : 'real',
    storage: {
      submissions: inMemoryStore.quizSubmissions.size,
      payments: inMemoryStore.payments.size,
      emails: inMemoryStore.emails.size
    },
    endpoints: [
      'GET /health',
      'POST /api/quiz/submit',
      'POST /api/payment/create-checkout',
      'POST /api/payment/webhook',
      'POST /api/test/complete-payment (mock only)',
      'GET /api/test/status'
    ]
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Strandly Backend MOCK server running on port ${PORT}`);
  console.log(`📧 Email service: ${process.env.RESEND_API_KEY ? 'Connected' : 'Not configured'}`);
  
  // Initialize Stripe (real or mock)
  await initializeStripe();
  
  console.log(`💳 Payment service: ${isUsingMockStripe ? 'Mock Stripe (for testing)' : 'Real Stripe'}`);
  console.log(`🗄️ Storage: In-Memory (for testing)`);
  console.log(`🧪 Test endpoints: http://localhost:${PORT}/api/test/status`);
  if (isUsingMockStripe) {
    console.log(`🎭 Use POST /api/test/complete-payment to simulate payment completion`);
  }
});

module.exports = app;