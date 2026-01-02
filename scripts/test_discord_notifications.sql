-- ==========================================
-- TEST SCRIPT FOR SLACK NOTIFICATIONS
-- ==========================================

-- 1. Insert a Test Lead
-- Expected: "🆕 New Lead Entered" notification in Discord
INSERT INTO leads (
    id, 
    name, 
    email, 
    store_url, 
    status
    -- Add other required columns if specific constraints exist, assuming defaults handle others
) VALUES (
    'discord_test_fixed', 
    'Antigravity Test User', 
    'test@antigravity.ai', 
    'https://antigravity.ai', 
    'New'
);

-- WAIT 5 SECONDS (Manually, or separate execution)

-- 2. Update Status to "Pitched"
-- Expected: "📧 Lead Status Changed" notification in Discord (New -> Pitched)
UPDATE leads 
SET status = 'Pitched' 
WHERE id = 'test_lead_001';

-- WAIT 5 SECONDS

-- 3. Update Status to "Replied"
-- Expected: "💬 Lead Replied! 🔥" notification in Discord
UPDATE leads 
SET status = 'Replied' 
WHERE id = 'test_lead_001';

-- 4. Clean up (Optional)
-- DELETE FROM leads WHERE id = 'test_lead_001';
