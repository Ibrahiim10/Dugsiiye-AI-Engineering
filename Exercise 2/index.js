import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";

// openai
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// -----------------------------
// 1) INPUT
// -----------------------------
async function getTheme() {
  const rl = readline.createInterface({ input, output });
  const theme = (await rl.question("Enter a theme for the gallery: ")).trim();
  rl.close();

  if (!theme) {
    throw new Error("Theme cannot be empty. Please run again and type a theme.");
  }
  return theme;
}

// -----------------------------
// 2) FILE HELPERS
// -----------------------------
async function ensureImagesDir() {
  const imagesDir = path.join(process.cwd(), "images");
  await fs.mkdir(imagesDir, { recursive: true });
  return imagesDir;
}

async function saveMetadata(imagePath, metadata) {
  const metaPath = `${imagePath}.meta.json`;

  const payload = {
    ...metadata,
    savedAt: new Date().toISOString(),
    image: {
      filename: path.basename(imagePath),
      path: imagePath,
    },
  };

  await fs.writeFile(metaPath, JSON.stringify(payload, null, 2), "utf-8");
  return metaPath;
}

async function saveImageFromUrl(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download image: ${res.status} ${res.statusText}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  await fs.writeFile(outPath, Buffer.from(arrayBuffer));
}

// -----------------------------
// 3) ONE GENERATOR (NO DUPLICATES)
//    - supports b64_json OR url
//    - saves metadata
// -----------------------------
async function generateWithOpenAI(theme, { model, size, style, filename }) {
  const prompt = `High-quality gallery artwork. Theme: ${theme}.`;

  const response = await openai.images.generate({
    model,
    prompt,
    size,
    ...(style ? { style } : {}),
    // if model supports response_format, you can request base64
    // but we STILL handle url just in case
    ...(model === "dall-e-3" ? { response_format: "b64_json" } : {}),
  });

  const imagesDir = await ensureImagesDir();
  const outPath = path.join(imagesDir, filename);

  const item = response.data?.[0];
  if (!item) throw new Error("OpenAI returned no image data.");

  // ✅ Save image (base64 OR url)
  if (item.b64_json) {
    const bytes = Buffer.from(item.b64_json, "base64");
    await fs.writeFile(outPath, bytes);
  } else if (item.url) {
    await saveImageFromUrl(item.url, outPath);
  } else {
    throw new Error("OpenAI did not return b64_json or url.");
  }

  console.log(`Saved (${model}${style ? `, ${style}` : ""}, ${size}):`, outPath);

  // ✅ Save detailed metadata next to image
  const metaPath = await saveMetadata(outPath, {
    provider: "openai",
    model,
    size,
    style: style ?? null,
    theme,
    prompt,
    revisedPrompt: item.revised_prompt ?? null,
  });

  console.log("Metadata saved:", metaPath);

  return outPath;
}

// -----------------------------
// 4) VARIATIONS
// -----------------------------
async function generateAllSizes(theme) {
  const model = "gpt-image-1"; // ✅ IMPORTANT: define model here

  const variants = [
    { label: "square", size: "1024x1024", filename: "openai-square.png" },
    { label: "landscape", size: "1536x1024", filename: "openai-landscape.png" },
    { label: "portrait", size: "1024x1536", filename: "openai-portrait.png" },
  ];

  const results = {};
  for (const v of variants) {
    results[v.label] = await generateWithOpenAI(theme, { model, ...v });
  }

  console.log("\nSize comparison results:");
  console.log(results);
  return results;
}

async function generateStyleComparison(theme) {
  const model = "dall-e-3";
  const size = "1024x1024"; // dall-e-3 supports: 1024x1024, 1792x1024, 1024x1792
  const styles = ["vivid", "natural"];

  const results = {};
  for (const style of styles) {
    results[style] = await generateWithOpenAI(theme, {
      model,
      size,
      style,
      filename: `openai-${model}-${style}.png`,
    });
  }

  console.log("\nStyle comparison results:");
  console.log(results);
  return results;
}

// -----------------------------
// 5) GALLERY (SHOW ALL VARIATIONS)
//    - reads from style + size results
//    - links metadata json
// -----------------------------
async function createGallery(allResults) {
  const imagesDir = await ensureImagesDir();

  // allResults can be:
  // { sectionName: { label: path } } or just { label: path }
  // We normalize into sections.
  const sections = [];

  for (const [sectionName, sectionValue] of Object.entries(allResults)) {
    // If sectionValue is a string path (not expected), wrap it.
    if (typeof sectionValue === "string") {
      sections.push({
        title: sectionName,
        items: [{ label: sectionName, file: path.basename(sectionValue) }],
      });
      continue;
    }

    // sectionValue is likely { label: absPath }
    const items = Object.entries(sectionValue).map(([label, absPath]) => ({
      label,
      file: path.basename(absPath),
      meta: `${path.basename(absPath)}.meta.json`,
    }));

    sections.push({ title: sectionName, items });
  }

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Image Variations Gallery</title>
  <style>
    body { font-family: system-ui, Arial, sans-serif; margin: 24px; }
    h1 { margin: 0 0 10px; }
    h2 { margin: 26px 0 10px; font-size: 18px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
    .card { border: 1px solid #ddd; border-radius: 12px; padding: 12px; background: #fff; }
    img { width: 100%; height: auto; border-radius: 10px; display: block; }
    .row { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 10px; }
    .label { font-size: 14px; color: #222; word-break: break-word; }
    a { font-size: 12px; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Gallery: All Variations</h1>
  <p>Open this file in your browser.</p>

  ${sections
    .map(
      (section) => `
      <h2>${section.title}</h2>
      <div class="grid">
        ${section.items
          .map(
            (it) => `
          <div class="card">
            <a href="./${it.file}" target="_blank" rel="noreferrer">
              <img src="./${it.file}" alt="${it.label}" loading="lazy" />
            </a>
            <div class="row">
              <div class="label">${it.label}</div>
              ${
                it.meta
                  ? `<a href="./${it.meta}" target="_blank" rel="noreferrer">metadata</a>`
                  : ""
              }
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `
    )
    .join("")}
</body>
</html>`;

  const outPath = path.join(imagesDir, "index.html");
  await fs.writeFile(outPath, html, "utf8");
  console.log("\n🖼️ Gallery created:", outPath);
  console.log("Open it in your browser to view all variations.");
  return outPath;
}

// -----------------------------
// 6) RUN
// -----------------------------
const theme = await getTheme();

// Generate both sets
const styleResults = await generateStyleComparison(theme);
const sizeResults = await generateAllSizes(theme);

// Create gallery showing ALL variations
await createGallery({
  "Style Variations (dall-e-3)": styleResults,
  "Size Variations (gpt-image-1)": sizeResults,
});
