const axios = require('axios');

const LLM_LINK = process.env.LLM_LINK;
const LLM_MODEL_NAME = process.env.LLM_MODEL_NAME;

/**
 * Use the LLM itself to judge whether the given answer matches the expected answer.
 * @param {string} llmAnswer - The LLM's response to the original question
 * @param {string} expectedAnswer - The correct/expected answer
 * @returns {Promise<{ correct: boolean, matchType: string, reasoning: string }>}
 */
async function checkAnswer(llmAnswer, expectedAnswer) {
    if (!llmAnswer || llmAnswer.startsWith('[ERROR')) {
        return { correct: false, matchType: 'error', reasoning: 'LLM returned an error or empty response.' };
    }

    const judgePrompt = `You are a strict answer-checking judge. Compare the "Given Answer" against the "Expected Answer" and determine if the Given Answer is correct.

Rules:
- The Given Answer is CORRECT if it contains the same factual information as the Expected Answer, even if it includes extra details or different wording.
- The Given Answer is INCORRECT if it provides wrong information, a different name/number/date, or does not answer the question.
- Focus on the core factual content, not on formatting or extra explanation.
- Be strict: partial matches or vague answers should be marked INCORRECT.

Expected Answer: ${expectedAnswer}
Given Answer: ${llmAnswer}

Respond with EXACTLY one line in this format:
CORRECT|<brief reason>
or
INCORRECT|<brief reason>`;

    try {
        const response = await axios.post(
            LLM_LINK,
            {
                model: LLM_MODEL_NAME,
                prompt: judgePrompt,
                stream: false
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 60000
            }
        );

        const judgeResponse = (response.data.response || '').trim();
        const firstLine = judgeResponse.split('\n')[0].trim();

        if (firstLine.toUpperCase().startsWith('CORRECT')) {
            const reasoning = firstLine.split('|').slice(1).join('|').trim() || 'Matched';
            return { correct: true, matchType: 'llm_verified', reasoning };
        } else {
            const reasoning = firstLine.split('|').slice(1).join('|').trim() || 'Did not match';
            return { correct: false, matchType: 'llm_rejected', reasoning };
        }
    } catch (error) {
        console.error(`  ⚠️ Judge LLM error: ${error.message}, falling back to string match`);
        // Fallback: simple containment check if the judge call fails
        const normLLM = llmAnswer.toLowerCase().trim();
        const normExpected = expectedAnswer.toLowerCase().trim();
        const correct = normLLM.includes(normExpected) || normExpected.includes(normLLM);
        return { correct, matchType: 'fallback', reasoning: 'Judge LLM failed, used string fallback' };
    }
}

module.exports = { checkAnswer };
