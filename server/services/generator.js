const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function safeList(list) {
  if (!Array.isArray(list) || list.length === 0) return "nothing";
  return list.join(", ");
}


async function llmGenerate({ pantryNames = [], fridgeNames =[], extraInstruction = ""}) {
  const prompt = `
You are a helpful cooking assistant for college students.

Pantry items: ${safeList(pantryNames)}
Fridge items: ${safeList(fridgeNames)}

Task: Create ONE simple, realistic meal that:
- uses mostly the listed items
- is cheap, low-effort, and dorm-friendly
- minimizes cleanup
${extraInstruction ? `- extra user request: ${extraInstruction}` : ""}

Return ONLY valid JSON with this exact shape:
{
  "title": "string",
  "ingredients": ["string"],
  "steps": ["string"]
}
`;

  const response = await client.responses.create({
    model: "gpt-5-mini",
    input: prompt,
    text: { format: { type: "json_object" } },
  });

  // best effort parse
  const raw = response.output_text;
  if (!raw) throw new Error("LLM returned no output_text");

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // sometimes output_text is valid JSON but with weird whitespace; still try to salvage
    parsed = JSON.parse(raw.trim());
  }

  if (!parsed?.title || !Array.isArray(parsed?.ingredients) || !Array.isArray(parsed?.steps)) {
    throw new Error("LLM JSON missing required fields");
  }

  return parsed;
}

async function llmTweak({ baseRecipe, delta }) {
  const prompt = `
You are editing an existing college-friendly recipe.

CURRENT RECIPE (JSON):
${JSON.stringify(baseRecipe, null, 2)}

User request:
"${delta}"

Return ONLY valid JSON with this exact shape:
{
  "title": "string",
  "ingredients": ["string"],
  "steps": ["string"]
}
`;

  const response = await client.responses.create({
    model: "gpt-5-mini",
    input: prompt,
    text: { format: { type: "json_object" } },
  });

  const raw = response.output_text;
  if (!raw) throw new Error("LLM returned no output_text");
  const parsed = JSON.parse(raw.trim());

  if (!parsed?.title || !Array.isArray(parsed?.ingredients) || !Array.isArray(parsed?.steps)) {
    throw new Error("LLM tweak JSON missing required fields");
  }

  return parsed;
}

module.exports = { llmGenerate, llmTweak };
