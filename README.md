# Strandly Backend API

Professional backend API for Strandly hair analysis platform. Handles complete customer journey from quiz submission to email delivery of personalized hair analysis results.

## 🚀 Features

- **Quiz Processing**: Comprehensive hair analysis quiz data processing
- **Payment Integration**: Stripe checkout for $29 hair analysis service
- **Hair Analysis Engine**: AI-powered hair analysis and recommendations
- **Email Delivery**: Automated results delivery via Resend
- **Database Management**: PostgreSQL with comprehensive schema
- **Analytics Tracking**: Customer journey and business metrics

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Payments**: Stripe
- **Email**: Resend
- **Authentication**: JWT (future)
- **Deployment**: Render

## 📋 API Endpoints

### Health Check
- `GET /health` - Service health status

### Quiz Management
- `POST /api/quiz/submit` - Submit quiz responses

### Payment Processing
- `POST /api/payment/create-checkout` - Create Stripe checkout session
- `POST /api/payment/webhook` - Handle Stripe webhooks

### Hair Analysis
- Internal processing triggered by successful payments

## 🔧 Setup & Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Stripe account
- Resend account

### Installation
```bash
npm install
cp .env.example .env
# Configure environment variables in .env
npm run dev
```

### Database Setup
```bash
# Create database
createdb strandly_dev

# Run schema
psql strandly_dev < database/schema.sql
```

### Environment Variables
See `.env.example` for required configuration.

## 🚀 Deployment

### Render Deployment
1. Connect GitHub repository
2. Set environment variables
3. Deploy with build command: `npm install`
4. Start command: `npm start`

### Database
- PostgreSQL addon on Render
- Automatic schema initialization on startup

## 📊 Customer Journey

1. **Quiz Submission** → Data stored in PostgreSQL
2. **Payment Processing** → Stripe checkout ($29)
3. **Hair Analysis** → AI processing of quiz data
4. **Email Delivery** → Personalized results via Resend
5. **Analytics** → Tracking and dashboard metrics

## 🔐 Security

- CORS configuration
- Rate limiting
- Input validation
- Helmet security headers
- Environment variable protection

## 📈 Analytics

The system tracks:
- Quiz submissions
- Payment conversions
- Email delivery success
- User journey metrics

## 🧪 Testing

```bash
npm test
```

## 📞 Support

For technical issues or questions:
- Email: dev@strandly.shop
- GitHub Issues: [Repository Issues](https://github.com/username/strandly-backend/issues)

---

**Strandly Backend v1.0** - Professional Hair Analysis API