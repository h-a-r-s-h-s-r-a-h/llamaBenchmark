# LLM Benchmark — SimpleQA Accuracy Tester

Benchmark the accuracy of a local LLM (via [Ollama](https://ollama.com)) against the **SimpleQA** dataset (4,326 factual questions). The LLM itself acts as the judge to verify answers.

## 📥 Benchmark Report

**[Click here to download the benchmark report](https://drive.google.com/drive/folders/1xrjJYE3BFkG3SAIe7ifq0jLyAhzCDbKk?usp=sharing)**

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Make sure Ollama is running with your model
ollama run llama3.2

# 3. Configure .env (see below)

# 4. Run the benchmark
node server.js
```

## ⚙️ Configuration (`.env`)

| Variable | Description | Example |
|---|---|---|
| `LLM_LINK` | Ollama API endpoint | `http://localhost:11434/api/generate` |
| `LLM_MODEL_NAME` | Model to benchmark | `llama3.2` |
| `START_QUESTION` | First question to test (1-indexed) | `1` |
| `END_QUESTION` | Last question to test | `100` |

### Run in Chunks

Test in batches by changing `START_QUESTION` and `END_QUESTION` — results **append** to the same output files:

```env
# Chunk 1
START_QUESTION=1
END_QUESTION=100

# Chunk 2 (update .env, then run again)
START_QUESTION=101
END_QUESTION=200
```

## 📊 Output

Results are saved to the `results/` directory:

| File | Description |
|---|---|
| `detailed_log.txt` | Human-readable log — question, LLM answer, expected answer, verdict, judge reasoning, running accuracy |
| `results.csv` | Machine-readable CSV with all data |

### Sample Log Entry

```
──────────────────────────────────────────────────
  Question 1/100  |  Topic: Science and technology  |  Type: Person
──────────────────────────────────────────────────
  Q: Who received the IEEE Frank Rosenblatt Award in 2010?

  Expected Answer : Michio Sugeno
  LLM Answer      : Michio Sugeno

  Verdict: ✅ CORRECT  (Match Type: llm_verified)
  Judge Reasoning : Both answers identify Michio Sugeno
  Running Accuracy: 100.00%
```

## 🏗️ Project Structure

```
├── server.js                  # Entry point
├── controllers/
│   └── benchmarkController.js # Main orchestration loop
├── utils/
│   ├── csvReader.js           # CSV dataset parser
│   ├── llmClient.js           # Ollama API client
│   ├── answerChecker.js       # LLM-as-judge answer verification
│   └── logger.js              # Log & CSV writer
├── simpleqa_full_dataset.csv  # SimpleQA dataset (4,326 questions)
├── results/                   # Output directory (auto-created)
└── .env                       # Configuration
```

## 🔍 How It Works

1. **Ask** — Each question is sent to the LLM with a concise-answer prompt
2. **Judge** — The LLM answer + expected answer are sent back to the LLM to judge correctness
3. **Log** — Verdict, reasoning, and running accuracy are written to both log and CSV
4. **Repeat** — Accuracy updates after every single question
