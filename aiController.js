
// This will only work for SDK newer than 2.0.0
import { GoogleGenAI } from "@google/genai";


const keys = [
    process.env.KEY1,
    process.env.KEY2,
    process.env.KEY3,
    process.env.KEY4,
    process.env.KEY5,
    process.env.KEY6,
    process.env.KEY7,
    process.env.KEY8,
    process.env.KEY9,
    process.env.KEY10
];

let currentKeyIndex = 0;

const ai = new GoogleGenAI({
    apiKey: keys[currentKeyIndex], // Ensure you have GEMINI_API_KEY set in your .env file
});

async function responder(message) {

    const response = await ai.models.generateContent({
    //    model: "gemini-2.5-flash",
    model: "gemini-3-flash-preview",
        contents: message,
        store: false,
        config: {
            tools: [{
                fileSearch: { fileSearchStoreNames: [process.env.FBC_STORE] }
            }]
        }
    });

    return response.text;

}


async function controller(req, res) {
    try {
        let { message } = req.body;
        console.log(message)
        const reply = await responder(message)

        res.status(200).json({ "reply": reply })
    } catch (error) {
        console.error("Error in /chat endpoint:", error);
        if(error.status === 429 ) {
            currentKeyIndex = (currentKeyIndex + 1) % keys.length;
            console.log(`Switching to next API key: ${keys[currentKeyIndex]}`);
            return controller(req, res); // Retry with the next key
        }
        res.status(500).json({ error: "Please try again later." });
    }
}
export default controller;
