import express from 'express';
import OpenAI from 'openai';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.scitely.com/v1',
});

app.post('/analyze', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'No code provided.' });

    const prompt = `
Analyze this code and tell me what obfuscator it is. 
You can research if needed. 
If it is not obfuscated, say so. 
Always respond with JSON ONLY in this format:

{
  "obf": "OBFUSCATOR_NAME_OR_NONE",
  "confidence": "XX.XX%"
}

Code to analyze:
${code}
    `;

    const completion = await client.chat.completions.create({
      model: 'deepseek-v3.2',
      messages: [
        { role: 'system', content: 'You are an expert in code analysis and obfuscators.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1024
    });

    let aiResponse = completion.choices[0].message.content.trim();
    try {
      aiResponse = JSON.parse(aiResponse);
    } catch {
      aiResponse = { obf: "unknown", confidence: "0%" };
    }

    res.json(aiResponse);

  } catch (err) {
    res.status(500).json({ error: 'Something went wrong.', details: err.message });
  }
});

app.get('/', (req, res) => res.send('Obfuscator Detector API is running!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
