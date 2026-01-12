const express = require("express");
const router = express.Router();
const { requireUser } = require("../middleware/requireUser");
const { supabaseAdmin } = require("../supabaseAdmin");

// create default slots if user has none
router.post("/ensure-default-slots", requireUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: existing, error: e1 } = await supabaseAdmin
      .from("meal_slots")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    if (e1) throw e1;

    if (existing && existing.length > 0) return res.json({ ok: true, created: false });

    const defaults = [
      { name: "Breakfast", slot_order: 0 },
      { name: "Lunch", slot_order: 1 },
      { name: "Dinner", slot_order: 2 },
    ].map(s => ({ ...s, user_id: userId }));

    const { error } = await supabaseAdmin.from("meal_slots").insert(defaults);
    if (error) throw error;

    res.json({ ok: true, created: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to ensure slots" });
  }
});

router.get("/slots", requireUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabaseAdmin
      .from("meal_slots")
      .select("*")
      .eq("user_id", userId)
      .order("slot_order", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch slots" });
  }
});

// fetch week plans
router.get("/week", requireUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const start = req.query.start; // YYYY-MM-DD (monday)
    const end = req.query.end;     // sunday

    const { data, error } = await supabaseAdmin
      .from("meal_plans")
      .select("*")
      .eq("user_id", userId)
      .gte("plan_date", start)
      .lte("plan_date", end);

    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch week plan" });
  }
});

// upsert a plan cell
router.post("/set", requireUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan_date, meal_slot_id, recipe_id, variation_id, notes } = req.body;

    const payload = {
      user_id: userId,
      plan_date,
      meal_slot_id,
      recipe_id: recipe_id || null,
      variation_id: variation_id || null,
      notes: notes || null,
    };

    const { data, error } = await supabaseAdmin
      .from("meal_plans")
      .upsert(payload, { onConflict: "user_id,plan_date,meal_slot_id" })
      .select("*")
      .single();

    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to set plan cell" });
  }
});

router.delete("/unset", requireUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan_date, meal_slot_id } = req.body;

    const { error } = await supabaseAdmin
      .from("meal_plans")
      .delete()
      .eq("user_id", userId)
      .eq("plan_date", plan_date)
      .eq("meal_slot_id", meal_slot_id);

    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to unset plan cell" });
  }
});

module.exports = router;
