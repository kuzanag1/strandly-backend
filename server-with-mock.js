const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Resend } = require('resend');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;

// Mock mode configuration
const MOCK_MODE = process.env.NODE_ENV === 'development' || process.env.MOCK_PAYMENTS === 'true';

// Initialize Resend for email delivery
const resend = new Resend(process.env.RESEND_API_KEY);

// Mock database (in-memory for testing)
const mockDatabase = {
  quiz_submissions: new Map(),
  payments: new Map()
};

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://strandly-hair-analysis.netlify.app',
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

// Health check with environment info
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date(),
    service: 'strandly-backend',
    version: '1.0.0',
    mockMode: MOCK_MODE,
    emailService: process.env.RESEND_API_KEY ? 'Connected' : 'Not configured',
    paymentService: MOCK_MODE ? 'Mock Mode' : 'Live Stripe'
  });
});

// QUIZ ENDPOINTS
app.post('/api/quiz/submit', async (req, res) => {
  try {
    const quizData = req.body;
    const quizId = require('uuid').v4();
    
    // Store in mock database
    mockDatabase.quiz_submissions.set(quizId, {
      id: quizId,
      data: quizData,
      payment_status: 'pending',
      status: 'pending',
      created_at: new Date()
    });
    
    console.log(`📝 Quiz submitted: ${quizId}`);
    
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

// PAYMENT ENDPOINTS
app.post('/api/payment/create-checkout', async (req, res) => {
  try {
    const { quizId } = req.body;
    
    if (MOCK_MODE) {
      // Mock checkout session for testing
      const sessionId = 'cs_test_mock_' + Date.now();
      const checkoutUrl = `${process.env.FRONTEND_URL}/payment-success?session_id=${sessionId}&quiz_id=${quizId}`;
      
      console.log(`💳 Mock payment session created: ${sessionId}`);
      
      // Store mock payment
      mockDatabase.payments.set(sessionId, {
        sessionId,
        quizId,
        amount: 2900, // $29.00
        currency: 'usd',
        status: 'pending',
        created_at: new Date()
      });
      
      res.json({ 
        sessionId: sessionId,
        url: checkoutUrl,
        mock: true,
        message: 'Mock payment session created - redirecting to success page'
      });
      
      // Auto-complete the payment after 2 seconds (for testing)
      setTimeout(async () => {
        await processPaymentSuccess(sessionId, quizId);
      }, 2000);
      
    } else {
      // Real Stripe integration would go here
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      
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
        success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&quiz_id=${quizId}`,
        cancel_url: `${process.env.FRONTEND_URL}/quiz`,
        metadata: {
          quizId: quizId
        }
      });

      res.json({ 
        sessionId: session.id,
        url: session.url 
      });
    }
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create payment session',
      details: MOCK_MODE ? 'Mock mode error' : 'Stripe API error'
    });
  }
});

// Payment success verification endpoint
app.post('/api/payment/verify', async (req, res) => {
  try {
    const { sessionId, quizId } = req.body;
    
    if (MOCK_MODE) {
      const payment = mockDatabase.payments.get(sessionId);
      if (payment && payment.status === 'completed') {
        res.json({
          success: true,
          status: 'completed',
          analysisReady: true
        });
      } else {
        res.json({
          success: false,
          status: 'pending',
          message: 'Payment processing...'
        });
      }
    } else {
      // Real Stripe verification would go here
      res.json({
        success: true,
        status: 'completed',
        analysisReady: true
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// MOCK PAYMENT SUCCESS PROCESSING
async function processPaymentSuccess(sessionId, quizId) {
  try {
    console.log(`✅ Processing mock payment success: ${sessionId}`);
    
    // Update payment status
    const payment = mockDatabase.payments.get(sessionId);
    if (payment) {
      payment.status = 'completed';
      payment.completed_at = new Date();
    }
    
    // Update quiz submission
    const quiz = mockDatabase.quiz_submissions.get(quizId);
    if (quiz) {
      quiz.payment_status = 'completed';
      quiz.stripe_session_id = sessionId;
      
      // Generate hair analysis
      const analysis = await generateHairAnalysis(quiz.data);
      quiz.analysis_results = analysis;
      quiz.status = 'completed';
      
      // Send email with results
      if (quiz.data.email) {
        await sendAnalysisEmail(quiz.data.email, analysis);
        console.log(`📧 Analysis email sent to: ${quiz.data.email}`);
      }
    }
    
  } catch (error) {
    console.error('Mock payment processing error:', error);
  }
}

// HAIR ANALYSIS ENGINE (Enhanced)
async function generateHairAnalysis(quizData) {
  const analysis = {
    timestamp: new Date(),
    hairType: determineHairType(quizData),
    scalpHealth: analyzeScalpHealth(quizData),
    damageLevel: assessDamageLevel(quizData),
    recommendations: generateRecommendations(quizData),
    products: suggestProducts(quizData),
    routinePlan: createRoutinePlan(quizData),
    professionalAdvice: generateProfessionalAdvice(quizData)
  };
  
  return analysis;
}

function determineHairType(quizData) {
  const texture = quizData.hair_texture || 'normal';
  const thickness = quizData.hair_thickness || 'medium';
  const curlPattern = quizData.curl_pattern || 'straight';
  const porosity = quizData.hair_porosity || 'normal';
  
  return {
    texture,
    thickness,
    curlPattern,
    porosity,
    classification: `${texture}-${thickness}-${curlPattern}`,
    confidence: 0.85
  };
}

function analyzeScalpHealth(quizData) {
  const issues = [];
  if (quizData.scalp_itchy === 'yes') issues.push('itchiness');
  if (quizData.scalp_flaky === 'yes') issues.push('flakiness');
  if (quizData.scalp_oily === 'yes') issues.push('excess oil');
  if (quizData.scalp_sensitive === 'yes') issues.push('sensitivity');
  
  const severity = issues.length > 3 ? 'severe' : 
                   issues.length > 1 ? 'moderate' : 
                   issues.length > 0 ? 'mild' : 'healthy';
  
  return {
    issues,
    severity,
    recommendation: severity !== 'healthy' ? 
      'Consider scalp-specific treatments' : 
      'Maintain current scalp care routine'
  };
}

function assessDamageLevel(quizData) {
  let damageScore = 0;
  
  // Chemical treatments
  if (quizData.chemical_treatments === 'frequent') damageScore += 4;
  else if (quizData.chemical_treatments === 'occasional') damageScore += 2;
  
  // Heat styling
  if (quizData.heat_styling === 'daily') damageScore += 3;
  else if (quizData.heat_styling === 'frequent') damageScore += 2;
  
  // Hair breakage
  if (quizData.hair_breakage === 'excessive') damageScore += 4;
  else if (quizData.hair_breakage === 'moderate') damageScore += 2;
  
  // Environmental factors
  if (quizData.sun_exposure === 'high') damageScore += 1;
  if (quizData.chlorine_exposure === 'frequent') damageScore += 2;
  
  const level = damageScore > 8 ? 'severe' : 
                damageScore > 4 ? 'moderate' : 
                damageScore > 0 ? 'minimal' : 'healthy';
  
  return {
    score: damageScore,
    level,
    priority: level === 'severe' ? 'immediate attention required' : 
              level === 'moderate' ? 'should be addressed' : 'maintain current care'
  };
}

function generateRecommendations(quizData) {
  const recommendations = [];
  const hairType = determineHairType(quizData);
  const damageLevel = assessDamageLevel(quizData);
  const scalpHealth = analyzeScalpHealth(quizData);
  
  // Texture-based recommendations
  if (hairType.texture === 'fine') {
    recommendations.push('Use lightweight, volumizing products');
    recommendations.push('Avoid heavy oils and thick creams');
  } else if (hairType.texture === 'coarse') {
    recommendations.push('Use rich, moisturizing treatments');
    recommendations.push('Apply leave-in conditioners for manageability');
  }
  
  // Damage-based recommendations
  if (damageLevel.level === 'severe') {
    recommendations.push('Weekly protein treatments to rebuild hair structure');
    recommendations.push('Minimize heat styling and use heat protectants');
    recommendations.push('Consider professional salon treatments');
  } else if (damageLevel.level === 'moderate') {
    recommendations.push('Bi-weekly deep conditioning treatments');
    recommendations.push('Use heat protectants before styling');
  }
  
  // Scalp-based recommendations
  if (scalpHealth.issues.length > 0) {
    recommendations.push('Use gentle, sulfate-free shampoos');
    recommendations.push('Incorporate scalp massages to improve circulation');
    if (scalpHealth.issues.includes('flakiness')) {
      recommendations.push('Try anti-dandruff treatments with zinc pyrithione');
    }
  }
  
  return recommendations;
}

function suggestProducts(quizData) {
  const hairType = determineHairType(quizData);
  const products = [];
  
  // Shampoo recommendations
  if (hairType.texture === 'oily') {
    products.push({
      category: 'Shampoo',
      type: 'Clarifying shampoo',
      frequency: '2-3 times per week',
      ingredients: 'Salicylic acid, tea tree oil',
      avoid: 'Heavy sulfates, parabens'
    });
  } else if (hairType.texture === 'dry') {
    products.push({
      category: 'Shampoo',
      type: 'Moisturizing shampoo',
      frequency: '1-2 times per week',
      ingredients: 'Hyaluronic acid, ceramides',
      avoid: 'Sulfates, alcohol-based products'
    });
  }
  
  // Conditioner recommendations
  products.push({
    category: 'Conditioner',
    type: hairType.thickness === 'fine' ? 'Lightweight conditioner' : 'Rich conditioner',
    frequency: 'Every wash',
    ingredients: hairType.thickness === 'fine' ? 'Panthenol, silk proteins' : 'Shea butter, argan oil',
    avoid: hairType.thickness === 'fine' ? 'Heavy oils, thick creams' : 'Lightweight formulas'
  });
  
  // Treatment recommendations
  const damageLevel = assessDamageLevel(quizData);
  if (damageLevel.level !== 'healthy') {
    products.push({
      category: 'Treatment',
      type: damageLevel.level === 'severe' ? 'Protein treatment' : 'Deep conditioning mask',
      frequency: damageLevel.level === 'severe' ? 'Weekly' : 'Bi-weekly',
      ingredients: damageLevel.level === 'severe' ? 'Keratin, amino acids' : 'Coconut oil, vitamin E',
      avoid: 'Products with harsh chemicals'
    });
  }
  
  return products;
}

function createRoutinePlan(quizData) {
  const hairType = determineHairType(quizData);
  const damageLevel = assessDamageLevel(quizData);
  
  const routine = {
    daily: ['Gentle brushing with wide-tooth comb'],
    weekly: [],
    monthly: ['Professional trim assessment'],
    seasonally: ['Deep cleansing treatment', 'Routine review and adjustment']
  };
  
  // Washing frequency based on hair type
  if (hairType.texture === 'oily') {
    routine.daily.push('Light scalp massage');
    routine.weekly.push('Shampoo 3-4 times', 'Condition after each wash');
  } else if (hairType.texture === 'dry') {
    routine.weekly.push('Shampoo 1-2 times', 'Deep conditioning treatment');
    routine.daily.push('Apply leave-in conditioner to ends');
  } else {
    routine.weekly.push('Shampoo 2-3 times', 'Condition after each wash');
  }
  
  // Damage repair routine
  if (damageLevel.level === 'severe') {
    routine.weekly.push('Protein treatment', 'Oil treatment for ends');
    routine.daily.push('Heat protection if styling');
  } else if (damageLevel.level === 'moderate') {
    routine.weekly.push('Deep conditioning mask');
  }
  
  return routine;
}

function generateProfessionalAdvice(quizData) {
  const advice = [];
  const damageLevel = assessDamageLevel(quizData);
  const scalpHealth = analyzeScalpHealth(quizData);
  
  if (damageLevel.level === 'severe') {
    advice.push('Consider consulting a trichologist for severe damage');
    advice.push('Professional treatments may accelerate recovery');
  }
  
  if (scalpHealth.severity === 'severe') {
    advice.push('Persistent scalp issues may require dermatological consultation');
  }
  
  advice.push('Results typically visible within 4-6 weeks of consistent routine');
  advice.push('Adjust routine based on seasonal changes and lifestyle factors');
  
  return advice;
}

// EMAIL DELIVERY
async function sendAnalysisEmail(email, analysis) {
  try {
    const emailContent = generateEmailContent(analysis);
    
    const { data, error } = await resend.emails.send({
      from: 'Strandly Hair Analysis <analysis@strandly.shop>',
      to: [email],
      subject: '🌟 Your Comprehensive Hair Analysis Results - Strandly',
      html: emailContent
    });

    if (error) {
      console.error('Email sending error:', error);
      return false;
    }

    console.log('Analysis email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Email delivery error:', error);
    return false;
  }
}

function generateEmailContent(analysis) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Hair Analysis Results</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .section { margin-bottom: 30px; }
          .section h2 { color: #667eea; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; }
          .highlight { background-color: #f8f9ff; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
          .recommendation-list { list-style: none; padding: 0; }
          .recommendation-list li { background-color: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 5px; border-left: 3px solid #28a745; }
          .product-card { background-color: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 15px 0; }
          .routine-day { background-color: #e8f4fd; padding: 10px; margin: 5px 0; border-radius: 5px; }
          .footer { background-color: #667eea; color: white; padding: 20px; text-align: center; font-size: 14px; }
          .confidence-score { background-color: #28a745; color: white; padding: 5px 10px; border-radius: 15px; font-weight: bold; }
          .damage-level { padding: 5px 15px; border-radius: 15px; font-weight: bold; color: white; }
          .damage-minimal { background-color: #28a745; }
          .damage-moderate { background-color: #ffc107; color: #333; }
          .damage-severe { background-color: #dc3545; }
          .scalp-healthy { color: #28a745; font-weight: bold; }
          .scalp-mild { color: #ffc107; font-weight: bold; }
          .scalp-moderate { color: #fd7e14; font-weight: bold; }
          .scalp-severe { color: #dc3545; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌟 Your Comprehensive Hair Analysis</h1>
            <p>Personalized insights based on scientific analysis</p>
            <span class="confidence-score">Confidence: ${Math.round(analysis.hairType.confidence * 100)}%</span>
          </div>
          
          <div class="content">
            <div class="section">
              <h2>📊 Hair Type Analysis</h2>
              <div class="highlight">
                <p><strong>Classification:</strong> ${analysis.hairType.classification}</p>
                <p><strong>Texture:</strong> ${analysis.hairType.texture}</p>
                <p><strong>Thickness:</strong> ${analysis.hairType.thickness}</p>
                <p><strong>Curl Pattern:</strong> ${analysis.hairType.curlPattern}</p>
                <p><strong>Porosity Level:</strong> ${analysis.hairType.porosity}</p>
              </div>
            </div>

            <div class="section">
              <h2>🔬 Scalp Health Assessment</h2>
              <p><strong>Status:</strong> <span class="scalp-${analysis.scalpHealth.severity}">${analysis.scalpHealth.severity.toUpperCase()}</span></p>
              ${analysis.scalpHealth.issues.length > 0 ? 
                `<p><strong>Areas to Address:</strong> ${analysis.scalpHealth.issues.join(', ')}</p>` : 
                '<p><strong>Great news!</strong> Your scalp appears to be healthy.</p>'
              }
              <p><strong>Recommendation:</strong> ${analysis.scalpHealth.recommendation}</p>
            </div>

            <div class="section">
              <h2>⚠️ Damage Assessment</h2>
              <p><strong>Damage Level:</strong> <span class="damage-level damage-${analysis.damageLevel.level}">${analysis.damageLevel.level.toUpperCase()}</span></p>
              <p><strong>Damage Score:</strong> ${analysis.damageLevel.score}/12</p>
              <p><strong>Priority:</strong> ${analysis.damageLevel.priority}</p>
            </div>

            <div class="section">
              <h2>💡 Personalized Recommendations</h2>
              <ul class="recommendation-list">
                ${analysis.recommendations.map(rec => `<li>✅ ${rec}</li>`).join('')}
              </ul>
            </div>

            <div class="section">
              <h2>🛍️ Recommended Products</h2>
              ${analysis.products.map(product => `
                <div class="product-card">
                  <h3>${product.category}</h3>
                  <p><strong>Type:</strong> ${product.type}</p>
                  <p><strong>Usage:</strong> ${product.frequency}</p>
                  <p><strong>Key Ingredients:</strong> ${product.ingredients}</p>
                  <p><strong>Avoid:</strong> ${product.avoid}</p>
                </div>
              `).join('')}
            </div>

            <div class="section">
              <h2>📅 Your Custom Hair Care Routine</h2>
              
              <h3>Daily Care</h3>
              <div class="routine-day">
                <ul>
                  ${analysis.routinePlan.daily.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>

              <h3>Weekly Care</h3>
              <div class="routine-day">
                <ul>
                  ${analysis.routinePlan.weekly.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>

              <h3>Monthly Maintenance</h3>
              <div class="routine-day">
                <ul>
                  ${analysis.routinePlan.monthly.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>

              <h3>Seasonal Adjustments</h3>
              <div class="routine-day">
                <ul>
                  ${analysis.routinePlan.seasonally.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>
            </div>

            <div class="section">
              <h2>👨‍⚕️ Professional Advice</h2>
              <div class="highlight">
                ${analysis.professionalAdvice.map(advice => `<p>• ${advice}</p>`).join('')}
              </div>
            </div>

            <div class="section">
              <h2>📞 Next Steps</h2>
              <div class="highlight">
                <p><strong>Implementation Timeline:</strong></p>
                <ul>
                  <li><strong>Week 1-2:</strong> Begin new washing routine and basic products</li>
                  <li><strong>Week 3-4:</strong> Add treatments and assess initial progress</li>
                  <li><strong>Week 5-8:</strong> Fine-tune routine based on hair response</li>
                  <li><strong>Month 3:</strong> Full results evaluation and routine optimization</li>
                </ul>
                <p><strong>Questions?</strong> Reply to this email for personalized follow-up support.</p>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>Thank you for choosing Strandly!</strong></p>
            <p>For additional support, contact us at support@strandly.shop</p>
            <p><em>Analysis generated on ${analysis.timestamp.toLocaleDateString()} at ${analysis.timestamp.toLocaleTimeString()}</em></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Debug endpoint to view current mock data
app.get('/api/debug/data', (req, res) => {
  if (!MOCK_MODE) {
    return res.status(403).json({ error: 'Debug endpoint only available in mock mode' });
  }
  
  res.json({
    mockMode: MOCK_MODE,
    quizSubmissions: Object.fromEntries(mockDatabase.quiz_submissions),
    payments: Object.fromEntries(mockDatabase.payments),
    timestamp: new Date()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Strandly Backend API running on port ${PORT}`);
  console.log(`📧 Email service: ${process.env.RESEND_API_KEY ? 'Connected' : 'Not configured'}`);
  console.log(`💳 Payment service: ${MOCK_MODE ? 'Mock Mode (Testing)' : 'Live Stripe'}`);
  console.log(`🗄️ Database: ${MOCK_MODE ? 'Mock In-Memory' : 'Production PostgreSQL'}`);
  console.log(`🌐 CORS allowed origins: ${process.env.FRONTEND_URL}`);
  
  if (MOCK_MODE) {
    console.log(`🧪 Running in MOCK MODE - perfect for testing payment workflows`);
    console.log(`🔧 Debug endpoint available: http://localhost:${PORT}/api/debug/data`);
  }
});

module.exports = app;