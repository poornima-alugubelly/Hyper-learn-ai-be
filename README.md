# Programming Practice Generator - Backend

This is the backend server for the Programming Practice Generator tool. It uses the DeepSeek Coder model through Ollama to generate programming problems based on user input.

## Prerequisites

1. Install Ollama:
```bash
brew install ollama
```

2. Start Ollama service:
```bash
brew services start ollama
```

3. Pull the DeepSeek model:
```bash
ollama pull deepseek-coder
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
node index.js
```

The server will start on port 3001.

## API Endpoints

### POST /generate-problems
Generates programming problems based on the provided topic, language, and difficulty level.

Request body:
```json
{
  "topic": "Binary Trees",
  "language": "Python",
  "difficulty": "beginner"
}
```

Response:
```json
{
  "problems": [
    {
      "statement": "Problem statement here",
      "example": "Example input/output here",
      "hints": "Hints for solving here",
      "objectives": "Learning objectives here"
    }
  ]
}
```

## Environment Variables

- `PORT`: Port number for the server (default: 3001)

## Benefits of Using DeepSeek

- Free and open-source
- Specifically optimized for coding tasks
- Fast local execution
- No API costs
- Complete privacy (all processing done locally)
