const express = require("express");
const router = express.Router();
const { requireUser } = require("../middleware/requireUser");
const { supabaseAdmin } = require("../supabaseAdmin");

router.get("/", requireUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabaseAdmin
      .from("inventory_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

router.post("/", requireUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, location, expiresAt } = req.body;

    if (!name || !location) return res.status(400).json({ error: "name + location required" });

    const { data, error } = await supabaseAdmin
      .from("inventory_items")
      .insert({
        user_id: userId,
        name: name.trim(),
        location,
        expires_at: expiresAt || null,
      })
      .select("*")
      .single();

    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to add inventory" });
  }
});

router.delete("/:id", requireUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;

    const { error } = await supabaseAdmin
      .from("inventory_items")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete inventory" });
  }
});

module.exports = router;
