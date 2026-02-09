import OpenAI from "openai";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI();

export async function generateAudio(text) {
  const speech = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: "coral",
    input: text,
    instructions: "Speak clearly and professionally.",
  });

  const buffer = Buffer.from(await speech.arrayBuffer());
  fs.writeFileSync("output/audio/narration.mp3", buffer);

  console.log("✅ Audio generated");
}
