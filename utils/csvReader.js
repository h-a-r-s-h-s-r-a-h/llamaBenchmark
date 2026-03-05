const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

/**
 * Read and parse the SimpleQA CSV dataset
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Array>} Array of question objects
 */
function readCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                // Skip rows where problem or expected_answer is empty
                if (row.problem && row.expected_answer && row.problem.trim() && row.expected_answer.trim()) {
                    results.push({
                        topic: (row.topic || '').trim(),
                        answer_type: (row.answer_type || '').trim(),
                        problem: row.problem.trim(),
                        expected_answer: row.expected_answer.trim()
                    });
                }
            })
            .on('end', () => {
                console.log(`📊 Loaded ${results.length} questions from dataset`);
                resolve(results);
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}

module.exports = { readCSV };
