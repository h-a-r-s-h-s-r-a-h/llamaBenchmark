const path = require('path');
const { readCSV } = require('../utils/csvReader');
const { askLLM } = require('../utils/llmClient');
const { checkAnswer } = require('../utils/answerChecker');
const { BenchmarkLogger } = require('../utils/logger');

/**
 * Run the benchmark (supports chunk-based execution via START_QUESTION / END_QUESTION)
 */
async function run() {
    const csvPath = path.join(process.cwd(), 'simpleqa_full_dataset.csv');

    // Read chunk range from .env (1-indexed)
    const startQ = parseInt(process.env.START_QUESTION) || 1;
    const endQEnv = process.env.END_QUESTION;

    console.log('\n🚀 Starting LLM Benchmark...');
    console.log(`📡 LLM Endpoint: ${process.env.LLM_LINK}`);
    console.log(`🤖 Model: ${process.env.LLM_MODEL_NAME}`);

    // Step 1: Load full dataset
    const allQuestions = await readCSV(csvPath);
    const totalDataset = allQuestions.length;

    if (totalDataset === 0) {
        console.error('❌ No questions loaded from dataset. Check CSV file.');
        process.exit(1);
    }

    // Step 2: Slice to the requested chunk
    const endQ = endQEnv ? Math.min(parseInt(endQEnv), totalDataset) : totalDataset;
    const questions = allQuestions.slice(startQ - 1, endQ);
    const chunkSize = questions.length;

    console.log(`📎 Running chunk: questions ${startQ} to ${endQ} (${chunkSize} questions)\n`);

    // Step 3: Initialize logger and counters
    const logger = new BenchmarkLogger();
    let correctCount = 0;
    let errorCount = 0;
    const startTime = Date.now();

    // Step 4: Process each question
    for (let i = 0; i < chunkSize; i++) {
        const q = questions[i];
        const questionNum = startQ + i; // absolute question number

        // Ask the LLM
        const llmAnswer = await askLLM(q.problem);

        // Check the answer using LLM as judge
        const result = await checkAnswer(llmAnswer, q.expected_answer);

        if (result.correct) correctCount++;
        if (llmAnswer.startsWith('[ERROR')) errorCount++;

        const accuracyPercent = ((correctCount / (i + 1)) * 100).toFixed(2);

        // Log result
        logger.logResult({
            questionNum,
            total: endQ,
            topic: q.topic,
            answerType: q.answer_type,
            question: q.problem,
            expectedAnswer: q.expected_answer,
            llmAnswer,
            correct: result.correct,
            matchType: result.matchType,
            reasoning: result.reasoning,
            accuracyPercent
        });

        // Console progress
        const icon = result.correct ? '✅' : '❌';
        console.log(
            `[${questionNum}/${endQ}] ${icon} ${result.correct ? 'Correct' : 'Incorrect'} ` +
            `(${result.matchType}) — Accuracy: ${accuracyPercent}% ` +
            `| Topic: ${q.topic || 'N/A'}`
        );
    }

    // Step 5: Chunk summary
    const elapsedMs = Date.now() - startTime;
    const hours = Math.floor(elapsedMs / 3600000);
    const minutes = Math.floor((elapsedMs % 3600000) / 60000);
    const seconds = Math.floor((elapsedMs % 60000) / 1000);
    const elapsedTime = `${hours}h ${minutes}m ${seconds}s`;

    logger.logSummary({
        total: chunkSize,
        correct: correctCount,
        incorrect: chunkSize - correctCount - errorCount,
        errors: errorCount,
        finalAccuracy: ((correctCount / chunkSize) * 100).toFixed(2),
        elapsedTime,
        startQ,
        endQ
    });
}

module.exports = { run };
