const axios = require('axios');

const LLM_LINK = process.env.LLM_LINK;
const LLM_MODEL_NAME = process.env.LLM_MODEL_NAME;

/**
 * Send a prompt to the Ollama LLM and return the response
 * @param {string} prompt - The question to ask
 * @returns {Promise<string>} The LLM's response text
 */
async function askLLM(prompt) {
    try {
        const response = await axios.post(
            LLM_LINK,
            {
                model: LLM_MODEL_NAME,
                prompt: `Answer the following question concisely and directly. Give only the answer, no explanation needed.\n\nQuestion: ${prompt}`,
                stream: false
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 120000 // 120 second timeout
            }
        );

        return (response.data.response || '').trim();
    } catch (error) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            console.error(`  ⏰ Timeout for question: ${prompt.substring(0, 60)}...`);
            return '[ERROR: timeout]';
        }
        console.error(`  ❌ LLM Error: ${error.message}`);
        return `[ERROR: ${error.message}]`;
    }
}

module.exports = { askLLM };
