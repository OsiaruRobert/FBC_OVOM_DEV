import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});
const model = 'gemini-3.1-flash-live-preview';

// Simple function definitions
const turn_on_the_lights = { name: "turn_on_the_lights" };
const turn_off_the_lights = { name: "turn_off_the_lights" };
const tools = [{ functionDeclarations: [turn_on_the_lights, turn_off_the_lights] }];

// We removed the AUDIO modality. It will default to text.
const config = {
  tools: tools
};

async function live() {
  const responseQueue = [];

  async function waitMessage() {
    let done = false;
    let message = undefined;
    
    while (!done) {
      message = responseQueue.shift();
      if (message) {
        done = true;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    return message;
  }

  async function handleTurn() {
    const turns = [];
    let done = false;
    
    while (!done) {
      const message = await waitMessage();
      turns.push(message);

      // --- NEW TEXT HANDLING LOGIC ---
      // If the message contains text parts, print them to the console
      if (message.serverContent && message.serverContent.modelTurn) {
        for (const part of message.serverContent.modelTurn.parts) {
          if (part.text) {
            // Using process.stdout.write instead of console.log 
            // so it streams smoothly on the same line
            process.stdout.write(part.text); 
          }
        }
      }

      if (message.serverContent && message.serverContent.turnComplete) {
        done = true;
        console.log(); // Add a new line when the AI is done talking
      } else if (message.toolCall) {
        done = true;
      }
    }
    return turns;
  }

  const session = await ai.live.connect({
    model: model,
    callbacks: {
      onopen: function () {
        console.debug('--- Connected to Gemini ---');
      },
      onmessage: function (message) {
        responseQueue.push(message);
      },
      onerror: function (e) {
        console.debug('Error:', e.message);
      },
      onclose: function (e) {
        console.debug('--- Connection Closed ---', e.reason);
      },
    },
    config: config,
  });

  const inputTurns = 'Turn on the lights please';
  console.log(`User: ${inputTurns}\n`);
  
  session.sendClientContent({ turns: inputTurns });

  let turns = await handleTurn();

  for (const turn of turns) {
    if (turn.toolCall) {
      console.debug('[System: AI called a tool. Processing...]');
      const functionResponses = [];
      
      for (const fc of turn.toolCall.functionCalls) {
        functionResponses.push({
          id: fc.id,
          name: fc.name,
          response: { result: "ok" } // simple, hard-coded function response
        });
      }
      
      console.debug('[System: Tool completed. Sending results back to AI...]\n');
      process.stdout.write('AI: '); 
      session.sendToolResponse({ functionResponses: functionResponses });
    }
  }

  // Fetch the final text response from the AI
  turns = await handleTurn();

  session.close();
}

async function main() {
  await live().catch((e) => console.error('got error', e));
}

main();