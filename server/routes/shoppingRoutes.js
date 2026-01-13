const express = require("express");
const router = express.Router();
const { requireUser } = require("../middleware/requireUser");
const { supabaseAdmin } = require("../supabaseAdmin");

function normKey(name) {
  return (name || "").toLowerCase().trim();
}

/**
 * GET /api/shopping
 * Returns latest shopping items (unchecked first)
 */
router.get("/", requireUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from("shopping_items")
      .select("*")
      .eq("user_id", userId)
      .order("checked", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load shopping list" });
  }
});

/**
 * POST /api/shopping
 * Body: { item_name, quantity? }
 * Adds item (unchecked)
 */
router.post("/", requireUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const item_name = (req.body.item_name || "").toString().trim();
    const quantity = (req.body.quantity || "").toString().trim() || null;

    if (!item_name) return res.status(400).json({ error: "item_name required" });

    const { data, error } = await supabaseAdmin
      .from("shopping_items")
      .insert({
        user_id: userId,
        item_name,
        quantity,
        checked: false,
      })
      .select("*")
      .single();

    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to add shopping item" });
  }
});

/**
 * PATCH /api/shopping/:id
 * Body can include: { checked?, quantity?, store?, price? }
 * If checked is set true and store/price present, we write to purchases memory too.
 */
router.patch("/:id", requireUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;

    const patch = {};
    if (typeof req.body.checked === "boolean") patch.checked = req.body.checked;
    if (typeof req.body.quantity === "string") patch.quantity = req.body.quantity.trim() || null;
    if (typeof req.body.store === "string") patch.store = req.body.store.trim() || null;
    if (req.body.price === null || req.body.price === undefined) {
      // ignore
    } else {
      const p = Number(req.body.price);
      patch.price = Number.isFinite(p) ? p : null;
    }

    const { data: updated, error } = await supabaseAdmin
      .from("shopping_items")
      .update(patch)
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) throw error;

    // Purchase memory:
    // If user checked it AND provided a store or price, record purchase event.
    if (updated.checked && (updated.store || updated.price !== null)) {
      const { error: pe } = await supabaseAdmin.from("purchases").insert({
        user_id: userId,
        item_name: updated.item_name,
        store: updated.store || null,
        price: updated.price ?? null,
      });
      if (pe) console.warn("purchase insert warning:", pe);
    }

    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update shopping item" });
  }
});

/**
 * DELETE /api/shopping/:id
 */
router.delete("/:id", requireUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;

    const { error } = await supabaseAdmin
      .from("shopping_items")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete shopping item" });
  }
});

/**
 * GET /api/shopping/suggest?name=milk
 * returns { store, price } from most recent purchase of that item
 */
router.get("/suggest", requireUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const name = (req.query.name || "").toString();
    const key = normKey(name);
    if (!key) return res.json({ store: null, price: null });

    // purchases has item_key as generated column; we can query by ilike on item_name too,
    // but item_key is best if your schema has it (you do).
    const { data, error } = await supabaseAdmin
      .from("purchases")
      .select("store,price,created_at,item_name,item_key")
      .eq("user_id", userId)
      .eq("item_key", key)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;

    const row = data?.[0];
    res.json({
      store: row?.store ?? null,
      price: row?.price ?? null,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch suggestion" });
  }
});

module.exports = router;
