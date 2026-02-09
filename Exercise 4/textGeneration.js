import OpenAI from "openai";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateText(topic) {
  // 1. Generate article
  const articleResponse = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "user", content: `Write a short blog article about ${topic}` }
    ],
    max_tokens: 300,
  });

  const article = articleResponse.choices[0].message.content;

  // 2. Generate summary
  const summaryResponse = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "user", content: `Summarize this in 2 sentences:\n${article}` }
    ],
    max_tokens: 100,
  });

  const summary = summaryResponse.choices[0].message.content;

  // Save files
  fs.writeFileSync("output/text/article.txt", article);
  fs.writeFileSync("output/text/summary.txt", summary);

  console.log("✅ Text generated");

  return article;
}
