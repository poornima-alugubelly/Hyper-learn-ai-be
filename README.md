# Programming Practice Generator - Backend

This is the backend server for the Programming Practice Generator tool. It uses AI to generate programming problems based on user input.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
```

3. Start the server:
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

- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `PORT`: Port number for the server (default: 3001)

## Security Note
Make sure to never commit your `.env` file or expose your OpenAI API key. The `.env` file is included in `.gitignore` to prevent accidental commits.
