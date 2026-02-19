// SECURITY CONFIGURATION MODULE
// Comprehensive security implementation for production

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Content Security Policy Configuration
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: [
      "'self'", 
      "'unsafe-inline'", 
      "https://fonts.googleapis.com",
      "https://cdnjs.cloudflare.com"
    ],
    fontSrc: [
      "'self'", 
      "https://fonts.gstatic.com",
      "https://cdnjs.cloudflare.com"
    ],
    imgSrc: [
      "'self'", 
      "data:", 
      "https:",
      "https://images.unsplash.com",
      "https://cdn.jsdelivr.net"
    ],
    scriptSrc: [
      "'self'",
      "https://js.stripe.com",
      "https://cdnjs.cloudflare.com"
    ],
    connectSrc: [
      "'self'", 
      "https://api.stripe.com",
      "https://api.resend.com"
    ],
    frameSrc: [
      "'self'",
      "https://js.stripe.com",
      "https://hooks.stripe.com"
    ],
    formAction: ["'self'"],
    baseUri: ["'self'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: []
  }
};

// Enhanced Helmet Configuration
const helmetConfig = {
  contentSecurityPolicy: cspConfig,
  crossOriginEmbedderPolicy: false, // Allow Stripe integration
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' }
};

// Rate Limiting Configurations
const rateLimitConfigs = {
  // General API rate limiting
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
      error: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
      });
    }
  }),

  // Quiz submission rate limiting (stricter)
  quiz: rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 3, // 3 quiz submissions per 30 minutes
    keyGenerator: (req) => {
      // Rate limit by IP and email combination
      return req.ip + ':' + (req.body.email || 'anonymous');
    },
    message: {
      error: 'Too many quiz submissions. Please wait 30 minutes before trying again.',
      code: 'QUIZ_RATE_LIMIT'
    }
  }),

  // Payment rate limiting (very strict)
  payment: rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // 5 payment attempts per 10 minutes
    keyGenerator: (req) => req.ip + ':payment',
    message: {
      error: 'Too many payment attempts. Please wait 10 minutes before trying again.',
      code: 'PAYMENT_RATE_LIMIT'
    }
  }),

  // Webhook rate limiting
  webhook: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 webhook calls per minute
    keyGenerator: () => 'stripe-webhooks', // Global limit for all webhooks
    message: {
      error: 'Webhook rate limit exceeded',
      code: 'WEBHOOK_RATE_LIMIT'
    }
  })
};

// Input Validation Rules
const validationRules = {
  quiz: {
    email: {
      isEmail: true,
      normalizeEmail: true,
      errorMessage: 'Valid email address is required'
    },
    hairType: {
      isIn: {
        options: [['straight', 'wavy', 'curly', 'coily']],
        errorMessage: 'Hair type must be one of: straight, wavy, curly, coily'
      }
    },
    porosity: {
      optional: true,
      isIn: {
        options: [['low', 'medium', 'high']],
        errorMessage: 'Porosity must be one of: low, medium, high'
      }
    },
    scalpType: {
      optional: true,
      isIn: {
        options: [['oily', 'normal', 'dry', 'sensitive']],
        errorMessage: 'Scalp type must be one of: oily, normal, dry, sensitive'
      }
    },
    concerns: {
      optional: true,
      isLength: {
        options: { max: 500 },
        errorMessage: 'Concerns must be less than 500 characters'
      },
      escape: true
    },
    currentProducts: {
      optional: true,
      isLength: {
        options: { max: 300 },
        errorMessage: 'Current products must be less than 300 characters'
      },
      escape: true
    }
  },

  payment: {
    quizId: {
      isUUID: {
        version: 4,
        errorMessage: 'Valid quiz ID is required'
      }
    },
    email: {
      optional: true,
      isEmail: true,
      normalizeEmail: true,
      errorMessage: 'Valid email address is required'
    }
  }
};

// Security Headers Middleware
function securityHeaders(req, res, next) {
  // Additional security headers not covered by Helmet
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Remove server identification
  res.removeHeader('X-Powered-By');
  
  next();
}

// Request sanitization middleware
function sanitizeRequest(req, res, next) {
  // Remove any script tags from request body
  if (req.body && typeof req.body === 'object') {
    JSON.stringify(req.body, (key, value) => {
      if (typeof value === 'string') {
        return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      }
      return value;
    });
  }
  
  next();
}

// IP Whitelist for admin endpoints (if needed)
const adminIPWhitelist = process.env.ADMIN_IPS 
  ? process.env.ADMIN_IPS.split(',') 
  : [];

function adminIPCheck(req, res, next) {
  if (adminIPWhitelist.length === 0) {
    return next(); // No whitelist configured
  }
  
  const clientIP = req.ip || req.connection.remoteAddress;
  
  if (adminIPWhitelist.includes(clientIP)) {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Access denied',
      code: 'IP_NOT_WHITELISTED'
    });
  }
}

module.exports = {
  helmetConfig,
  rateLimitConfigs,
  validationRules,
  securityHeaders,
  sanitizeRequest,
  adminIPCheck
};