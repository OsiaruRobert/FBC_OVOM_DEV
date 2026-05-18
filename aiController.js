
// This will only work for SDK newer than 2.0.0
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.KEY, // Ensure you have GEMINI_API_KEY set in your .env file
});



async function responder(message) {
    const chat = await ai.interactions.create({
        model: "gemini-3-flash-preview",
        input: message,
        stream: true,
        system_instruction: "You are a christian AI chart bot. Your name is Silas. Members of the church asked you questons consigning marriage guidelines and you prove answers from  vector store .",
    });

    let reply = "";

    for await (const event of chat) {
        if (event.event_type === "step.delta") {
            if (event.delta.type === "text") {
                process.stdout.write(event.delta.text);
                reply += event.delta.text;
            }
        }
    }

}


async function controller(req, res) {

    async (req, res) => {
        try {
            let { message } = req.body;

/*
[
    {
            "role":"user",
            "content":"dfsfs"
    }
]
*/           const reply = await responder(message)

            res.status(200).json({ "reply": reply })
        } catch (error) {
            console.error("Error in /chat endpoint:", error);
            res.status(500).json({ error: "An error occurred while processing your request." });
        }
    }
}
