const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function llmGenerate(inventory) {
  const pantry = inventory.pantry
    .map(i => `- ${i.name}${i.expiresAt ? ` (expires ${i.expiresAt})` : ""}`)
    .join("\n");

  const fridge = inventory.fridge
    .map(i => `- ${i.name}${i.expiresAt ? ` (expires ${i.expiresAt})` : ""}`)
    .join("\n");

  const prompt = `
You are a helpful cooking assistant for a college student.

They have the following kitchen inventory:

PANTRY:
${pantry || "None"}

FRIDGE:
${fridge || "None"}

Instructions:
- Prefer using items that expire soon.
- Assume access to a stovetop and microwave.
- Avoid oven-only recipes.
- Keep recipes simple, cheap, and low-effort.
- If something is missing, list it under "needs_to_buy".

Return STRICT JSON in this format:

{
  "title": string,
  "ingredients": string[],
  "steps": string[],
  "used_from_pantry": string[],
  "used_from_fridge": string[],
  "needs_to_buy": string[]
}
`;

  const response = await client.chat.completions.create({
    model: "gpt-5-mini",
    messages: [{ role: "user", content: prompt }]
  });

  return JSON.parse(response.choices[0].message.content);
}

module.exports = { llmGenerate };
