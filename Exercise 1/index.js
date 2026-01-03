import "dotenv/config";
import OpenAI from "openai";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getTopicFromUser() {
  const rl = readline.createInterface({ input, output });

  try {
    const topic = (await rl.question("Enter a topic: ")).trim();
     if (!topic) {
      console.log("Topic cannot be empty. Please run again.");
      return;
    }
    console.log("✅ Topic captured:", topic);
  } finally {
    rl.close();
  }
}

// Step 2: Generates a blog post outline using OpenAI

// async function generateOutline(topic) {
//   const response = await openai.responses.create({
//     model: "gpt-4o",
//     max_output_tokens: 300,
//     instructions: "You are an expert content strategist.",
//     input: `Create a detailed blog post outline about: "${topic}"`,
//   });

//   return response.output_text;
// }


// const topic = await getTopicFromUser();
// const outline = await generateOutline(topic);

// console.log("\n BLOG OUTLINE \n");
// console.log(outline);



// Step 3: streaming outline generation
async function generateOutlineStream(topic) {
  const stream = await openai.responses.stream({
    model: "gpt-4o",
    max_output_tokens: 300,
    instructions: "You are an expert content strategist.",
    input: `Create a detailed blog post outline about: "${topic}"`,
  });

  let fullResponse = "";

  console.log("\n--- BLOG OUTLINE (streaming) ---\n\n");

  for await (const chunk of stream) {
    if (chunk.type === "response.output_text.delta") {
      process.stdout.write(chunk.delta);
      fullResponse += chunk.delta;
    }
  }

  console.log("\n\n--- Stream complete ---\n");

  return fullResponse;
}

// // Run Step 1 -> Step 3 (streaming generation)
// const topic = await getTopicFromUser();
// const outline = await generateOutlineStream(topic);



// Step 4: summarize outline in exactly 2 sentences

async function summarizeOutline(outlineText) {
  const response = await openai.responses.create({
    model: "gpt-4o",
    max_output_tokens: 120,
    instructions: "You are an expert content strategist.",
    input: `Summarize the following blog outline in exactly 2 sentences:\n\n${outlineText}`,
  });

  return response.output_text.trim();
}

// Run Step 1 -> Step 3 -> Step 4
// const topic = await getTopicFromUser();
// const outline = await generateOutlineStream(topic);

// const summary = await summarizeOutline(outline);
// console.log("\n--- 2-SENTENCE SUMMARY ---\n");
// console.log(summary);


// Step 5: answer questions grounded in the outline/summary context
async function answerQuestion({ topic, outline, summary, question }) {
  const context = `TOPIC:\n${topic}\n\nOUTLINE:\n${outline}\n\nSUMMARY:\n${summary}\n`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_output_tokens: 200,
    instructions:
      "You answer questions using ONLY the provided context. " +
      "If the answer is not clearly supported by the context, say: " +
      '"I don’t have that information in the outline/summary." ' +
      "Be concise and helpful.",
    input: `CONTEXT:\n${context}\n\nQUESTION:\n${question}\n\nANSWER:`,
  });

  return response.output_text.trim();
}

async function startQALoop({ topic, outline, summary }) {
  const rl = readline.createInterface({ input, output });

  console.log("\n--- FOLLOW-UP Q&A ---");
  console.log('Ask a question about the topic. Type "exit" to quit.\n');

  try {
    while (true) {
      const q = (await rl.question("You: ")).trim();
      if (!q) continue;

      if (["exit", "quit"].includes(q.toLowerCase())) {
        console.log("Goodbye.");
        break;
      }

      const a = await answerQuestion({ topic, outline, summary, question: q });
      console.log("\nAssistant:", a, "\n");
    }
  } finally {
    rl.close();
  }
}

// Run Steps 1–5
const topic = await getTopicFromUser();
const outline = await generateOutlineStream(topic);

const summary = await summarizeOutline(outline);
console.log("\n--- 2-SENTENCE SUMMARY ---\n");
console.log(summary);

await startQALoop({ topic, outline, summary });