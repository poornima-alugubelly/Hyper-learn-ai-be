require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
const NodeCache = require('node-cache');

const app = express();
const PORT = process.env.PORT || 3001;

const problemCache = new NodeCache({
    stdTTL: 3600,
    checkperiod: 600
});

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

function generateCacheKey(topic, language, difficulty) {
    return `${topic.toLowerCase()}_${language.toLowerCase()}_${difficulty.toLowerCase()}`;
}

function checkCache(req, res, next) {
    const { topic, language, difficulty } = req.body;
    const cacheKey = generateCacheKey(topic, language, difficulty);
    
    const cachedResult = problemCache.get(cacheKey);
    if (cachedResult) {
        console.log('Cache hit for:', cacheKey);
        return res.json(cachedResult);
    }
    
    console.log('Cache miss for:', cacheKey);
    next();
}

async function generateProblems(topic, language, difficulty = 'beginner') {
    const difficultyParams = {
        beginner: {
            concepts: ['Basic syntax and usage', 'Fundamental patterns', 'Simple implementations', 'Core concepts'],
            prerequisites: ['Basic programming knowledge', 'Language fundamentals'],
            complexityLevel: 'Low - suitable for beginners',
            realWorldContext: 'Simple, practical examples',
            problemTypes: ['Basic implementation', 'Simple modifications', 'Understanding core concepts', 'Fundamental usage patterns'],
            expectedOutcomes: ['Grasp basic concepts', 'Build confidence', 'Develop fundamental skills']
        },
        intermediate: {
            concepts: ['Advanced patterns', 'Performance optimization', 'Best practices', 'Error handling', 'Complex implementations'],
            prerequisites: ['Solid understanding of basics', 'Some practical experience'],
            complexityLevel: 'Medium - challenging but manageable',
            realWorldContext: 'Realistic scenarios from actual projects',
            problemTypes: ['Feature implementation', 'Code optimization', 'Bug fixing', 'Pattern application'],
            expectedOutcomes: ['Improve code quality', 'Handle edge cases', 'Apply best practices']
        },
        advanced: {
            concepts: ['System design', 'Advanced optimization', 'Complex architectures', 'Deep technical concepts'],
            prerequisites: ['Strong programming background', 'Extensive practical experience'],
            complexityLevel: 'High - requires deep understanding',
            realWorldContext: 'Enterprise-level challenges',
            problemTypes: ['Architecture design', 'Performance tuning', 'Complex system integration', 'Advanced optimization'],
            expectedOutcomes: ['Master advanced concepts', 'Handle complex scenarios', 'Design robust solutions']
        }
    };

    const difficultyConfig = difficultyParams[difficulty.toLowerCase()];

    const prompt = `Create a focused learning journey of 5 ${difficulty.toLowerCase()} level programming problems about ${topic} in ${language}. 
Each problem MUST be significantly different and progressively more challenging within the ${difficulty} level.

Difficulty Level Specifications:
${Object.entries(difficultyConfig).map(([key, value]) => `- ${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('\n')}

Problem design requirements:
- Make problems practical and applicable to real-world scenarios
- Ensure problems are solvable with reasonable effort for the difficulty level
- Avoid ambiguity in problem statements
- Include edge cases and validation requirements
- Problems should build on concepts from previous problems where appropriate
- Focus on quality, clarity, and educational value over complexity
- Include specific time complexity or optimization goals where appropriate

Return ONLY a JSON object with this exact structure:
{
  "topic": "${topic}",
  "language": "${language}",
  "learningPath": {
    "description": "Detailed description of the ${difficulty} level learning journey for ${topic}, highlighting progression and key learning outcomes",
    "problems": [
      {
        "level": "number (1-5)",
        "title": "Clear, specific problem title",
        "concepts": ["2-4 specific concepts covered"],
        "description": "Detailed problem description with clear requirements and constraints",
        "prerequisites": ["Specific required knowledge"],
        "learningOutcome": "What will be learned from solving this problem",
        "hints": ["1-2 helpful hints without giving away the solution"]
      }
    ]
  }
}`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a senior software engineer and computer science educator creating structured learning paths. Your specialty is creating clear, practical programming problems that teach important concepts progressively. Focus on real-world applicability and clear explanations. Each problem should have a distinct focus that builds on previous problems. IMPORTANT: You must return a valid JSON object exactly matching the specified structure."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 4000,
            top_p: 0.95,
            frequency_penalty: 0.2,
            presence_penalty: 0.1,
            response_format: { "type": "json_object" }
        });

        let jsonStr = response.choices[0].message.content.trim();
        let parsed;
        
        try {
            // First attempt: direct parse
            parsed = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error('Initial JSON parse error:', parseError);
            
            try {
                // Second attempt: try to extract JSON from markdown code blocks
                const jsonMatch = jsonStr.match(/```json\n([\s\S]*)\n```/) || 
                                jsonStr.match(/```\n([\s\S]*)\n```/) ||
                                jsonStr.match(/{[\s\S]*}/);
                
                if (jsonMatch) {
                    const extractedJson = jsonMatch[1] || jsonMatch[0];
                    // Clean up any potential markdown artifacts
                    const cleanedJson = extractedJson
                        .replace(/\\n/g, '\n')
                        .replace(/\\"/g, '"')
                        .replace(/\\\\/g, '\\')
                        .trim();
                    parsed = JSON.parse(cleanedJson);
                } else {
                    throw new Error('No JSON structure found in the response');
                }
            } catch (extractError) {
                console.error('Failed to extract JSON:', extractError);
                // Return a minimal valid structure
                return {
                    topic: topic,
                    language: language,
                    learningPath: {
                        description: "Error generating learning path. Please try again.",
                        problems: [{
                            level: 1,
                            title: "Error Generating Problems",
                            concepts: ["Error Recovery"],
                            description: "Failed to generate problems. Please try again with more specific parameters.",
                            prerequisites: ["None"],
                            learningOutcome: "Please try again",
                            hints: ["Try again with different parameters"]
                        }]
                    }
                };
            }
        }

        // Validate the structure of the parsed JSON
        if (!parsed.learningPath || !parsed.learningPath.problems) {
            throw new Error('Invalid response structure');
        }

        // Ensure all problems have the required fields
        parsed.learningPath.problems = parsed.learningPath.problems.map(problem => ({
            level: problem.level || 1,
            title: problem.title || 'Untitled Problem',
            concepts: Array.isArray(problem.concepts) ? problem.concepts : ['Concept not specified'],
            description: problem.description || 'Description not provided',
            prerequisites: Array.isArray(problem.prerequisites) ? problem.prerequisites : ['Prerequisites not specified'],
            learningOutcome: problem.learningOutcome || 'Learning outcome not specified',
            hints: Array.isArray(problem.hints) ? problem.hints : ['No hints provided']
        }));

        return parsed;
    } catch (error) {
        console.error('Error generating problems:', error.message);
        throw new Error('Failed to generate problems: ' + error.message);
    }
}

async function validateProblems(generatedProblems, topic, language, difficulty) {
    // Validate the overall structure
    if (!generatedProblems || 
        !generatedProblems.learningPath || 
        !generatedProblems.learningPath.problems || 
        !Array.isArray(generatedProblems.learningPath.problems)) {
        console.error('Invalid problem structure');
        return false;
    }
    
    const problems = generatedProblems.learningPath.problems;
    
    // Check if we have enough problems
    if (problems.length < 2) {  
        console.error('Not enough problems generated');
        return false;
    }
    
    // Count valid problems
    let validProblems = 0;
    
    // Check each problem for required fields
    for (const problem of problems) {
        let isValid = true;
        
        // Basic field presence check
        if (!problem.title || !problem.description || !problem.concepts || 
            !problem.prerequisites || !problem.learningOutcome) {
            console.warn('Problem missing some fields:', problem.title);
            isValid = false;
        }
        
        // More lenient description length check
        if (problem.description && problem.description.length < 50) {  
            console.warn('Problem description too short:', problem.title);
            isValid = false;
        }
        
        // More lenient concepts check
        if (!Array.isArray(problem.concepts) || problem.concepts.length < 1) {  
            console.warn('Problem has insufficient concepts:', problem.title);
            isValid = false;
        }
        
        if (isValid) {
            validProblems++;
        }
    }
    
    // Consider validation successful if we have at least 2 valid problems
    const isValid = validProblems >= 2;
    if (isValid) {
        console.log(`Validation passed with ${validProblems} valid problems`);
    } else {
        console.error(`Validation failed. Only ${validProblems} valid problems found`);
    }
    
    return isValid;
}

app.post('/generate-problems', checkCache, async (req, res) => {
    try {
        console.log('Received request:', req.body);
        const { topic, language, difficulty } = req.body;
        
        let result = await generateProblems(topic, language, difficulty);
        
        // Validate the generated problems
        const isValid = await validateProblems(result, topic, language, difficulty);
        
        // If not valid, regenerate once
        if (!isValid) {
            console.log('Generated problems failed validation, regenerating...');
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            const regeneratedResult = await generateProblems(topic, language, difficulty);
            const revalidated = await validateProblems(regeneratedResult, topic, language, difficulty);
            
            if (revalidated) {
                console.log('Regenerated problems validated successfully');
                result = regeneratedResult;
            } else {
                console.log('Regeneration also failed validation, using best effort result');
            }
        }
        
        const response = {
            learningPath: {
                problems: result.learningPath.problems,
                description: result.learningPath.description
            }
        };
        
        // Cache the response
        const cacheKey = generateCacheKey(topic, language, difficulty);
        problemCache.set(cacheKey, response);
        
        res.json(response);
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