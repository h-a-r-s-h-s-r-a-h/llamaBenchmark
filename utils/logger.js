const fs = require('fs');
const path = require('path');

class BenchmarkLogger {
    constructor() {
        // Use a fixed results directory so chunks append to the same files
        this.outputDir = path.join(process.cwd(), 'results');
        fs.mkdirSync(this.outputDir, { recursive: true });

        this.logFile = path.join(this.outputDir, 'detailed_log.txt');
        this.csvFile = path.join(this.outputDir, 'results.csv');

        const start = process.env.START_QUESTION || '1';
        const end = process.env.END_QUESTION || 'ALL';

        // If CSV doesn't exist, create it with headers
        if (!fs.existsSync(this.csvFile)) {
            fs.writeFileSync(this.csvFile,
                'question_number,topic,answer_type,question,expected_answer,llm_answer,correct,match_type,judge_reasoning,accuracy_percent\n'
            );
        }

        // Append a chunk header to the log
        const chunkHeader =
            `\n${'='.repeat(80)}\n` +
            `  LLM BENCHMARK — CHUNK RUN (Questions ${start} to ${end})\n` +
            `  Model: ${process.env.LLM_MODEL_NAME}\n` +
            `  Started: ${new Date().toLocaleString()}\n` +
            `${'='.repeat(80)}\n\n`;

        fs.appendFileSync(this.logFile, chunkHeader);

        console.log(`📁 Results will be saved to: ${this.outputDir}`);
    }

    /**
     * Log a single question result
     */
    logResult({ questionNum, total, topic, answerType, question, expectedAnswer, llmAnswer, correct, matchType, reasoning, accuracyPercent }) {
        const verdict = correct ? '✅ CORRECT' : '❌ INCORRECT';

        // Write to detailed log
        const logEntry =
            `${'─'.repeat(80)}\n` +
            `  Question ${questionNum}/${total}  |  Topic: ${topic}  |  Type: ${answerType}\n` +
            `${'─'.repeat(80)}\n` +
            `  Q: ${question}\n\n` +
            `  Expected Answer : ${expectedAnswer}\n` +
            `  LLM Answer      : ${llmAnswer.substring(0, 500)}${llmAnswer.length > 500 ? '...(truncated)' : ''}\n\n` +
            `  Verdict: ${verdict}  (Match Type: ${matchType})\n` +
            `  Judge Reasoning : ${reasoning}\n` +
            `  Running Accuracy: ${accuracyPercent}%\n\n`;

        fs.appendFileSync(this.logFile, logEntry);

        // Write to CSV (escape fields properly)
        const escapeCsv = (str) => `"${String(str).replace(/"/g, '""')}"`;
        const csvRow = [
            questionNum,
            escapeCsv(topic),
            escapeCsv(answerType),
            escapeCsv(question),
            escapeCsv(expectedAnswer),
            escapeCsv(llmAnswer.substring(0, 1000)),
            correct ? 'TRUE' : 'FALSE',
            escapeCsv(reasoning),
            matchType,
            accuracyPercent
        ].join(',') + '\n';

        fs.appendFileSync(this.csvFile, csvRow);
    }

    /**
     * Write chunk summary to the log
     */
    logSummary({ total, correct, incorrect, errors, finalAccuracy, elapsedTime, startQ, endQ }) {
        const summary =
            `\n${'='.repeat(80)}\n` +
            `  CHUNK SUMMARY (Questions ${startQ} to ${endQ})\n` +
            `${'='.repeat(80)}\n` +
            `  Questions in chunk : ${total}\n` +
            `  Correct            : ${correct}\n` +
            `  Incorrect          : ${incorrect}\n` +
            `  Errors/Timeouts    : ${errors}\n` +
            `  Chunk Accuracy     : ${finalAccuracy}%\n` +
            `  Time Elapsed       : ${elapsedTime}\n` +
            `  Model              : ${process.env.LLM_MODEL_NAME}\n` +
            `  Finished           : ${new Date().toLocaleString()}\n` +
            `${'='.repeat(80)}\n`;

        fs.appendFileSync(this.logFile, summary);
        console.log(summary);
    }
}

module.exports = { BenchmarkLogger };
