const { llmGenerate } = require("../services/generator");

async function generateRecipe(req, res) {
  try {
    const { inventory } = req.body;

    // Basic validation
    if (
      !inventory ||
      (!inventory.pantry?.length && !inventory.fridge?.length)
    ) {
      return res.status(400).json({
        error: "Kitchen is empty. Add items to pantry or fridge first.",
      });
    }

    // Pantry-first LLM call
    const recipe = await llmGenerate(inventory);

    res.json(recipe);
  } catch (err) {
    console.error("Recipe generation failed:", err);
    res.status(500).json({ error: "Failed to generate recipe" });
  }
}

module.exports = { generateRecipe };
