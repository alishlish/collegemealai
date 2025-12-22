const { llmGenerate } = require("../services/generator");

async function generateRecipe(req, res) {
  try {
    console.log("REQ BODY:", req.body); // 👈 DEBUG

    const inventory = req.body.inventory;

    if (!inventory || !inventory.pantry || !inventory.fridge) {
      return res.status(400).json({
        error: "Invalid inventory payload",
        received: req.body,
      });
    }

    const recipe = await llmGenerate(inventory);
    res.json(recipe);
  } catch (err) {
    console.error("Recipe generation failed:", err);
    res.status(500).json({ error: "Failed to generate recipe" });
  }
}

module.exports = { generateRecipe };
