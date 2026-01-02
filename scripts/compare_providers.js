
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// --- MOCK / HELPER FUNCTIONS FOR APIs ---

// 1. GROK
async function testGrok(prompt) {
    if (!process.env.GROK_API_KEY) return "SKIPPED (No Key)";
    try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'grok-3',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1
            })
        });
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "ERROR: No content";
    } catch (e) {
        return `ERROR: ${e.message}`;
    }
}

// 2. PERPLEXITY
async function testPerplexity(prompt) {
    if (!process.env.PERPLEXITY_API_KEY) return "SKIPPED (No Key)";
    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar-pro', // Using sonar-pro for deep research
                messages: [
                    { role: 'system', content: 'You are a deep research assistant.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1
            })
        });
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "ERROR: No content";
    } catch (e) {
        return `ERROR: ${e.message}`;
    }
}

// 3. CLAUDE (Direct)
async function testClaude(prompt) {
    if (!process.env.ANTHROPIC_API_KEY) return "SKIPPED (No Key)";
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307', // Using Haiku for speed, but Opus/Sonnet is better for reasoning
                max_tokens: 1500,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        const data = await response.json();
        return data.content?.[0]?.text || "ERROR: No content";
    } catch (e) {
        return `ERROR: ${e.message}`;
    }
}

// --- MAIN BENCHMARK ---

async function runBenchmark() {
    console.log('--- DEEP RESEARCH PROVIDER BENCHMARK ---\n');

    const leadName = "PINSPARK";
    const leadWebsite = "pinspark.com";

    // THE NEW "DEEP RESEARCH" PROMPT
    const prompt = `
    Analyze the e-commerce brand "${leadName}" (Website: ${leadWebsite} or search for it).
    
    PERFORM A DEEP STRATEGIC ANALYSIS to help a marketing agency pitch video editing services to them.
    
    Your Output MUST be structured as a JSON object with the following fields:
    
    1. "company_overview": Concise but specific summary of who they are.
    2. "target_audience": Detailed buyer persona (age, interests, values).
    3. "current_content_strategy": Analyze their likely Instagram/TikTok/Website presence. Do they use video? Is it static? Is it high quality?
    4. "pain_points": 3-5 SPECIFIC pain points inferred from their digital presence (e.g. "Instagram feed is 90% static images, missed opportunity for reach", "Website lacks founder story/trust triggers", "Inconsistent posting schedule").
    5. "strategic_recommendations": 3 specific ideas for how Short-Form Video (Reels/TikTok) could solve their pain points and drive sales.
    
    RETURN JSON ONLY. No preamble.
    `;

    console.log(`Target: ${leadName} (${leadWebsite})`);
    console.log(`Prompt Length: ${prompt.length} chars\n`);

    // Run in parallel
    console.log('Running tests...');

    const [grokResult, perplexityResult, claudeResult] = await Promise.all([
        testGrok(prompt),
        testPerplexity(prompt),
        testClaude(prompt)
    ]);

    console.log('\n================ GROK RESULTS ================\n');
    console.log(grokResult.substring(0, 1000) + (grokResult.length > 1000 ? '...' : ''));

    console.log('\n================ PERPLEXITY RESULTS ================\n');
    console.log(perplexityResult.substring(0, 1000) + (perplexityResult.length > 1000 ? '...' : ''));

    console.log('\n================ CLAUDE RESULTS ================\n');
    console.log(claudeResult.substring(0, 1000) + (claudeResult.length > 1000 ? '...' : ''));

    console.log('\n\n--- BENCHMARK COMPLETE ---');
}

runBenchmark();
