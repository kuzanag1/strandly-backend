require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 5000;

// Debug environment variables
console.log('🔧 Environment check:');
console.log('  STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Loaded' : '❌ Missing');
console.log('  RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Loaded' : '❌ Missing');

// Validate Stripe key before initializing
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is not set');
  process.exit(1);
}

// Initialize Resend for email delivery
const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory storage for testing (replace with database in production)
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
    service: 'strandly-backend-test',
    version: '1.0.0-test',
    storage: 'in-memory',
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
    
    console.log('✅ Quiz saved to in-memory store');
    
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

// Get quiz submission by ID (for testing)
app.get('/api/quiz/:quizId', (req, res) => {
  const { quizId } = req.params;
  const submission = inMemoryStore.quizSubmissions.get(quizId);
  
  if (!submission) {
    return res.status(404).json({ error: 'Quiz submission not found' });
  }
  
  res.json(submission);
});

// List all quiz submissions (for testing)
app.get('/api/quiz', (req, res) => {
  const submissions = Array.from(inMemoryStore.quizSubmissions.values());
  res.json({
    submissions,
    count: submissions.length
  });
});

// PAYMENT ENDPOINTS
app.post('/api/payment/create-checkout', async (req, res) => {
  try {
    const { quizId } = req.body;
    
    console.log('💳 Creating checkout session for quiz:', quizId);
    
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
      createdAt: new Date()
    });

    console.log('✅ Checkout session created:', session.id);

    res.json({ 
      sessionId: session.id,
      url: session.url 
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
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('🎣 Webhook received:', event.type);

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

  res.json({received: true});
});

// HAIR ANALYSIS ENGINE (Test Version)
async function processHairAnalysis(quizId) {
  try {
    console.log('🧬 Processing hair analysis for quiz:', quizId);
    
    // Get quiz data from memory store
    const submission = inMemoryStore.quizSubmissions.get(quizId);
    if (!submission) {
      throw new Error('Quiz submission not found');
    }
    
    const quizData = submission.data;
    
    // Generate hair analysis using test logic
    const analysis = await generateHairAnalysis(quizData);
    
    // Save analysis results
    submission.analysisResults = analysis;
    submission.status = 'completed';
    submission.updatedAt = new Date();
    inMemoryStore.quizSubmissions.set(quizId, submission);
    
    // Send email with results
    await sendAnalysisEmail(quizData.email, analysis, quizId);
    
    console.log('✅ Hair analysis completed for quiz:', quizId);
    
  } catch (error) {
    console.error('Hair analysis processing error:', error);
  }
}

async function generateHairAnalysis(quizData) {
  // Test hair analysis logic
  const analysis = {
    timestamp: new Date(),
    hairType: determineHairType(quizData),
    scalpHealth: analyzeScalpHealth(quizData),
    damageLevel: assessDamageLevel(quizData),
    recommendations: generateRecommendations(quizData),
    products: suggestProducts(quizData),
    routinePlan: createRoutinePlan(quizData),
    testMode: true
  };
  
  console.log('🔬 Generated analysis for:', quizData.email);
  return analysis;
}

function determineHairType(quizData) {
  const texture = quizData['hair-texture'] || 'normal';
  const thickness = quizData['hair-thickness'] || 'medium';
  const concern = quizData['hair-concern'] || 'general';
  
  return {
    texture,
    thickness,
    primaryConcern: concern,
    classification: `${thickness.toLowerCase().split(' ')[0]}-texture`
  };
}

function analyzeScalpHealth(quizData) {
  const scalpType = quizData['scalp-type'] || 'normal';
  const issues = [];
  
  if (scalpType.includes('oily')) issues.push('excess oil production');
  if (scalpType.includes('dry')) issues.push('dryness');
  if (scalpType.includes('sensitive')) issues.push('sensitivity');
  
  return {
    type: scalpType,
    issues,
    severity: issues.length > 1 ? 'moderate' : issues.length > 0 ? 'mild' : 'healthy'
  };
}

function assessDamageLevel(quizData) {
  const treatments = quizData['chemical-treatments'] || [];
  let damageScore = 0;
  
  if (Array.isArray(treatments)) {
    if (treatments.includes('Bleaching treatments 💫')) damageScore += 3;
    if (treatments.includes('Heat styling regularly 🔥')) damageScore += 2;
    if (treatments.includes('Hair color/highlights ✨')) damageScore += 1;
  }
  
  return {
    score: damageScore,
    level: damageScore > 4 ? 'high' : damageScore > 2 ? 'moderate' : 'low',
    factors: treatments
  };
}

function generateRecommendations(quizData) {
  const recommendations = [
    'Use a gentle, sulfate-free shampoo to protect your hair',
    'Deep condition weekly to maintain moisture balance',
    'Protect hair from heat damage with thermal protectants'
  ];
  
  const concern = quizData['hair-concern'] || '';
  
  if (concern.includes('dry')) {
    recommendations.push('Focus on hydrating treatments and avoid over-washing');
  }
  
  if (concern.includes('greasy')) {
    recommendations.push('Use a clarifying shampoo weekly and avoid heavy conditioning on roots');
  }
  
  return recommendations;
}

function suggestProducts(quizData) {
  return [
    {
      category: 'Shampoo',
      recommendation: 'Gentle, sulfate-free formula for daily use',
      frequency: '2-3 times per week',
      priceRange: '$15-25'
    },
    {
      category: 'Conditioner',
      recommendation: 'Moisturizing, protein-enriched treatment',
      frequency: 'Every wash',
      priceRange: '$18-30'
    },
    {
      category: 'Treatment',
      recommendation: 'Weekly deep conditioning mask',
      frequency: 'Once weekly',
      priceRange: '$25-40'
    }
  ];
}

function createRoutinePlan(quizData) {
  const washFreq = quizData['wash-frequency'] || '2-3 times per week';
  
  return {
    daily: ['Gentle brushing with wide-tooth comb', 'Light scalp massage'],
    washDay: ['Sulfate-free shampoo', 'Moisturizing conditioner', 'Heat protectant if styling'],
    weekly: ['Deep conditioning treatment', 'Scalp exfoliation if needed'],
    frequency: washFreq
  };
}

// EMAIL DELIVERY (Test Version)
async function sendAnalysisEmail(email, analysis, quizId) {
  try {
    const emailContent = generateEmailContent(analysis);
    
    console.log('📧 Preparing to send analysis email to:', email);
    
    // Store email record
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

    console.log('✅ Analysis email sent successfully to:', email);
    
    // Update email record
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
          <h1 style="color: #667eea; font-size: 28px; margin-bottom: 10px;">🌟 Your Strandly Hair Analysis</h1>
          <p style="color: #666; font-size: 16px;">Personalized insights for your unique hair profile</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
          <h2 style="color: #4A90E2; margin-top: 0;">Hair Profile Summary</h2>
          <p><strong>Hair Type:</strong> ${analysis.hairType.classification}</p>
          <p><strong>Primary Concern:</strong> ${analysis.hairType.primaryConcern}</p>
          <p><strong>Scalp Health:</strong> ${analysis.scalpHealth.severity}</p>
          <p><strong>Damage Level:</strong> ${analysis.damageLevel.level}</p>
        </div>
        
        <h2 style="color: #4A90E2;">🎯 Your Personalized Recommendations</h2>
        <ul style="padding-left: 20px;">
          ${analysis.recommendations.map(rec => `<li style="margin-bottom: 8px;">${rec}</li>`).join('')}
        </ul>
        
        <h2 style="color: #4A90E2;">🛍️ Suggested Products</h2>
        ${analysis.products.map(product => `
          <div style="border: 1px solid #e0e0e0; padding: 15px; margin-bottom: 15px; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #333;">${product.category}</h3>
            <p><strong>Recommendation:</strong> ${product.recommendation}</p>
            <p><strong>Usage:</strong> ${product.frequency}</p>
            <p><strong>Price Range:</strong> ${product.priceRange}</p>
          </div>
        `).join('')}
        
        <h2 style="color: #4A90E2;">📅 Your Custom Hair Care Routine</h2>
        <div style="background: #f0f7ff; padding: 20px; border-radius: 10px;">
          <p><strong>Washing Frequency:</strong> ${analysis.routinePlan.frequency}</p>
          
          <h4>Daily Care:</h4>
          <ul>
            ${analysis.routinePlan.daily.map(item => `<li>${item}</li>`).join('')}
          </ul>
          
          <h4>Wash Day Routine:</h4>
          <ul>
            ${analysis.routinePlan.washDay.map(item => `<li>${item}</li>`).join('')}
          </ul>
          
          <h4>Weekly Treatments:</h4>
          <ul>
            ${analysis.routinePlan.weekly.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
        
        <div style="margin-top: 40px; padding: 25px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; text-align: center;">
          <h3 style="margin-top: 0; color: white;">Thank You for Choosing Strandly!</h3>
          <p style="margin-bottom: 0;">Your hair journey is unique, and we're here to support you every step of the way. For questions or additional support, contact us at support@strandly.shop</p>
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
    service: 'strandly-backend-test',
    status: 'operational',
    storage: {
      submissions: inMemoryStore.quizSubmissions.size,
      payments: inMemoryStore.payments.size,
      emails: inMemoryStore.emails.size
    },
    endpoints: [
      'GET /health',
      'POST /api/quiz/submit',
      'GET /api/quiz/:quizId',
      'GET /api/quiz',
      'POST /api/payment/create-checkout',
      'POST /api/payment/webhook',
      'GET /api/test/status'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Strandly Backend TEST server running on port ${PORT}`);
  console.log(`📧 Email service: ${process.env.RESEND_API_KEY ? 'Connected' : 'Not configured'}`);
  console.log(`💳 Payment service: ${process.env.STRIPE_SECRET_KEY ? 'Connected' : 'Not configured'}`);
  console.log(`🗄️ Storage: In-Memory (for testing)`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test/status`);
});

module.exports = app;