-- Strandly Hair Analysis Database Schema
-- PostgreSQL database for production deployment

-- Quiz submissions table
CREATE TABLE IF NOT EXISTS quiz_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending',
    stripe_session_id VARCHAR(255),
    analysis_results JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_email ON quiz_submissions(email);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_status ON quiz_submissions(status);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_created_at ON quiz_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_stripe_session ON quiz_submissions(stripe_session_id);

-- Analytics table for dashboard
CREATE TABLE IF NOT EXISTS analytics (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    user_id UUID REFERENCES quiz_submissions(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);

-- Products table for recommendations
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    price_range VARCHAR(50),
    affiliate_url TEXT,
    hair_types JSONB, -- Array of compatible hair types
    benefits JSONB,   -- Array of benefits
    ingredients JSONB, -- Array of key ingredients
    rating DECIMAL(3,2),
    reviews_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_hair_types ON products USING GIN(hair_types);

-- Email delivery tracking
CREATE TABLE IF NOT EXISTS email_deliveries (
    id SERIAL PRIMARY KEY,
    quiz_submission_id UUID REFERENCES quiz_submissions(id),
    email_address VARCHAR(255) NOT NULL,
    email_type VARCHAR(100) NOT NULL,
    resend_email_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'sent',
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for email tracking
CREATE INDEX IF NOT EXISTS idx_email_deliveries_quiz_id ON email_deliveries(quiz_submission_id);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_status ON email_deliveries(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic updated_at
CREATE TRIGGER update_quiz_submissions_updated_at 
    BEFORE UPDATE ON quiz_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Initial product data (sample)
INSERT INTO products (name, category, description, price_range, hair_types, benefits) VALUES
('Gentle Sulfate-Free Shampoo', 'Shampoo', 'Mild cleansing without stripping natural oils', '$15-25', '["all-types", "damaged", "colored"]', '["gentle-cleansing", "color-safe", "moisture-retention"]'),
('Deep Conditioning Mask', 'Treatment', 'Intensive moisture treatment for damaged hair', '$20-35', '["damaged", "dry", "chemically-treated"]', '["deep-hydration", "repair", "strengthening"]'),
('Heat Protection Spray', 'Styling', 'Thermal protection for heat styling tools', '$12-20', '["all-types"]', '["heat-protection", "frizz-control", "shine"]'),
('Scalp Treatment Serum', 'Scalp Care', 'Nourishing serum for scalp health', '$25-40', '["oily-scalp", "dry-scalp", "sensitive-scalp"]', '["scalp-health", "circulation", "anti-inflammatory"]')
ON CONFLICT DO NOTHING;