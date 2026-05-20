
// This will only work for SDK newer than 2.0.0
import { GoogleGenAI } from "@google/genai";
import { response } from "express";


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



//Carries out the conversation with Gemini, including maintaining the conversation history and using tools like file search. It takes the user's message as input, sends it to Gemini, and returns the AI's response along with the updated conversation history.
async function responder(message) {
    /*
        message = [
           {
               type: "user_input",
               content: [{ type: "text", text: "I have 2 dogs in my house." }]
           }
       ];
   */
    console.log(message);

    //View the entire conversation history, including the user's message and the AI's response
    console.log("User Message:", message[message.length - 1].content[0].text);

    //The interactions API is more powerful and flexible than the generateContent API, and is the recommended way to have a conversation with Gemini. It allows you to maintain a history of the conversation, and to use tools like file search in a more natural way.     
    const interaction = await ai.interactions.create({
        model: "gemini-3.5-flash",
        input: message,
        store: false,
        system_instruction: "Strictly follow the standard from the guide in that file. Keep your final answer as short,straight forward and clear as possible, One line is okay (Like around 10 words..)",
        tools: [{
            type: "file_search",
            file_search_store_names: [process.env.FBC_STORE]
        }]
    });

    //View the entire conversation history, including the user's message and the AI's response
    console.log("AI Response:", interaction.steps.at(-1).content[0].text);
    const allSteps = interaction.steps;
    let currrentReply;

    allSteps.forEach((step) => {
        if (step.type === 'model_output') currrentReply = step;
    })


    const newHistory = [...message, currrentReply];
    console.log("Updated Conversation History:", newHistory);

    return {
        response: interaction.steps.at(-1).content[0].text,
        aichat: currrentReply,
        history: newHistory
    }

}


async function controller(req, res) {
    try {
        let { message } = req.body;

        const reply = await responder(message)

        res.status(200).json({ "reply": reply })
    } catch (error) {
        console.error("Error in /chat endpoint:", error);
        /*
        //Scaling strategy: If you receive a 429 Too Many Requests error, it means you've hit the rate limit for the current API key. In that case, you can switch to the next API key in your list and retry the request. This way, you can distribute the load across multiple keys and reduce the chances of hitting rate limits.
        if (error.status === 429) {
             currentKeyIndex = (currentKeyIndex + 1) % keys.length;
             console.log(`Switching to next API key: ${keys[currentKeyIndex]}`);
             return controller(req, res); // Retry with the next key
         }
         */

        res.status(500).json({ error: "Please try again later." });
    }
}
export default controller;
