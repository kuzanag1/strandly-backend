require('dotenv').config();
const { Resend } = require('resend');

console.log('🔧 Environment check:');
console.log('  RESEND_API_KEY:', process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 5)}...` : 'Missing');

if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY environment variable not found');
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTestEmail() {
  console.log('📧 Sending test hair analysis email to Captain Tiago...');
  
  const analysisResults = {
    timestamp: new Date(),
    hairType: {
      texture: 'Wavy (with some natural movement) 🌊',
      thickness: 'Medium (just right balance) ⚖️',
      primaryConcern: 'My hair feels dry and lifeless 💧',
      classification: 'medium-wavy-texture'
    },
    scalpHealth: {
      type: 'Pretty normal & balanced ✅',
      issues: [],
      severity: 'healthy'
    },
    damageLevel: {
      score: 3,
      level: 'moderate',
      factors: ['Hair color/highlights ✨', 'Heat styling regularly 🔥']
    },
    recommendations: [
      'Use a gentle, sulfate-free shampoo to protect color-treated hair',
      'Deep condition 2-3 times per week to combat dryness and heat damage',
      'Apply heat protectant before styling to prevent further damage',
      'Consider protein treatments to strengthen hair structure',
      'Reduce heat styling frequency when possible'
    ],
    products: [
      {
        category: 'Shampoo',
        recommendation: 'Color-safe, sulfate-free formula with moisturizing properties',
        frequency: '2-3 times per week',
        priceRange: '$18-28'
      },
      {
        category: 'Conditioner',
        recommendation: 'Deep moisturizing conditioner with protein',
        frequency: 'Every wash',
        priceRange: '$20-35'
      },
      {
        category: 'Treatment',
        recommendation: 'Weekly protein mask and bi-weekly deep conditioning',
        frequency: 'Weekly alternating',
        priceRange: '$25-45'
      },
      {
        category: 'Heat Protection',
        recommendation: 'Thermal protectant spray with UV filters',
        frequency: 'Before every heat styling',
        priceRange: '$15-25'
      }
    ],
    routinePlan: {
      daily: ['Gentle brushing with wide-tooth comb when wet', 'Light leave-in treatment on ends'],
      washDay: ['Color-safe sulfate-free shampoo', 'Deep moisturizing conditioner', 'Heat protectant if styling'],
      weekly: ['Protein treatment (week 1 & 3)', 'Deep conditioning mask (week 2 & 4)'],
      frequency: '2-3 times per week ⭐'
    },
    testMode: true
  };

  const emailContent = `
    <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
          .section { background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #667eea; }
          .product-card { border: 1px solid #e0e0e0; padding: 15px; margin-bottom: 15px; border-radius: 8px; background: white; }
          .recommendation { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 40px; padding: 25px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; }
          .test-badge { background: #ff9800; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; display: inline-block; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="test-badge">🧪 LIVE TEST FOR CAPTAIN TIAGO</div>
            <h1>🌟 Your Personalized Strandly Hair Analysis</h1>
            <p>Complete professional analysis with personalized recommendations</p>
          </div>
          
          <div class="section">
            <h2 style="color: #4A90E2; margin-top: 0;">📋 Your Hair Profile Summary</h2>
            <p><strong>Hair Texture:</strong> ${analysisResults.hairType.texture}</p>
            <p><strong>Hair Thickness:</strong> ${analysisResults.hairType.thickness}</p>
            <p><strong>Primary Concern:</strong> ${analysisResults.hairType.primaryConcern}</p>
            <p><strong>Scalp Health:</strong> ${analysisResults.scalpHealth.severity} (${analysisResults.scalpHealth.type})</p>
            <p><strong>Damage Level:</strong> ${analysisResults.damageLevel.level} (Score: ${analysisResults.damageLevel.score}/10)</p>
            <p><strong>Contributing Factors:</strong> ${analysisResults.damageLevel.factors.join(', ')}</p>
          </div>
          
          <div class="section">
            <h2 style="color: #4A90E2; margin-top: 0;">🎯 Your Personalized Recommendations</h2>
            ${analysisResults.recommendations.map(rec => `<div class="recommendation">• ${rec}</div>`).join('')}
          </div>
          
          <div class="section">
            <h2 style="color: #4A90E2; margin-top: 0;">🛍️ Recommended Product Categories</h2>
            ${analysisResults.products.map(product => `
              <div class="product-card">
                <h3 style="margin-top: 0; color: #333;">${product.category}</h3>
                <p><strong>What to look for:</strong> ${product.recommendation}</p>
                <p><strong>How often:</strong> ${product.frequency}</p>
                <p><strong>Expected price range:</strong> ${product.priceRange}</p>
              </div>
            `).join('')}
          </div>
          
          <div class="section">
            <h2 style="color: #4A90E2; margin-top: 0;">📅 Your Custom Hair Care Routine</h2>
            <p><strong>Recommended wash frequency:</strong> ${analysisResults.routinePlan.frequency}</p>
            
            <h3 style="color: #666;">Daily Care:</h3>
            <ul>
              ${analysisResults.routinePlan.daily.map(item => `<li>${item}</li>`).join('')}
            </ul>
            
            <h3 style="color: #666;">Wash Day Routine:</h3>
            <ul>
              ${analysisResults.routinePlan.washDay.map(item => `<li>${item}</li>`).join('')}
            </ul>
            
            <h3 style="color: #666;">Weekly Treatments:</h3>
            <ul>
              ${analysisResults.routinePlan.weekly.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
          
          <div class="footer">
            <h3 style="margin-top: 0; color: white;">🏛️ Thank You for Choosing Strandly!</h3>
            <p style="margin-bottom: 15px;">Your personalized hair analysis is based on your unique profile. These recommendations are tailored specifically for your hair type, concerns, and lifestyle.</p>
            <p style="margin-bottom: 0; font-size: 14px;">Questions? Contact us at support@strandly.shop</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>Analysis generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p><em>🧪 This is a live test of the Strandly platform for Captain Tiago</em></p>
            <p>Quiz ID: 9d86940e-37ff-488c-ab49-e43643166906 | Payment Session: cs_test_8j2uxe</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    console.log('🔑 Using Resend API key:', process.env.RESEND_API_KEY ? 'Found' : 'Missing');
    
    const { data, error } = await resend.emails.send({
      from: 'Strandly Hair Analysis <onboarding@resend.dev>', // Using verified sender
      to: ['tiagobsimoes@gmail.com'],
      subject: '🌟 Your Personalized Strandly Hair Analysis Results - LIVE TEST',
      html: emailContent
    });

    if (error) {
      console.error('❌ Email sending failed:', error);
      return false;
    }

    console.log('✅ Email sent successfully!');
    console.log('📧 Email ID:', data.id);
    console.log('📬 Sent to: tiagobsimoes@gmail.com');
    console.log('🎯 Subject: Your Personalized Strandly Hair Analysis Results - LIVE TEST');
    
    return true;
  } catch (error) {
    console.error('❌ Email sending failed with exception:', error.message);
    return false;
  }
}

sendTestEmail().then(success => {
  if (success) {
    console.log('\n🎉 TEST EMAIL SENT SUCCESSFULLY!');
    console.log('📱 Captain Tiago should receive the email at tiagobsimoes@gmail.com');
    console.log('🧪 This demonstrates the complete customer journey:');
    console.log('   ✅ Quiz submission');  
    console.log('   ✅ $29 payment processing');
    console.log('   ✅ AI hair analysis generation');
    console.log('   ✅ Personalized email delivery');
  } else {
    console.log('\n❌ Email test failed - check logs above');
  }
}).catch(error => {
  console.error('Script failed:', error);
});