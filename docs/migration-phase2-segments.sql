-- Migration: Add Segment-Specific Sequences
-- Part of Phase 2: Advanced Nurture Sequences

-- 1. Insert "Fashion Brand" Sequence
INSERT INTO email_sequences (name, sequence_type, description, is_active, emails)
VALUES (
    'Fashion Brand Nurture',
    'fashion_owner',
    'Focuses on brand aesthetic, lookbooks, and Instagram growth.',
    true,
    jsonb_build_array(
        jsonb_build_object(
            'step', 1,
            'delay_days', 0,
            'subject', 'Your lookbook needs this upgrade',
            'body', 'Hi {{name}},\n\nI love the aesthetic of {{business_category}}.\n\nQuick question: Are you manually editing your Reels/TikToks from your product shoot photos?\n\nWe built a tool that turns your flat lays into high-energy video transitions automatically. It keeps your brand vibe but saves you hours of editing.\n\nWant to see a demo with your own products?\n\nBest,\nAug'
        ),
        jsonb_build_object(
            'step', 2,
            'delay_days', 2,
            'subject', 'Re: Your lookbook',
            'body', 'Hi {{name}},\n\nSending this bump because visual storytelling is everything for fashion brands right now.\n\nWe have a "Minimalist Lux" template that would fit your feed perfectly. It’s helping other boutique owners get 20k+ views on reels without hiring an editor.\n\nLink: [See Examples]\n\nCheers,\nAug'
        ),
         jsonb_build_object(
            'step', 3,
            'delay_days', 4,
            'subject', 'Collaboration idea?',
            'body', 'Hi {{name}},\n\nJust thinking out loud—if you are planning your next collection drop, KrissKross can auto-generate all the teaser content for you.\n\nLet me know if you want to try it out for the next launch.\n\nBest,'
        )
    )
)
ON CONFLICT (sequence_type) DO UPDATE SET emails = EXCLUDED.emails;


-- 2. Insert "Dropshipper" Sequence
INSERT INTO email_sequences (name, sequence_type, description, is_active, emails)
VALUES (
    'Dropshipper Scale',
    'dropshipper',
    'Focuses on speed, testing products, ROI, and ads.',
    true,
    jsonb_build_array(
        jsonb_build_object(
            'step', 1,
            'delay_days', 0,
            'subject', 'Test creatives 10x faster',
            'body', 'Hi {{name}},\n\nIn dropshipping, speed is everything. You need to test products before you burn ad spend.\n\nStop spending hours editing videos for products that might not work. KrissKross lets you generate 50+ ad variations from AlliExpress/Shopify images in minutes.\n\nTest faster -> Find winners faster.\n\nWant to see how?\n\nCheers,\nAug'
        ),
        jsonb_build_object(
            'step', 2,
            'delay_days', 1, -- Faster follow-up for dropshippers
            'subject', 'Your ad spend ROI',
            'body', 'Hi {{name}},\n\nQuick math: If you spend $50 on a video editor per product test, and test 10 products, that is $500.\n\nKrissKross is $20/month for unlimited videos.\n\nThat is more budget for your ad sets.\n\nReady to switch?\n\nBest,'
        ),
         jsonb_build_object(
            'step', 3,
            'delay_days', 3,
            'subject', 'Winning product detected?',
            'body', 'Hi {{name}},\n\nIf you find a winner, you need fresh creatives to avoid ad fatigue.\n\nOur "Viral Hook" templates are designed exactly for this. Just plug in the new product images and generate 5 fresh angles instantly.\n\nKeep scaling,\nAug'
        )
    )
)
ON CONFLICT (sequence_type) DO UPDATE SET emails = EXCLUDED.emails;
