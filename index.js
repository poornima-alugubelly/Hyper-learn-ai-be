const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Ollama = require('ollama');

const app = express();
const PORT = process.env.PORT || 3001;

const ollama = new Ollama();

app.use(cors());
app.use(bodyParser.json());

async function generateProblems(topic, language, difficulty = 'beginner') {
    const prompt = `Create 3 programming problems about ${topic} in ${language}. 
    For each problem, include:
    1. A clear problem statement
    2. Example input/output
    3. Hints for solving
    4. Learning objectives
    Make the problems progressively harder, starting from ${difficulty} level.
    Format the response in JSON with the following structure:
    [
      {
        "statement": "Problem statement here",
        "example": "Example input/output here",
        "hints": "Hints for solving here",
        "objectives": "Learning objectives here"
      }
    ]
    IMPORTANT: Ensure the response is valid JSON that can be parsed.`;

    try {
        const response = await ollama.generate({
            model: 'deepseek-coder',
            prompt: prompt,
            stream: false
        });


        const jsonStr = response.response.trim();

        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('Error generating problems:', error);
        throw error;
    }
}

app.post('/generate-problems', async (req, res) => {
    try {
        const { topic, language, difficulty } = req.body;
        const problems = await generateProblems(topic, language, difficulty);
        res.json({ problems });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to generate problems' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
