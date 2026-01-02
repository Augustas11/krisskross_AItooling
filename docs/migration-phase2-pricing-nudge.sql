-- Migration: Add Pricing Nudge Sequence
-- Part of Phase 2: Behavioral Triggers

-- 1. Insert "Pricing Nudge" Sequence
INSERT INTO email_sequences (name, sequence_type, description, is_active, emails)
VALUES (
    'Pricing Page Nudge',
    'pricing_nudge',
    'Triggered when a user views the pricing page multiple times or dwells.',
    true,
    jsonb_build_array(
        jsonb_build_object(
            'step', 1,
            'delay_days', 0,
            'subject', 'Quick question about the plans',
            'body', 'Hi {{name}},\n\nI noticed you were checking out our pricing page. Was there anything specific you were looking for that you couldn''t find?\n\nIf you are comparing us to other tools, here is the main difference: We don''t charge per export. It is unlimited.\n\nLet me know if you want a custom quote for your team.\n\nBest,\nAug'
        ),
        jsonb_build_object(
            'step', 2,
            'delay_days', 2,
            'subject', 'The "Hidden" ROI',
            'body', 'Hi {{name}},\n\nMost people look at the monthly cost ($20) but miss the savings.\n\nIf you hire an editor, you pay $20-$50 per video.\n\nWith KrissKross, you generate 100 videos for $20. That is $0.20 per video.\n\nIt is effectively free compared to manual editing.\n\n[Link to Upgrade]\n\nCheers,'
        )
    )
)
ON CONFLICT (sequence_type) DO UPDATE SET emails = EXCLUDED.emails;
