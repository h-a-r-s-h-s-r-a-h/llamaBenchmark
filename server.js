require('dotenv').config();

const { run } = require('./controllers/benchmarkController');

(async () => {
    const startTime = Date.now();

    try {
        await run();
    } catch (error) {
        console.error('\n💥 Benchmark failed with error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n⏱️  Total wall time: ${elapsed}s`);
})();
