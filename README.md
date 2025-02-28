# Programming Practice Generator - Backend

This is the backend server for the Programming Practice Generator tool. It uses OpenAI's GPT models to generate structured programming problems based on user input, with support for multiple difficulty levels and programming languages.

## Features

- Generate programming problems with varying difficulty levels (Beginner, Intermediate, Advanced)
- Structured learning paths with clear progression
- Support for multiple programming languages
- Detailed problem descriptions with examples and prerequisites
- Real-world context and practical applications

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hands-on-programming-tool-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
OPENAI_API_KEY=your_api_key_here
```

## Configuration

The server uses the following environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key
- `PORT`: Server port (default: 3001)

## API Endpoints

### Generate Problems
- **URL**: `/generate-problems`
- **Method**: `POST`
- **Body**:
```json
{
  "topic": "string",
  "language": "string",
  "difficulty": "beginner|intermediate|advanced"
}
```
- **Response**:
```json
{
  "topic": "string",
  "language": "string",
  "learningPath": {
    "description": "string",
    "problems": [
      {
        "level": "number",
        "title": "string",
        "concepts": ["string"],
        "description": "string",
        "examples": [
          {
            "input": "string",
            "output": "string",
            "explanation": "string"
          }
        ],
        "prerequisites": ["string"]
      }
    ]
  }
}
```

## Difficulty Levels

### Beginner
- Basic syntax and operations
- Standard library functions
- Simple, everyday examples
- Low complexity problems

### Intermediate
- Data structures and algorithms
- Error handling
- Best practices
- Practical applications

### Advanced
- Advanced algorithms
- Design patterns
- Optimization techniques
- Industry-level problems

## Running the Server

1. Start the server:
```bash
node index.js
```

2. The server will start on port 3001 (default)

## Error Handling

The server includes comprehensive error handling for:
- Invalid requests
- API timeouts
- JSON parsing errors
- Connection issues

## Development

To run in development mode with auto-reload:
```bash
npm install -g nodemon
nodemon index.js
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
