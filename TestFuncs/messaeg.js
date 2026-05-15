import { GoogleGenAI, Modality } from '@google/genai';



const ai = new GoogleGenAI({
    apiKey: process.env.KEY,
});

async function testCall() {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Explain how AI works in a few words in one line",
  });
  console.log(response.text);
}


//Functions
const model = 'gemini-3.1-flash-live-preview';
const config = { responseModalities: [Modality.AUDIO] };

async function functionCall() {

  const session = await ai.live.connect({
    model: model,
    callbacks: {
      onopen: function () {
        console.debug('Opened');
      },
      onmessage: function (message) {
        console.debug(message);
      },
      onerror: function (e) {
        console.debug('Error:', e.message);
      },
      onclose: function (e) {
        console.debug('Close:', e.reason);
      },
    },
    config: config,
  });
const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Explain how AI works in a few words in one line",
  });
  console.debug("Session started");
  // Send content...

  session.close();
}

functionCall();

export { testCall };