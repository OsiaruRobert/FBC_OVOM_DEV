import express from 'express';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// --- Configuration ---
const port = 3000;
const ai = new GoogleGenAI({ apiKey: process.env.KEY });

const PUBLIC_FILE_URLS = [
  'https://ppqimg.s3.eu-north-1.amazonaws.com/C/FBC+OVOM+MARRIAGE+GUIDELINES%2C+STEPS+%26+UNDERTAKING+2020.docx',
  'https://ppqimg.s3.eu-north-1.amazonaws.com/C/FBC+OVOM+-+Membership+Orientation+Course+Manual.pdf'
];

let activeStoreName = null;
let isStoreReady = false;

async function initializeSearchStore() {
  console.log('--- Initializing Search Store from Public S3 URLs ---');

  try {
    const fileSearchStore = await ai.fileSearchStores.create({
      config: {
        displayName: `public-s3-sync-${Date.now()}`,
        embeddingModel: 'models/gemini-embedding-2'
      }
    });
    activeStoreName = fileSearchStore.name;

    for (const fileUrl of PUBLIC_FILE_URLS) {
      const fileName = fileUrl.split('/').pop();
      console.log(`Processing: ${fileName}`);

      const tempFilePath = path.join(__dirname, 'temp_' + fileName);

      try {
        const response = await fetch(fileUrl);
        if (!response.ok) {
          console.error(`Failed to download ${fileName}: ${response.statusText}`);
          continue;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(tempFilePath, buffer);

        let operation = await ai.fileSearchStores.uploadToFileSearchStore({
          file: tempFilePath,
          fileSearchStoreName: activeStoreName,
          config: { displayName: fileName }
        });

        // Poll until indexing is complete
        while (!operation.done) {
          await new Promise(r => setTimeout(r, 3000));
          operation = await ai.operations.get({ name: operation.name });
        }

        fs.unlinkSync(tempFilePath);
        console.log(`Indexed: ${fileName}`);
      } catch (err) {
        console.error(`Error processing ${fileName}:`, err.message);
        // cleanup temp file if it still exists
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      }
    }

    isStoreReady = true;
    console.log('--- Store Ready for Queries ---');
  } catch (error) {
    console.error('Failed to initialize store:', error);
  }
}

app.post('/ask', async (req, res) => {
  if (!isStoreReady) {
    return res.status(503).json({ error: 'Search store is still indexing. Try again soon.' });
  }

  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Please provide a question.' });
    }

    console.log(activeStoreName)

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: question,
      config: {
        tools: [{
          fileSearch: { fileSearchStoreNames: [activeStoreName] }
        }]
      }
    });

    res.json({ answer: response.text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);
  await initializeSearchStore();
});