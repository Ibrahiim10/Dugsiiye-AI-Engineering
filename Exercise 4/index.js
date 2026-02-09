import fs from "fs";
import readline from "readline";
import { generateText } from "./textGeneration.js";
import { generateImage } from "./imageGeneration.js";
import { generateAudio } from "./audioGeneration.js";

// Create folders if missing
["output/text", "output/images", "output/audio"].forEach(folder => {
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
});

// Setup readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter a topic for AI Content Studio: ", async (topic) => {
  if (!topic || topic.length < 3) {
    console.log("❌ Topic must be at least 3 characters");
    rl.close();
    return;
  }

  console.log("\n🚀 Generating content for:", topic);

  try {
    const article = await generateText(topic);
    await generateImage(topic);
    await generateAudio(article);

    console.log("\n🎉 AI Content Studio complete!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }

  rl.close();
});
