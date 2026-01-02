-- Migration: Refactor Dropshipping to Affiliate
-- Part of Phase 2 Refinement

-- 1. Deactivate Dropshipper Sequence (if exists)
UPDATE email_sequences SET is_active = false WHERE sequence_type = 'dropshipper';

-- 2. Insert "Affiliate Marketer" Sequence
INSERT INTO email_sequences (name, sequence_type, description, is_active, emails)
VALUES (
    'Affiliate Scaler',
    'affiliate',
    'Focuses on commissions, content volume, and UGC videos.',
    true,
    jsonb_build_array(
        jsonb_build_object(
            'step', 1,
            'delay_days', 0,
            'subject', 'More videos = More commissions?',
            'body', 'Hi {{name}},\n\nI see you are pushing products as an affiliate. The math is simple: More high-quality content = More traffic = More commissions.\n\nBut editing 5-10 videos a day is a grind.\n\nKrissKross can take your rough product clips and turn them into 10 different viral-style Hooks in under 60 seconds.\n\nWant to 10x your output without the burnout?\n\nBest,\nAug'
        ),
        jsonb_build_object(
            'step', 2,
            'delay_days', 2,
            'subject', 'The UGC cheat code',
            'body', 'Hi {{name}},\n\nMost affiliates burn out because they run out of content ideas.\n\nWe analyzed the top 1% of affiliate videos on TikTok and built templates based on them.\n\n- "Don''t buy this until..."\n- "I found a cheat code..."\n- "Amazon vs..."\n\nAll available inside KrissKross. Just upload your clips, pick a style, and post.\n\nTry it free here:\n[Link]\n\nCheers,'
        ),
         jsonb_build_object(
            'step', 3,
            'delay_days', 4,
            'subject', '300% commission bump',
            'body', 'Hi {{name}},\n\nOne of our users, Mike, used KrissKross to flood his channels with 30 videos in a week. His commissions tripled because the algo picked up the volume.\n\nQuantity has a quality all its own.\n\nReady to scale?\n\nBest,\nAug'
        )
    )
)
ON CONFLICT (sequence_type) DO UPDATE SET emails = EXCLUDED.emails;
