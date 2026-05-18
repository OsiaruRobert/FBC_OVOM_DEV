import express from "express";
import { GoogleGenAI } from '@google/genai' ;

import fs from "fs";
import path from "path";


const app = express();
app.use(express.json());

// --- Configuration ---
const port = 3000;
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY}); // Uses GEMINI_API_KEY from .env

// Define the public S3 URLs of the files you want to index
const PUBLIC_FILE_URLS = [
  "https://ppqimg.s3.eu-north-1.amazonaws.com/C/FBC+OVOM+MARRIAGE+GUIDELINES%2C+STEPS+%26+UNDERTAKING+2020.docx",
'https://ppqimg.s3.eu-north-1.amazonaws.com/C/FBC+OVOM+-+Membership+Orientation+Course+Manual.pdf'
];

let activeStoreName = null;
let isStoreReady = false;

/**
 * Downloads files from public S3 URLs and indexes them in Gemini
 */
async function initializeSearchStore() {
  console.log('--- Initializing Search Store from Public S3 URLs ---');
  
  try {
    // 1. Create the Gemini File Search Store
    const fileSearchStore = await ai.fileSearchStores.create({
      config: {
        displayName: `public-s3-sync-${Date.now()}`,
        embeddingModel: 'models/gemini-embedding-2'
      }
    });
    activeStoreName = fileSearchStore.name;

    // 2. Process each public URL
    for (const fileUrl of PUBLIC_FILE_URLS) {
      // Extract just the file name from the URL
      const fileName = fileUrl.split('/').pop(); 
      console.log(`Processing: ${fileName}`);

      const tempFilePath = path.join(__dirname, 'temp_' + fileName);

      try {
        // 3. Download the file using native fetch
        const response = await fetch(fileUrl);
        
        if (!response.ok) {
          console.error(`Failed to download ${fileName}: ${response.statusText}`);
          continue; // Skip to the next file if download fails
        }

        // Convert response to buffer and save locally
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(tempFilePath, buffer);

        // 4. Upload to Gemini Search Store
        let operation = await ai.fileSearchStores.uploadToFileSearchStore({
          file: tempFilePath,
          fileSearchStoreName: activeStoreName,
          config: { displayName: fileName }
        });
        
        // Wait for indexing
        while (!operation.done) {
          await new Promise(r => setTimeout(r, 3000));
          operation = await ai.operations.get({ operation });
        }
        
        // Cleanup local file
        fs.unlinkSync(tempFilePath);
        console.log(`Indexed: ${fileName}`);
        console.log(activeStoreName)
        console.log(activeStoreName)
        console.log(activeStoreName)
        
      } catch (err) {
        console.error(`Error processing ${fileName}:`, err.message);
      }
    }

    isStoreReady = true;
    console.log('--- Store Ready for Queries ---');
  } catch (error) {
    console.error('Failed to initialize store:', error);
  }
}

/**
 * POST /ask
 * Body: { "question": "Your question here" }
 */
app.post('/ask', async (req, res) => {
  if (!isStoreReady) {
    return res.status(503).json({ error: 'Search store is still indexing files. Please try again in a moment.' });
  }

  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Please provide a question." });
    }

    console.log(activeStoreName)

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
  // Start downloading and indexing immediately
  await initializeSearchStore();
});
