const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function llmGenerate(ingredients) {
  const prompt = `
You are a helpful assistant that creates realistic meals for college students.

Ingredients:
${ingredients.join(", ")}

Constraints:
- Under 30 minutes
- Minimal equipment
- College-student realistic

Return ONLY valid JSON in this format:
{
  "title": string,
  "ingredients": string[],
  "steps": string[]
}
`;

  const response = await client.chat.completions.create({
    model: "gpt-5-mini",
    messages: [{ role: "user", content: prompt }]
  });

  return JSON.parse(response.choices[0].message.content);
}

module.exports = { llmGenerate };
