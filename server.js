const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');
require('dotenv').config();

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
    service: 'strandly-backend',
    version: '1.0.0'
  });
});

// QUIZ ENDPOINTS
app.post('/api/quiz/submit', async (req, res) => {
  try {
    const quizData = req.body;
    const quizId = require('uuid').v4();
    
    // Save quiz data to database
    const result = await pool.query(
      'INSERT INTO quiz_submissions (id, data, created_at) VALUES ($1, $2, NOW()) RETURNING *',
      [quizId, JSON.stringify(quizData)]
    );
    
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
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}&quiz_id=${quizId}`,
      cancel_url: `${process.env.FRONTEND_URL}/quiz`,
      metadata: {
        quizId: quizId
      }
    });

    res.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ error: 'Failed to create payment session' });
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const quizId = session.metadata.quizId;
    
    // Mark payment as completed and trigger analysis
    await pool.query(
      'UPDATE quiz_submissions SET payment_status = $1, stripe_session_id = $2 WHERE id = $3',
      ['completed', session.id, quizId]
    );
    
    // Trigger hair analysis and email sending
    await processHairAnalysis(quizId);
  }

  res.json({received: true});
});

// HAIR ANALYSIS ENGINE
async function processHairAnalysis(quizId) {
  try {
    // Get quiz data from database
    const quizResult = await pool.query('SELECT * FROM quiz_submissions WHERE id = $1', [quizId]);
    const quizData = JSON.parse(quizResult.rows[0].data);
    
    // Generate hair analysis using AI (placeholder for now)
    const analysis = await generateHairAnalysis(quizData);
    
    // Save analysis results
    await pool.query(
      'UPDATE quiz_submissions SET analysis_results = $1, status = $2 WHERE id = $3',
      [JSON.stringify(analysis), 'completed', quizId]
    );
    
    // Send email with results
    await sendAnalysisEmail(quizData.email, analysis);
    
  } catch (error) {
    console.error('Hair analysis processing error:', error);
  }
}

async function generateHairAnalysis(quizData) {
  // Hair Analysis AI Logic (based on quiz responses)
  const analysis = {
    hairType: determineHairType(quizData),
    scalpHealth: analyzeScalpHealth(quizData),
    damageLevel: assessDamageLevel(quizData),
    recommendations: generateRecommendations(quizData),
    products: suggestProducts(quizData),
    routinePlan: createRoutinePlan(quizData)
  };
  
  return analysis;
}

function determineHairType(quizData) {
  // Logic based on texture, thickness, curl pattern
  const texture = quizData.texture || 'normal';
  const thickness = quizData.thickness || 'medium';
  const curlPattern = quizData.curlPattern || 'straight';
  
  return {
    texture,
    thickness,
    curlPattern,
    classification: `${texture}-${thickness}-${curlPattern}`
  };
}

function analyzeScalpHealth(quizData) {
  const issues = [];
  if (quizData.scalp_itchy === 'yes') issues.push('itchiness');
  if (quizData.scalp_flaky === 'yes') issues.push('flakiness');
  if (quizData.scalp_oily === 'yes') issues.push('excess oil');
  
  return {
    issues,
    severity: issues.length > 2 ? 'high' : issues.length > 0 ? 'moderate' : 'healthy'
  };
}

function assessDamageLevel(quizData) {
  let damageScore = 0;
  if (quizData.chemical_treatments === 'frequent') damageScore += 3;
  if (quizData.heat_styling === 'daily') damageScore += 2;
  if (quizData.hair_breakage === 'excessive') damageScore += 3;
  
  return {
    score: damageScore,
    level: damageScore > 5 ? 'severe' : damageScore > 2 ? 'moderate' : 'minimal'
  };
}

function generateRecommendations(quizData) {
  const recommendations = [];
  
  if (quizData.scalp_issues) {
    recommendations.push('Use gentle, sulfate-free shampoos');
    recommendations.push('Incorporate scalp massages to improve circulation');
  }
  
  if (quizData.damage_level === 'high') {
    recommendations.push('Deep conditioning treatments 2-3 times per week');
    recommendations.push('Minimize heat styling and use heat protectants');
  }
  
  return recommendations;
}

function suggestProducts(quizData) {
  // Product recommendations based on analysis
  return [
    {
      category: 'Shampoo',
      recommendation: 'Gentle, sulfate-free formula',
      frequency: '2-3 times per week'
    },
    {
      category: 'Conditioner',
      recommendation: 'Moisturizing, protein-enriched',
      frequency: 'Every wash'
    },
    {
      category: 'Treatment',
      recommendation: 'Deep conditioning mask',
      frequency: 'Weekly'
    }
  ];
}

function createRoutinePlan(quizData) {
  return {
    daily: ['Gentle brushing', 'Scalp massage if needed'],
    weekly: ['Deep conditioning treatment', 'Clarifying wash if oily'],
    monthly: ['Professional trim assessment', 'Product routine review']
  };
}

// EMAIL DELIVERY
async function sendAnalysisEmail(email, analysis) {
  try {
    const emailContent = generateEmailContent(analysis);
    
    const { data, error } = await resend.emails.send({
      from: 'Strandly Hair Analysis <noreply@strandly.shop>',
      to: [email],
      subject: '🌟 Your Personalized Hair Analysis Results - Strandly',
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
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4A90E2;">🌟 Your Personalized Hair Analysis</h1>
          
          <h2>Hair Type Analysis</h2>
          <p><strong>Classification:</strong> ${analysis.hairType.classification}</p>
          <p><strong>Texture:</strong> ${analysis.hairType.texture}</p>
          <p><strong>Thickness:</strong> ${analysis.hairType.thickness}</p>
          
          <h2>Scalp Health Assessment</h2>
          <p><strong>Status:</strong> ${analysis.scalpHealth.severity}</p>
          ${analysis.scalpHealth.issues.length > 0 ? 
            `<p><strong>Areas to Address:</strong> ${analysis.scalpHealth.issues.join(', ')}</p>` : ''}
          
          <h2>Damage Level</h2>
          <p><strong>Assessment:</strong> ${analysis.damageLevel.level} damage</p>
          
          <h2>Personalized Recommendations</h2>
          <ul>
            ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
          
          <h2>Suggested Routine</h2>
          <h3>Daily:</h3>
          <ul>
            ${analysis.routinePlan.daily.map(item => `<li>${item}</li>`).join('')}
          </ul>
          
          <h3>Weekly:</h3>
          <ul>
            ${analysis.routinePlan.weekly.map(item => `<li>${item}</li>`).join('')}
          </ul>
          
          <p style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
            <em>Thank you for choosing Strandly for your hair analysis. For additional questions or support, 
            please contact us at support@strandly.shop</em>
          </p>
        </div>
      </body>
    </html>
  `;
}

// DATABASE INITIALIZATION
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quiz_submissions (
        id UUID PRIMARY KEY,
        data JSONB NOT NULL,
        payment_status VARCHAR(50) DEFAULT 'pending',
        stripe_session_id VARCHAR(255),
        analysis_results JSONB,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Start server
app.listen(PORT, async () => {
  await initializeDatabase();
  console.log(`🚀 Strandly Backend API running on port ${PORT}`);
  console.log(`📧 Email service: ${process.env.RESEND_API_KEY ? 'Connected' : 'Not configured'}`);
  console.log(`💳 Payment service: ${process.env.STRIPE_SECRET_KEY ? 'Connected' : 'Not configured'}`);
  console.log(`🗄️ Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});

module.exports = app;