const { llmGenerate } = require("../services/generator");
const prisma = require("../prismaClient");

async function generateRecipe(req, res) {
  try {
    const { inventory } = req.body;

    const recipe = await llmGenerate(inventory);

    // ✅ Save ONLY the core recipe
    const saved = await prisma.recipe.create({
      data: {
        title: recipe.title,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
      },
    });

    res.json(saved);
  } catch (err) {
    console.error("Recipe generation failed:", err);
    res.status(500).json({ error: "Failed to generate recipe" });
  }
}

module.exports = { generateRecipe };
