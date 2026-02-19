-- Enhanced Strandly Hair Analysis Database Schema
-- Advanced PostgreSQL schema with analytics, performance optimization, and user behavior tracking

-- Extensions for advanced functionality
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Enhanced quiz submissions table with advanced analytics
CREATE TABLE IF NOT EXISTS quiz_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,
    analysis_results JSONB,
    payment_status VARCHAR(50) DEFAULT 'pending',
    stripe_session_id VARCHAR(255),
    quality_score DECIMAL(5,2), -- 0.00 to 100.00
    completion_time_seconds INTEGER,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    device_type VARCHAR(50),
    browser_info JSONB,
    geolocation JSONB, -- Country, region, city from IP
    status VARCHAR(50) DEFAULT 'pending',
    follow_up_stage INTEGER DEFAULT 0, -- Email follow-up tracking
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Advanced indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quiz_submissions_email ON quiz_submissions(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quiz_submissions_status ON quiz_submissions(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quiz_submissions_payment_status ON quiz_submissions(payment_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quiz_submissions_created_at ON quiz_submissions(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quiz_submissions_quality_score ON quiz_submissions(quality_score);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quiz_submissions_utm_source ON quiz_submissions(utm_source);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quiz_submissions_device_type ON quiz_submissions(device_type);
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_quiz_submissions_stripe_session ON quiz_submissions(stripe_session_id);

-- GIN indexes for JSONB data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quiz_submissions_data_gin ON quiz_submissions USING GIN(data);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quiz_submissions_analysis_gin ON quiz_submissions USING GIN(analysis_results);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quiz_submissions_browser_gin ON quiz_submissions USING GIN(browser_info);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quiz_payment_created ON quiz_submissions(payment_status, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quiz_source_date ON quiz_submissions(utm_source, created_at);

-- Enhanced analytics table with advanced event tracking
CREATE TABLE IF NOT EXISTS analytics (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    user_id UUID REFERENCES quiz_submissions(id),
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    page_url TEXT,
    referrer TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    device_fingerprint VARCHAR(255),
    experiment_variant VARCHAR(100), -- A/B testing
    created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_session_id ON analytics(session_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_utm_source ON analytics(utm_source);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_experiment_variant ON analytics(experiment_variant);

-- Composite indexes for analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_event_date ON analytics(event_type, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_source_date ON analytics(utm_source, created_at);

-- Enhanced products table with advanced matching capabilities
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    description TEXT,
    ingredients TEXT[],
    key_benefits TEXT[],
    hair_types VARCHAR(50)[], -- Array of compatible hair types
    porosity_types VARCHAR(20)[], -- low, medium, high
    scalp_types VARCHAR(20)[], -- oily, normal, dry, sensitive
    concerns_addressed TEXT[], -- frizz, damage, thinning, etc.
    price_min DECIMAL(10,2),
    price_max DECIMAL(10,2),
    price_currency VARCHAR(3) DEFAULT 'USD',
    affiliate_url TEXT,
    amazon_url TEXT,
    sephora_url TEXT,
    ulta_url TEXT,
    rating DECIMAL(3,2),
    reviews_count INTEGER DEFAULT 0,
    availability_score INTEGER DEFAULT 100, -- 0-100 how easy to find
    sustainability_score INTEGER, -- Environmental rating
    cruelty_free BOOLEAN DEFAULT false,
    vegan BOOLEAN DEFAULT false,
    sulfate_free BOOLEAN DEFAULT false,
    paraben_free BOOLEAN DEFAULT false,
    silicone_free BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Advanced product indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category ON products(category, subcategory);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_rating ON products(rating DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_price ON products(price_min, price_max);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_availability ON products(availability_score DESC);

-- GIN indexes for array fields
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_hair_types_gin ON products USING GIN(hair_types);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_porosity_gin ON products USING GIN(porosity_types);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_scalp_gin ON products USING GIN(scalp_types);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_concerns_gin ON products USING GIN(concerns_addressed);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_ingredients_gin ON products USING GIN(ingredients);

-- Text search index for products
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_text_search ON products USING GIN(
    to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || brand)
);

-- Email delivery tracking with enhanced metrics
CREATE TABLE IF NOT EXISTS email_deliveries (
    id BIGSERIAL PRIMARY KEY,
    quiz_submission_id UUID REFERENCES quiz_submissions(id),
    email_address VARCHAR(255) NOT NULL,
    email_type VARCHAR(100) NOT NULL, -- main_analysis, follow_up_1, etc.
    resend_email_id VARCHAR(255),
    template_version VARCHAR(50),
    personalization_data JSONB,
    status VARCHAR(50) DEFAULT 'sent', -- sent, delivered, opened, clicked, bounced, failed
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    first_opened_at TIMESTAMP,
    last_opened_at TIMESTAMP,
    first_clicked_at TIMESTAMP,
    last_clicked_at TIMESTAMP,
    bounce_reason TEXT,
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT NOW()
);

-- Email delivery indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_deliveries_quiz_id ON email_deliveries(quiz_submission_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_deliveries_status ON email_deliveries(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_deliveries_type ON email_deliveries(email_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_deliveries_sent_at ON email_deliveries(sent_at);

-- User behavior funnel tracking
CREATE TABLE IF NOT EXISTS funnel_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    session_id VARCHAR(255) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    step_number INTEGER,
    event_properties JSONB,
    timestamp TIMESTAMP DEFAULT NOW(),
    
    -- Common funnel steps
    page_view BOOLEAN DEFAULT false,
    quiz_started BOOLEAN DEFAULT false,
    quiz_completed BOOLEAN DEFAULT false,
    payment_initiated BOOLEAN DEFAULT false,
    payment_completed BOOLEAN DEFAULT false
);

-- Funnel tracking indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funnel_session_step ON funnel_events(session_id, step_number);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funnel_event_name ON funnel_events(event_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funnel_timestamp ON funnel_events(timestamp);

-- A/B Testing and Experiments
CREATE TABLE IF NOT EXISTS experiments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    variant_a_name VARCHAR(100) DEFAULT 'control',
    variant_b_name VARCHAR(100) DEFAULT 'treatment',
    traffic_split DECIMAL(3,2) DEFAULT 0.50, -- 0.50 = 50/50 split
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    success_metric VARCHAR(100), -- conversion_rate, quality_score, etc.
    created_at TIMESTAMP DEFAULT NOW()
);

-- User sessions for detailed behavior tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    landing_page TEXT,
    device_info JSONB,
    geolocation JSONB,
    session_duration INTEGER, -- seconds
    page_views INTEGER DEFAULT 0,
    quiz_attempts INTEGER DEFAULT 0,
    conversion_achieved BOOLEAN DEFAULT false,
    experiment_variant VARCHAR(100),
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP
);

-- Session indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_started_at ON user_sessions(started_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_utm_source ON user_sessions(utm_source);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_conversion ON user_sessions(conversion_achieved);

-- Product recommendations tracking
CREATE TABLE IF NOT EXISTS product_recommendations (
    id BIGSERIAL PRIMARY KEY,
    quiz_submission_id UUID REFERENCES quiz_submissions(id),
    product_id INTEGER REFERENCES products(id),
    recommendation_type VARCHAR(50), -- primary, secondary, alternative
    match_score DECIMAL(5,2), -- How well product matches user needs
    reasoning JSONB, -- Why this product was recommended
    user_action VARCHAR(50), -- clicked, purchased, ignored
    action_timestamp TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Product recommendation indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_rec_quiz ON product_recommendations(quiz_submission_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_rec_product ON product_recommendations(product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_rec_score ON product_recommendations(match_score DESC);

-- Performance monitoring table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id BIGSERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,4),
    metric_unit VARCHAR(20), -- ms, seconds, percentage, count
    endpoint VARCHAR(255),
    method VARCHAR(10),
    status_code INTEGER,
    response_time_ms INTEGER,
    memory_usage_mb INTEGER,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_perf_metric_name ON performance_metrics(metric_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_perf_endpoint ON performance_metrics(endpoint);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_perf_timestamp ON performance_metrics(timestamp);

-- Materialized views for fast analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_conversions AS
SELECT 
    DATE(created_at) as conversion_date,
    COUNT(*) as total_submissions,
    COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as paid_submissions,
    ROUND(
        COUNT(CASE WHEN payment_status = 'completed' THEN 1 END)::numeric / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as conversion_rate,
    AVG(quality_score) as avg_quality_score,
    COUNT(CASE WHEN quality_score >= 80 THEN 1 END) as high_quality_submissions
FROM quiz_submissions 
GROUP BY DATE(created_at)
ORDER BY conversion_date DESC;

-- Index for materialized view
CREATE INDEX IF NOT EXISTS idx_daily_conversions_date ON daily_conversions(conversion_date);

-- Refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_daily_conversions()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_conversions;
END;
$$ LANGUAGE plpgsql;

-- UTM source performance view
CREATE MATERIALIZED VIEW IF NOT EXISTS utm_performance AS
SELECT 
    utm_source,
    utm_medium,
    utm_campaign,
    COUNT(*) as total_visits,
    COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as conversions,
    ROUND(
        COUNT(CASE WHEN payment_status = 'completed' THEN 1 END)::numeric / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as conversion_rate,
    AVG(quality_score) as avg_quality_score,
    SUM(CASE WHEN payment_status = 'completed' THEN 29.00 ELSE 0 END) as total_revenue
FROM quiz_submissions 
WHERE utm_source IS NOT NULL
GROUP BY utm_source, utm_medium, utm_campaign
ORDER BY conversions DESC, conversion_rate DESC;

-- Hair type insights view
CREATE MATERIALIZED VIEW IF NOT EXISTS hair_type_insights AS
SELECT 
    data->>'hairType' as hair_type,
    data->>'porosity' as porosity,
    data->>'scalpType' as scalp_type,
    COUNT(*) as submission_count,
    COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as paid_count,
    ROUND(AVG(quality_score), 2) as avg_quality_score,
    ROUND(
        COUNT(CASE WHEN payment_status = 'completed' THEN 1 END)::numeric / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as conversion_rate
FROM quiz_submissions 
WHERE data->>'hairType' IS NOT NULL
GROUP BY data->>'hairType', data->>'porosity', data->>'scalpType'
ORDER BY submission_count DESC;

-- Functions and triggers for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for automatic updated_at on quiz_submissions
CREATE TRIGGER update_quiz_submissions_updated_at 
    BEFORE UPDATE ON quiz_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to track funnel progression
CREATE OR REPLACE FUNCTION track_funnel_step(
    p_session_id VARCHAR(255),
    p_event_name VARCHAR(100),
    p_step_number INTEGER DEFAULT NULL,
    p_event_properties JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO funnel_events (session_id, event_name, step_number, event_properties)
    VALUES (p_session_id, p_event_name, p_step_number, p_event_properties);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate user LTV (Lifetime Value)
CREATE OR REPLACE FUNCTION calculate_user_ltv(p_email VARCHAR(255))
RETURNS DECIMAL(10,2) AS $$
DECLARE
    ltv DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(29.00), 0)
    INTO ltv
    FROM quiz_submissions 
    WHERE email = p_email AND payment_status = 'completed';
    
    RETURN ltv;
END;
$$ LANGUAGE plpgsql;

-- Enhanced product seeding with comprehensive data
INSERT INTO products (
    name, brand, category, subcategory, description, ingredients, key_benefits,
    hair_types, porosity_types, scalp_types, concerns_addressed,
    price_min, price_max, rating, reviews_count, 
    sulfate_free, paraben_free, cruelty_free, availability_score
) VALUES 
(
    'Moisture Renewal Shampoo', 'OGX', 'shampoo', 'moisturizing',
    'Gentle sulfate-free shampoo with coconut milk and egg white proteins',
    ARRAY['Coconut Milk', 'Egg White Protein', 'Cocamidopropyl Betaine'],
    ARRAY['Deep hydration', 'Protein repair', 'Gentle cleansing'],
    ARRAY['curly', 'wavy', 'coily'], ARRAY['high', 'medium'], ARRAY['dry', 'normal'],
    ARRAY['dryness', 'damage', 'frizz'],
    6.99, 8.99, 4.3, 1250, true, true, false, 95
),
(
    'Clarifying Tea Tree Shampoo', 'Paul Mitchell', 'shampoo', 'clarifying',
    'Deep cleansing shampoo with tea tree oil for oily scalps',
    ARRAY['Tea Tree Oil', 'Peppermint', 'Lavender'],
    ARRAY['Deep cleansing', 'Scalp health', 'Oil control'],
    ARRAY['straight', 'wavy'], ARRAY['low', 'medium'], ARRAY['oily'],
    ARRAY['oily scalp', 'product buildup', 'dandruff'],
    14.99, 19.99, 4.5, 890, true, false, true, 88
),
(
    'Intensive Repair Mask', 'Olaplex', 'treatment', 'repair',
    'Professional-grade bond repair treatment for damaged hair',
    ARRAY['Bis-Aminopropyl Diglycol Dimaleate', 'Water', 'Cetyl Alcohol'],
    ARRAY['Bond repair', 'Strength restoration', 'Damage prevention'],
    ARRAY['all-types'], ARRAY['high', 'medium'], ARRAY['all-types'],
    ARRAY['damage', 'breakage', 'chemical damage'],
    28.00, 34.00, 4.7, 3420, true, true, true, 92
),
(
    'Curl Enhancing Cream', 'DevaCurl', 'styling', 'curl-enhancer',
    'Lightweight cream that defines and enhances natural curl pattern',
    ARRAY['Wheat Protein', 'Lemon Extract', 'Chamomile'],
    ARRAY['Curl definition', 'Frizz control', 'Moisture retention'],
    ARRAY['curly', 'coily'], ARRAY['high', 'medium'], ARRAY['dry', 'normal'],
    ARRAY['frizz', 'undefined curls', 'dryness'],
    22.00, 28.00, 4.1, 760, true, true, true, 85
)
ON CONFLICT DO NOTHING;

-- Indexes for performance monitoring
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_endpoint_timestamp 
ON performance_metrics(endpoint, timestamp);

-- Scheduled job to refresh materialized views (requires pg_cron extension)
-- SELECT cron.schedule('refresh-daily-conversions', '0 1 * * *', 'SELECT refresh_daily_conversions();');

-- Final optimization: VACUUM and ANALYZE
-- VACUUM ANALYZE quiz_submissions;
-- VACUUM ANALYZE analytics;
-- VACUUM ANALYZE products;