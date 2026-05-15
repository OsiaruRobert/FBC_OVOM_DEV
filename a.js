import express from "express";
import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({
    apiKey: process.env.KEY,
});

const app = express();
app.use(express.json());


//Message
const history = [];

console.log("Received message:", "Heintrllo");
// Append user message to history
history.push({
    type: "user_input",
    content: [
        {
            type: "text",
            text: "Hi, My name is Osiaru, I am a software developer. Can you tell me a joke?"
        }
    ]
});

const chat1 = await ai.interactions.create({
    model: "gemini-3-flash-preview",
    store: false,
    input: history
});

// Append model response steps to history
history.push(...chat1.steps);
console.log("Sending response:", chat1.steps.at(-1).content[0].text);


app.post("/message", async (req, res) => {
    const { message } = req.body;

    console.log("Received message:", message);
    // Append user message to history
    history.push({
        type: "user_input",
        content: [
            {
                type: "text",
                text: message
            }
        ]
    });
    try {

        const chat = await ai.interactions.create({
            model: "gemini-3-flash-preview",
            store: false,
            input: history
        });

        // Append model response steps to history
        history.push(...chat.steps);
        console.log("Sending response:", chat.steps.at(-1).content[0].text);

        res.status(200).json({
            response: chat.steps.at(-1).content[0].text
        });

    } catch (error) {
        console.error("Error processing message:", error);
        res.status(500).json({ error: "An error occurred while processing the message." });

    }
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});