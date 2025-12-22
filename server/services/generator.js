const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function llmGenerate(inventory) {
  try {
    console.log("INVENTORY RECEIVED:", inventory);

    const pantry = inventory?.pantry ?? [];
    const fridge = inventory?.fridge ?? [];

    const pantryNames = pantry
      .map(i => (typeof i === "string" ? i : i?.name))
      .filter(Boolean);

    const fridgeNames = fridge
      .map(i => (typeof i === "string" ? i : i?.name))
      .filter(Boolean);

    console.log("PANTRY NAMES:", pantryNames);
    console.log("FRIDGE NAMES:", fridgeNames);

    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: `
You are a helpful cooking assistant for college students.

Pantry items: ${pantryNames.join(", ") || "nothing"}
Fridge items: ${fridgeNames.join(", ") || "nothing"}

Return JSON with:
title, ingredients, steps, used_from_pantry, used_from_fridge, needs_to_buy
      `,
      text: {
        format: { type: "json_object" }
      }
    });

    console.log("RAW RESPONSE:", JSON.stringify(response, null, 2));

    if (!response.output_text) {
      throw new Error("No output_text returned from LLM");
    }

    const parsed = JSON.parse(response.output_text);
    return parsed;

  } catch (err) {
    console.error("LLM INTERNAL ERROR:", err);
    throw err; // rethrow so controller sees it
  }
}

module.exports = { llmGenerate };
