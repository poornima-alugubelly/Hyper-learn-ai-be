require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function generateProblems(topic, language, difficulty = 'beginner') {
    // Define difficulty-specific parameters
    const difficultyParams = {
        beginner: {
            concepts: ['Basic syntax', 'Simple operations', 'Standard library functions'],
            prerequisites: ['Basic programming knowledge'],
            complexityLevel: 'Low',
            realWorldContext: 'Simple, everyday examples'
        },
        intermediate: {
            concepts: ['Data structures', 'Algorithms', 'Error handling', 'Best practices'],
            prerequisites: ['Basic programming concepts', 'Language fundamentals'],
            complexityLevel: 'Medium',
            realWorldContext: 'Practical applications'
        },
        advanced: {
            concepts: ['Advanced algorithms', 'Design patterns', 'Optimization', 'Edge cases'],
            prerequisites: ['Strong programming background', 'Data structures', 'Algorithms'],
            complexityLevel: 'High',
            realWorldContext: 'Industry-level problems'
        }
    };

    const difficultyConfig = difficultyParams[difficulty.toLowerCase()];

    const prompt = `Create a learning journey of 5 ${difficulty.toLowerCase()} level programming problems about ${topic} in ${language}. 
The problems should match this difficulty level:
- Concepts: ${difficultyConfig.concepts.join(', ')}
- Prerequisites: ${difficultyConfig.prerequisites.join(', ')}
- Complexity: ${difficultyConfig.complexityLevel}
- Context: ${difficultyConfig.realWorldContext}

Return ONLY a JSON object like this:
{
  "topic": "${topic}",
  "language": "${language}",
  "learningPath": {
    "description": "Brief overview of the ${difficulty} level learning journey",
    "problems": [
      {
        "level": 1,
        "title": "Problem Title",
        "concepts": ["Specific concepts covered"],
        "description": "Clear problem description",
        "examples": [
          {
            "input": "Sample input",
            "output": "Expected output",
            "explanation": "Why this is important"
          }
        ],
        "prerequisites": ["Required knowledge"]
      }
    ]
  }
}`;

    console.log('Starting problem generation...');
    try {
        console.log('Sending request to OpenAI...');
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are a programming teacher creating a ${difficulty} level learning journey through carefully crafted problems. Each problem MUST:
1. Match the ${difficulty} difficulty level
2. Be COMPLETELY DIFFERENT from other problems
3. Focus on a UNIQUE aspect of ${topic}
4. Build upon previous concepts but teach something new
5. Be practical and relevant to real-world scenarios
6. Progress in complexity from basic to advanced within the ${difficulty} level
7. Help discover programming patterns intuitively

For ${difficulty} level:
- Concepts: ${difficultyConfig.concepts.join(', ')}
- Prerequisites: ${difficultyConfig.prerequisites.join(', ')}
- Complexity: ${difficultyConfig.complexityLevel}
- Context: ${difficultyConfig.realWorldContext}

Return ONLY valid JSON in the exact format specified.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.8,
            max_tokens: 2000
        });

        console.log('Received response from OpenAI');
        const jsonStr = response.choices[0].message.content.trim();
        console.log('Response length:', jsonStr.length);

        try {
            const parsed = JSON.parse(jsonStr);
            console.log('Successfully parsed JSON');
            return parsed;
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.log('Failed to parse JSON response');
            
            return {
                topic: topic,
                language: language,
                learningPath: {
                    description: "Error generating learning path",
                    problems: [{
                        level: 0,
                        title: "Error Generating Problems",
                        concepts: ["Error"],
                        description: "Failed to generate problems. Please try again.",
                        examples: [{
                            input: "N/A",
                            output: "N/A",
                            explanation: jsonStr
                        }],
                        prerequisites: []
                    }]
                }
            };
        }
    } catch (error) {
        console.error('Error generating problems:', error.message);
        throw new Error('Failed to generate problems: ' + error.message);
    }
}

app.post('/generate-problems', async (req, res) => {
    try {
        console.log('Received request:', req.body);
        const { topic, language, difficulty } = req.body;
        const problems = await generateProblems(topic, language, difficulty);
        console.log('Successfully generated problems');
        res.json(problems);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ 
            error: error.message || 'Failed to generate problems',
            details: error.stack
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
