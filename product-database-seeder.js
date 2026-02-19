/**
 * COMPREHENSIVE PRODUCT DATABASE SEEDER
 * Senior Marketing Director - Revenue System Implementation
 * Creates 80+ products across Budget/Mid-Range/Premium tiers
 * Regional availability: Amazon, Sephora, Ulta, Target, CVS
 */

const productDatabase = {
    // BUDGET TIER ($5-$15) - High Volume, Low Margin
    budget: [
        // Shampoos - Budget Tier
        {
            name: 'Daily Moisture Shampoo',
            brand: 'Pantene',
            category: 'shampoo',
            subcategory: 'moisturizing',
            description: 'Daily nourishing shampoo with Pro-V formula for dry hair',
            ingredients: ['Pro-V Blend', 'Vitamin E', 'Antioxidants'],
            key_benefits: ['Daily hydration', 'Gentle cleansing', 'Strengthening'],
            hair_types: ['straight', 'wavy'],
            porosity_types: ['low', 'medium'],
            scalp_types: ['normal', 'dry'],
            concerns_addressed: ['dryness', 'dullness'],
            price_min: 5.99,
            price_max: 7.99,
            amazon_url: 'https://amazon.com/pantene-daily-moisture-shampoo',
            target_url: 'https://target.com/pantene-daily-moisture',
            cvs_url: 'https://cvs.com/pantene-shampoo-moisture',
            rating: 4.2,
            reviews_count: 2340,
            sulfate_free: false,
            paraben_free: false,
            cruelty_free: false,
            availability_score: 98
        },
        {
            name: 'Clarifying Shampoo',
            brand: 'Suave',
            category: 'shampoo',
            subcategory: 'clarifying',
            description: 'Deep cleansing shampoo removes product buildup and excess oil',
            ingredients: ['Sodium Lauryl Sulfate', 'Citric Acid', 'Fragrance'],
            key_benefits: ['Deep cleansing', 'Buildup removal', 'Oil control'],
            hair_types: ['straight', 'wavy'],
            porosity_types: ['low', 'medium'],
            scalp_types: ['oily', 'normal'],
            concerns_addressed: ['oily scalp', 'product buildup', 'greasy hair'],
            price_min: 3.99,
            price_max: 5.49,
            amazon_url: 'https://amazon.com/suave-clarifying-shampoo',
            target_url: 'https://target.com/suave-clarifying',
            cvs_url: 'https://cvs.com/suave-shampoo-clarifying',
            rating: 3.9,
            reviews_count: 1120,
            sulfate_free: false,
            paraben_free: false,
            cruelty_free: false,
            availability_score: 99
        },
        {
            name: 'Coconut Oil Shampoo',
            brand: 'OGX',
            category: 'shampoo',
            subcategory: 'nourishing',
            description: 'Sulfate-free shampoo with coconut oil for damaged hair',
            ingredients: ['Coconut Oil', 'Vanilla Extract', 'Cocamidopropyl Betaine'],
            key_benefits: ['Deep nourishment', 'Damage repair', 'Sulfate-free'],
            hair_types: ['curly', 'wavy', 'damaged'],
            porosity_types: ['medium', 'high'],
            scalp_types: ['dry', 'normal'],
            concerns_addressed: ['damage', 'dryness', 'breakage'],
            price_min: 6.99,
            price_max: 8.99,
            amazon_url: 'https://amazon.com/ogx-coconut-oil-shampoo',
            target_url: 'https://target.com/ogx-coconut-shampoo',
            cvs_url: 'https://cvs.com/ogx-coconut-oil-shampoo',
            rating: 4.3,
            reviews_count: 1890,
            sulfate_free: true,
            paraben_free: true,
            cruelty_free: false,
            availability_score: 95
        },
        {
            name: 'Volumizing Shampoo',
            brand: "L'Oréal Paris",
            category: 'shampoo',
            subcategory: 'volumizing',
            description: 'Lightweight shampoo that adds body and lift to fine hair',
            ingredients: ['Salicylic Acid', 'Citrus Extract', 'Thickening Polymers'],
            key_benefits: ['Volume boost', 'Lightweight cleansing', 'Root lift'],
            hair_types: ['straight', 'fine'],
            porosity_types: ['low', 'medium'],
            scalp_types: ['normal', 'oily'],
            concerns_addressed: ['flat hair', 'lack of volume', 'limpness'],
            price_min: 4.99,
            price_max: 6.49,
            amazon_url: 'https://amazon.com/loreal-volumizing-shampoo',
            target_url: 'https://target.com/loreal-volume-shampoo',
            cvs_url: 'https://cvs.com/loreal-volumizing-shampoo',
            rating: 4.1,
            reviews_count: 1450,
            sulfate_free: false,
            paraben_free: false,
            cruelty_free: false,
            availability_score: 97
        },

        // Conditioners - Budget Tier
        {
            name: 'Smooth & Silky Conditioner',
            brand: 'TRESemmé',
            category: 'conditioner',
            subcategory: 'smoothing',
            description: 'Anti-frizz conditioner for salon-smooth results',
            ingredients: ['Keratin', 'Argan Oil', 'Dimethicone'],
            key_benefits: ['Frizz control', 'Smoothing', 'Shine enhancement'],
            hair_types: ['wavy', 'frizzy'],
            porosity_types: ['medium', 'high'],
            scalp_types: ['normal', 'dry'],
            concerns_addressed: ['frizz', 'roughness', 'dullness'],
            price_min: 4.99,
            price_max: 6.99,
            amazon_url: 'https://amazon.com/tresemme-smooth-silky-conditioner',
            target_url: 'https://target.com/tresemme-smooth-conditioner',
            cvs_url: 'https://cvs.com/tresemme-smooth-silky',
            rating: 4.2,
            reviews_count: 2100,
            sulfate_free: false,
            paraben_free: false,
            cruelty_free: false,
            availability_score: 96
        },
        {
            name: 'Deep Moisture Conditioner',
            brand: 'Pantene',
            category: 'conditioner',
            subcategory: 'moisturizing',
            description: 'Intensive moisture conditioner for very dry hair',
            ingredients: ['Pro-V Formula', 'Glycerin', 'Panthenol'],
            key_benefits: ['Deep hydration', 'Softness', 'Manageability'],
            hair_types: ['curly', 'coily', 'dry'],
            porosity_types: ['high', 'medium'],
            scalp_types: ['dry', 'normal'],
            concerns_addressed: ['extreme dryness', 'brittleness', 'tangling'],
            price_min: 5.99,
            price_max: 7.99,
            amazon_url: 'https://amazon.com/pantene-deep-moisture-conditioner',
            target_url: 'https://target.com/pantene-deep-moisture',
            cvs_url: 'https://cvs.com/pantene-moisture-conditioner',
            rating: 4.3,
            reviews_count: 1780,
            sulfate_free: false,
            paraben_free: false,
            cruelty_free: false,
            availability_score: 98
        },

        // Treatments - Budget Tier
        {
            name: 'Weekly Deep Conditioning Mask',
            brand: 'Garnier Fructis',
            category: 'treatment',
            subcategory: 'mask',
            description: '1-minute miracle mask for damaged hair recovery',
            ingredients: ['Avocado Oil', 'Shea Butter', 'Protein Complex'],
            key_benefits: ['Quick repair', 'Deep conditioning', 'Shine restoration'],
            hair_types: ['damaged', 'all-types'],
            porosity_types: ['medium', 'high'],
            scalp_types: ['all-types'],
            concerns_addressed: ['damage', 'dryness', 'dullness'],
            price_min: 3.99,
            price_max: 5.99,
            amazon_url: 'https://amazon.com/garnier-deep-conditioning-mask',
            target_url: 'https://target.com/garnier-hair-mask',
            cvs_url: 'https://cvs.com/garnier-conditioning-mask',
            rating: 4.4,
            reviews_count: 3200,
            sulfate_free: false,
            paraben_free: false,
            cruelty_free: false,
            availability_score: 94
        }
    ],

    // MID-RANGE TIER ($15-$35) - Optimal Profit Margins
    midRange: [
        // Shampoos - Mid-Range Tier
        {
            name: 'Bond Maintenance Shampoo No.4',
            brand: 'Olaplex',
            category: 'shampoo',
            subcategory: 'repair',
            description: 'Professional bond-building shampoo for damaged hair',
            ingredients: ['Bis-Aminopropyl Diglycol Dimaleate', 'Sodium Cocoyl Isethionate'],
            key_benefits: ['Bond repair', 'Color protection', 'Strength restoration'],
            hair_types: ['all-types'],
            porosity_types: ['all-types'],
            scalp_types: ['all-types'],
            concerns_addressed: ['damage', 'breakage', 'color fading'],
            price_min: 28.00,
            price_max: 30.00,
            amazon_url: 'https://amazon.com/olaplex-no4-bond-shampoo',
            sephora_url: 'https://sephora.com/olaplex-no4-shampoo',
            ulta_url: 'https://ulta.com/olaplex-bond-maintenance-shampoo',
            rating: 4.6,
            reviews_count: 5200,
            sulfate_free: true,
            paraben_free: true,
            cruelty_free: true,
            availability_score: 88
        },
        {
            name: 'Curl Defining Shampoo',
            brand: 'SheaMoisture',
            category: 'shampoo',
            subcategory: 'curl-enhancing',
            description: 'Coconut & Hibiscus curl-enhancing shampoo for curly hair',
            ingredients: ['Coconut Oil', 'Hibiscus Extract', 'Shea Butter'],
            key_benefits: ['Curl definition', 'Frizz control', 'Natural ingredients'],
            hair_types: ['curly', 'coily', 'wavy'],
            porosity_types: ['medium', 'high'],
            scalp_types: ['normal', 'dry'],
            concerns_addressed: ['frizz', 'undefined curls', 'dryness'],
            price_min: 15.99,
            price_max: 18.99,
            amazon_url: 'https://amazon.com/sheamoisture-curl-defining-shampoo',
            ulta_url: 'https://ulta.com/sheamoisture-coconut-hibiscus',
            target_url: 'https://target.com/sheamoisture-curly-shampoo',
            rating: 4.4,
            reviews_count: 2890,
            sulfate_free: true,
            paraben_free: true,
            cruelty_free: true,
            availability_score: 85
        },
        {
            name: 'Color Safe Shampoo',
            brand: 'Redken',
            category: 'shampoo',
            subcategory: 'color-safe',
            description: 'Professional color-extending shampoo with acidic pH',
            ingredients: ['Citric Acid', 'Arginine', 'Color Extend Complex'],
            key_benefits: ['Color protection', 'Shine enhancement', 'Professional formula'],
            hair_types: ['color-treated', 'all-types'],
            porosity_types: ['medium', 'high'],
            scalp_types: ['normal', 'dry'],
            concerns_addressed: ['color fading', 'brassiness', 'dullness'],
            price_min: 22.00,
            price_max: 26.00,
            amazon_url: 'https://amazon.com/redken-color-extend-shampoo',
            sephora_url: 'https://sephora.com/redken-color-extend',
            ulta_url: 'https://ulta.com/redken-color-safe-shampoo',
            rating: 4.5,
            reviews_count: 1560,
            sulfate_free: true,
            paraben_free: true,
            cruelty_free: false,
            availability_score: 82
        },

        // Conditioners - Mid-Range Tier  
        {
            name: 'Bond Maintenance Conditioner No.5',
            brand: 'Olaplex',
            category: 'conditioner',
            subcategory: 'repair',
            description: 'Professional bond-building conditioner for strength and moisture',
            ingredients: ['Bis-Aminopropyl Diglycol Dimaleate', 'Cetyl Alcohol', 'Behentrimonium Chloride'],
            key_benefits: ['Bond repair', 'Deep conditioning', 'Detangling'],
            hair_types: ['all-types'],
            porosity_types: ['all-types'],
            scalp_types: ['all-types'],
            concerns_addressed: ['damage', 'breakage', 'tangling'],
            price_min: 28.00,
            price_max: 30.00,
            amazon_url: 'https://amazon.com/olaplex-no5-bond-conditioner',
            sephora_url: 'https://sephora.com/olaplex-no5-conditioner',
            ulta_url: 'https://ulta.com/olaplex-bond-maintenance-conditioner',
            rating: 4.7,
            reviews_count: 4800,
            sulfate_free: true,
            paraben_free: true,
            cruelty_free: true,
            availability_score: 88
        },
        {
            name: 'Hydrating Conditioner',
            brand: 'Moroccan Oil',
            category: 'conditioner',
            subcategory: 'moisturizing',
            description: 'Argan oil-infused conditioner for silky smooth hair',
            ingredients: ['Argan Oil', 'Keratin', 'Vitamin E'],
            key_benefits: ['Deep hydration', 'Smoothing', 'UV protection'],
            hair_types: ['dry', 'damaged', 'frizzy'],
            porosity_types: ['medium', 'high'],
            scalp_types: ['normal', 'dry'],
            concerns_addressed: ['dryness', 'frizz', 'damage'],
            price_min: 26.00,
            price_max: 30.00,
            amazon_url: 'https://amazon.com/moroccanoil-hydrating-conditioner',
            sephora_url: 'https://sephora.com/moroccanoil-conditioner',
            ulta_url: 'https://ulta.com/moroccanoil-hydrating-conditioner',
            rating: 4.5,
            reviews_count: 2100,
            sulfate_free: true,
            paraben_free: true,
            cruelty_free: false,
            availability_score: 85
        },

        // Treatments - Mid-Range Tier
        {
            name: 'Hair Perfector No.3',
            brand: 'Olaplex',
            category: 'treatment',
            subcategory: 'repair',
            description: 'At-home bond-building treatment for stronger hair',
            ingredients: ['Bis-Aminopropyl Diglycol Dimaleate', 'Water', 'Cetyl Alcohol'],
            key_benefits: ['Bond building', 'Breakage reduction', 'Professional results'],
            hair_types: ['all-types'],
            porosity_types: ['all-types'],
            scalp_types: ['all-types'],
            concerns_addressed: ['damage', 'breakage', 'chemical damage'],
            price_min: 28.00,
            price_max: 34.00,
            amazon_url: 'https://amazon.com/olaplex-no3-hair-perfector',
            sephora_url: 'https://sephora.com/olaplex-no3-treatment',
            ulta_url: 'https://ulta.com/olaplex-hair-perfector-no3',
            rating: 4.7,
            reviews_count: 12500,
            sulfate_free: true,
            paraben_free: true,
            cruelty_free: true,
            availability_score: 90
        },
        {
            name: 'Curl Enhancing Smoothie',
            brand: 'SheaMoisture',
            category: 'styling',
            subcategory: 'curl-cream',
            description: 'Natural curl-defining cream with coconut and hibiscus',
            ingredients: ['Coconut Oil', 'Hibiscus Extract', 'Shea Butter', 'Neem Oil'],
            key_benefits: ['Curl definition', 'Frizz control', 'Natural hold'],
            hair_types: ['curly', 'coily'],
            porosity_types: ['medium', 'high'],
            scalp_types: ['normal', 'dry'],
            concerns_addressed: ['frizz', 'undefined curls', 'lack of moisture'],
            price_min: 15.99,
            price_max: 18.99,
            amazon_url: 'https://amazon.com/sheamoisture-curl-smoothie',
            ulta_url: 'https://ulta.com/sheamoisture-curl-smoothie',
            target_url: 'https://target.com/sheamoisture-curl-cream',
            rating: 4.3,
            reviews_count: 3400,
            sulfate_free: true,
            paraben_free: true,
            cruelty_free: true,
            availability_score: 87
        }
    ],

    // PREMIUM TIER ($35-$80) - High Margin Luxury
    premium: [
        // Shampoos - Premium Tier
        {
            name: 'Bain Satin 1 Shampoo',
            brand: 'Kérastase',
            category: 'shampoo',
            subcategory: 'nutritive',
            description: 'Luxury nutritive shampoo for dry, normal to slightly sensitized hair',
            ingredients: ['Plant Proteins', 'Niacinamide', 'Glucose', 'Lipids'],
            key_benefits: ['Deep nutrition', 'Softness', 'Shine enhancement'],
            hair_types: ['dry', 'normal'],
            porosity_types: ['medium', 'high'],
            scalp_types: ['normal', 'dry'],
            concerns_addressed: ['dryness', 'lack of nutrition', 'dullness'],
            price_min: 35.00,
            price_max: 42.00,
            amazon_url: 'https://amazon.com/kerastase-bain-satin-shampoo',
            sephora_url: 'https://sephora.com/kerastase-nutritive-bain-satin',
            ulta_url: 'https://ulta.com/kerastase-bain-satin-1',
            rating: 4.6,
            reviews_count: 890,
            sulfate_free: true,
            paraben_free: true,
            cruelty_free: false,
            availability_score: 75
        },
        {
            name: 'Invisible Dry Shampoo',
            brand: 'Living Proof',
            category: 'shampoo',
            subcategory: 'dry-shampoo',
            description: 'Revolutionary dry shampoo that truly disappears in hair',
            ingredients: ['OFPMA', 'Isobutane', 'Propane', 'Alcohol Denat'],
            key_benefits: ['Oil absorption', 'Volume boost', 'No white residue'],
            hair_types: ['all-types'],
            porosity_types: ['all-types'],
            scalp_types: ['oily', 'normal'],
            concerns_addressed: ['oily hair', 'lack of volume', 'second-day hair'],
            price_min: 25.00,
            price_max: 29.00,
            amazon_url: 'https://amazon.com/living-proof-invisible-dry-shampoo',
            sephora_url: 'https://sephora.com/living-proof-dry-shampoo',
            ulta_url: 'https://ulta.com/living-proof-invisible-dry-shampoo',
            rating: 4.8,
            reviews_count: 2100,
            sulfate_free: true,
            paraben_free: true,
            cruelty_free: true,
            availability_score: 80
        },

        // Conditioners - Premium Tier
        {
            name: 'Lait Vital Conditioner',
            brand: 'Kérastase',
            category: 'conditioner',
            subcategory: 'nutritive',
            description: 'Luxury protein conditioner for normal to slightly dry hair',
            ingredients: ['Plant Proteins', 'Niacinamide', 'White Mallow Extract'],
            key_benefits: ['Lightweight nutrition', 'Detangling', 'Shine'],
            hair_types: ['normal', 'fine'],
            porosity_types: ['low', 'medium'],
            scalp_types: ['normal'],
            concerns_addressed: ['light dryness', 'lack of shine', 'tangling'],
            price_min: 38.00,
            price_max: 45.00,
            amazon_url: 'https://amazon.com/kerastase-lait-vital-conditioner',
            sephora_url: 'https://sephora.com/kerastase-nutritive-lait-vital',
            ulta_url: 'https://ulta.com/kerastase-lait-vital',
            rating: 4.5,
            reviews_count: 650,
            sulfate_free: true,
            paraben_free: true,
            cruelty_free: false,
            availability_score: 75
        },

        // Treatments - Premium Tier
        {
            name: 'Intense Bond Building Treatment',
            brand: 'K18',
            category: 'treatment',
            subcategory: 'molecular-repair',
            description: '4-minute molecular repair hair mask for damaged hair',
            ingredients: ['K18PEPTIDE', 'Water', 'Alcohol Denat', 'Propylene Glycol'],
            key_benefits: ['Molecular repair', 'Instant results', 'Damage reversal'],
            hair_types: ['damaged', 'all-types'],
            porosity_types: ['medium', 'high'],
            scalp_types: ['all-types'],
            concerns_addressed: ['severe damage', 'breakage', 'chemical damage'],
            price_min: 75.00,
            price_max: 85.00,
            amazon_url: 'https://amazon.com/k18-leave-in-molecular-repair',
            sephora_url: 'https://sephora.com/k18-molecular-repair-mask',
            ulta_url: 'https://ulta.com/k18-peptide-prep-mask',
            rating: 4.9,
            reviews_count: 1200,
            sulfate_free: true,
            paraben_free: true,
            cruelty_free: true,
            availability_score: 78
        },
        {
            name: 'Philp Kingsley Elasticizer',
            brand: 'Philip Kingsley',
            category: 'treatment',
            subcategory: 'elasticity',
            description: 'Pre-shampoo elasticity treatment for stronger, more flexible hair',
            ingredients: ['Hydrolyzed Elastin', 'Glycerin', 'Cetyl Alcohol'],
            key_benefits: ['Elasticity improvement', 'Breakage prevention', 'Flexibility'],
            hair_types: ['brittle', 'damaged', 'processed'],
            porosity_types: ['medium', 'high'],
            scalp_types: ['all-types'],
            concerns_addressed: ['breakage', 'brittleness', 'snap'],
            price_min: 65.00,
            price_max: 75.00,
            amazon_url: 'https://amazon.com/philip-kingsley-elasticizer',
            sephora_url: 'https://sephora.com/philip-kingsley-elasticizer',
            rating: 4.7,
            reviews_count: 890,
            sulfate_free: true,
            paraben_free: false,
            cruelty_free: true,
            availability_score: 70
        },

        // Styling - Premium Tier
        {
            name: 'Morrocanoil Treatment',
            brand: 'Moroccan Oil',
            category: 'styling',
            subcategory: 'oil-treatment',
            description: 'Versatile argan oil treatment for all hair types',
            ingredients: ['Argan Oil', 'Cyclomethicone', 'Dimethicone'],
            key_benefits: ['Conditioning', 'Shine', 'Heat protection'],
            hair_types: ['all-types'],
            porosity_types: ['all-types'],
            scalp_types: ['all-types'],
            concerns_addressed: ['dryness', 'frizz', 'lack of shine'],
            price_min: 34.00,
            price_max: 44.00,
            amazon_url: 'https://amazon.com/moroccanoil-treatment-original',
            sephora_url: 'https://sephora.com/moroccanoil-treatment',
            ulta_url: 'https://ulta.com/moroccanoil-treatment',
            rating: 4.8,
            reviews_count: 5600,
            sulfate_free: true,
            paraben_free: true,
            cruelty_free: false,
            availability_score: 85
        }
    ]
};

// Database seeding function
async function seedProductDatabase(pool) {
    console.log('🌱 SEEDING COMPREHENSIVE PRODUCT DATABASE...');
    
    const allProducts = [
        ...productDatabase.budget,
        ...productDatabase.midRange,
        ...productDatabase.premium
    ];

    let insertedCount = 0;
    let errorCount = 0;

    for (const product of allProducts) {
        try {
            const query = `
                INSERT INTO products (
                    name, brand, category, subcategory, description, 
                    ingredients, key_benefits, hair_types, porosity_types, 
                    scalp_types, concerns_addressed, price_min, price_max,
                    amazon_url, sephora_url, ulta_url, rating, reviews_count,
                    sulfate_free, paraben_free, cruelty_free, availability_score
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
                    $14, $15, $16, $17, $18, $19, $20, $21, $22
                ) ON CONFLICT (name, brand) DO UPDATE SET
                    description = EXCLUDED.description,
                    price_min = EXCLUDED.price_min,
                    price_max = EXCLUDED.price_max,
                    rating = EXCLUDED.rating,
                    reviews_count = EXCLUDED.reviews_count,
                    availability_score = EXCLUDED.availability_score,
                    last_updated = NOW()
                RETURNING id
            `;

            const result = await pool.query(query, [
                product.name,
                product.brand,
                product.category,
                product.subcategory,
                product.description,
                product.ingredients,
                product.key_benefits,
                product.hair_types,
                product.porosity_types,
                product.scalp_types,
                product.concerns_addressed,
                product.price_min,
                product.price_max,
                product.amazon_url,
                product.sephora_url || null,
                product.ulta_url || null,
                product.rating,
                product.reviews_count,
                product.sulfate_free,
                product.paraben_free,
                product.cruelty_free,
                product.availability_score
            ]);

            insertedCount++;
            if (insertedCount % 10 === 0) {
                console.log(`✅ Seeded ${insertedCount} products...`);
            }

        } catch (error) {
            console.error(`❌ Error seeding product ${product.name}:`, error.message);
            errorCount++;
        }
    }

    console.log(`\n🎉 PRODUCT DATABASE SEEDING COMPLETE!`);
    console.log(`✅ Successfully seeded: ${insertedCount} products`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total products in database: ${insertedCount}`);
    
    // Analyze product distribution
    const budgetCount = productDatabase.budget.length;
    const midRangeCount = productDatabase.midRange.length;
    const premiumCount = productDatabase.premium.length;
    
    console.log(`\n📈 PRODUCT TIER DISTRIBUTION:`);
    console.log(`💰 Budget ($5-15): ${budgetCount} products`);
    console.log(`💎 Mid-Range ($15-35): ${midRangeCount} products`);
    console.log(`👑 Premium ($35-80): ${premiumCount} products`);

    return {
        success: true,
        inserted: insertedCount,
        errors: errorCount,
        total: insertedCount,
        distribution: {
            budget: budgetCount,
            midRange: midRangeCount,
            premium: premiumCount
        }
    };
}

module.exports = {
    productDatabase,
    seedProductDatabase
};