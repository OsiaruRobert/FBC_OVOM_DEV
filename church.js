import express from 'express';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Recreate __dirname for ES modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// --- Configuration ---
const port = 3000;
const ai = new GoogleGenAI({ apiKey: process.env.KEY });

/**
 * POST /ask
 * Body: { "question": "Your question here" }
 */
app.post('/ask', async (req, res) => {


  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Please provide a question." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: question,
      config: {
        tools: [{
          fileSearch: { fileSearchStoreNames: [process.env.FBC_STORE] }
        }]
      }
    });
    console.log("AI Response:", response.text);
    res.json({ answer: response.text });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);

});