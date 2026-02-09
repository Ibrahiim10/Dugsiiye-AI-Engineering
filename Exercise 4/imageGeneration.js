import OpenAI from "openai";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateImage(topic) {
  const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt: `An illustration representing ${topic}`,
    size: "1024x1024",
  });

  const image_base64 = result.data[0].b64_json;
  const image_bytes = Buffer.from(image_base64, "base64");

  fs.writeFileSync("output/images/image.png", image_bytes);

  console.log("✅ Image generated");
}
