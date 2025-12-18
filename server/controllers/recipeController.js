const { llmGenerate } = require("../services/generator");

async function generateRecipe(req, res) {
  try {
    const { ingredients } = req.body;

    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({ error: "No ingredients provided" });
    }

    const recipe = await llmGenerate(ingredients);

    res.json(recipe);
  } catch (err) {
    console.error("Recipe generation failed:", err);
    res.status(500).json({ error: "Failed to generate recipe" });
  }
}

module.exports = { generateRecipe };
