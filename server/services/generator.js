const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function llmGenerate(inventory) {
  const prompt = `
You are helping a college student cook in a small dorm or apartment.

They have the following kitchen setup:

Pantry (dry goods):
${inventory.pantry.join(", ") || "none"}

Fridge (perishables):
${inventory.fridge.join(", ") || "none"}

Your goals:
- Prioritize using pantry and fridge items the student already has
- Minimize introducing new ingredients
- Only suggest new ingredients if absolutely necessary
- Keep the recipe simple, cheap, and realistic for a college student
- Assume the student has access to a basic stovetop and microwave, and some basic kitchen tools the average college student would have (e.g., pot, pan, knife, cutting board, spatula, mixing bowl, measuring cups/spoons
Do not suggest oven-only recipes.


Return your response in STRICT JSON with the following shape:

{
  "title": string,
  "ingredients": string[],
  "steps": string[],
  "used_from_pantry": string[],
  "used_from_fridge": string[],
  "needs_to_buy": string[]
}

Do not include any extra commentary or formatting.
`;


  const response = await client.chat.completions.create({
    model: "gpt-5-mini",
    messages: [{ role: "user", content: prompt }]
  });

  return JSON.parse(response.choices[0].message.content);
}

module.exports = { llmGenerate };
