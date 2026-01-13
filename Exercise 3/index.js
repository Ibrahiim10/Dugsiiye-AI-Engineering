import "dotenv/config";
import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateConversationOne() {
  // Speaker A
  const a1 = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: "alloy",
    format: "mp3",
    input: `
Look, I’m not trying to fight with you.
I just want us to talk like adults.
We’ve been friends for too long to raise our voices over this.
I understand you’re upset — I really do —
but shouting won’t fix what went wrong.
Let’s slow down and actually listen to each other.
    `,
  });

  fs.writeFileSync("speaker_a_calm.mp3", Buffer.from(await a1.arrayBuffer()));

  // Speaker B
  const b1 = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: "alloy",
    format: "mp3",
    input: `
No, don’t tell me to calm down!
You always say that when you don’t want to take responsibility.
I trusted you, and you ignored me like I didn’t matter at all.
Do you know how that feels?
I’m tired of pretending everything is fine when it’s not!
    `,
  });

  fs.writeFileSync("speaker_b_angry.mp3", Buffer.from(await b1.arrayBuffer()));
}

async function generateConversationTwo() {
  // Speaker A follow-up
  const a2 = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: "alloy",
    format: "mp3",
    input: `
I hear what you’re saying.
But we can’t keep going in circles like this.
If we want this friendship to survive,
then we both need to take responsibility — not just one of us.
    `,
  });

  fs.writeFileSync("speaker_a_followup.mp3", Buffer.from(await a2.arrayBuffer()));

  // Speaker B follow-up
  const b2 = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: "alloy",
    format: "mp3",
    input: `
Maybe… maybe you’re right.
I’m still upset, but I don’t want to lose this friendship.
I just needed you to understand how much it hurt.
    `,
  });

  fs.writeFileSync("speaker_b_followup.mp3", Buffer.from(await b2.arrayBuffer()));
}

async function main() {
  await generateConversationOne();
  await generateConversationTwo();
  console.log("✅ All conversations generated");
}

main();
