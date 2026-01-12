const express = require("express");
const router = express.Router();
const { requireUser } = require("../middleware/requireUser");
const { supabaseAdmin } = require("../supabaseAdmin");
const { llmGenerate, llmTweak } = require("../services/generator");

function normalizeName(s) {
  return (s || "").toLowerCase().trim();
}

router.post("/generate", requireUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const inventory = req.body.inventory || { pantry: [], fridge: [] };
    const pantryNames = (inventory.pantry || []).map(i => normalizeName(i.name)).filter(Boolean);
    const fridgeNames = (inventory.fridge || []).map(i => normalizeName(i.name)).filter(Boolean);
    if (!Array.isArray(pantryNames) || !Array.isArray(fridgeNames)) {
  return res.status(400).json({ error: "Invalid inventory payload" });
}

    const recipe = await llmGenerate({ pantry: pantryNames, fridge: fridgeNames });

    // autosave recipe to supabase
    const { data, error } = await supabaseAdmin
      .from("recipes")
      .insert({
        user_id: userId,
        title: recipe.title,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        base_prompt: "inventory-based-generation",
      })
      .select("*")
      .single();

    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error("generate error:", e);
    res.status(500).json({ error: "Failed to generate recipe" });
  }
});

router.get("/", requireUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const q = (req.query.q || "").toString().toLowerCase().trim();

    let query = supabaseAdmin
      .from("recipes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (q) query = query.ilike("title", `%${q}%`);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

router.patch("/:id/star", requireUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const recipeId = req.params.id;

    // toggle
    const { data: existing, error: e1 } = await supabaseAdmin
      .from("recipes")
      .select("starred")
      .eq("id", recipeId)
      .eq("user_id", userId)
      .single();

    if (e1) throw e1;

    const { data, error } = await supabaseAdmin
      .from("recipes")
      .update({ starred: !existing.starred })
      .eq("id", recipeId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to star recipe" });
  }
});

router.post("/:id/tweak", requireUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const recipeId = req.params.id;
    const delta = (req.body.delta || "").toString().trim();
    if (!delta) return res.status(400).json({ error: "delta required" });

    const { data: base, error: e1 } = await supabaseAdmin
      .from("recipes")
      .select("id,title,ingredients,steps")
      .eq("id", recipeId)
      .eq("user_id", userId)
      .single();

    if (e1) throw e1;

    const tweaked = await llmTweak({
      baseRecipe: { title: base.title, ingredients: base.ingredients, steps: base.steps },
      delta
    });

    const { data, error } = await supabaseAdmin
      .from("recipe_variations")
      .insert({
        user_id: userId,
        recipe_id: recipeId,
        prompt_delta: delta,
        title: tweaked.title,
        ingredients: tweaked.ingredients,
        steps: tweaked.steps,
      })
      .select("*")
      .single();

    if (error) throw error;

    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to tweak recipe" });
  }
});

module.exports = router;
