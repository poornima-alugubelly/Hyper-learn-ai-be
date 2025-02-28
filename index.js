const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

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
    ]`;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-3.5-turbo",
        });

        return completion.choices[0].message.content;
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
