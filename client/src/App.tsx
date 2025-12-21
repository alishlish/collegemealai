import { useEffect, useMemo, useState } from "react";
import "./App.css";

/* ---------- Types ---------- */

type Scene = "kitchen" | "recipe";

type InventoryItem = {
  name: string;
  expiresAt?: string; // ISO date string
};

type Inventory = {
  pantry: InventoryItem[];
  fridge: InventoryItem[];
};

type Recipe = {
  title: string;
  ingredients: string[];
  steps: string[];
  used_from_pantry: string[];
  used_from_fridge: string[];
  needs_to_buy: string[];
};

/* ---------- Helpers ---------- */

function daysUntil(date?: string) {
  if (!date) return null;
  const diff =
    new Date(date).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getCollegeReality(recipe: Recipe) {
  const tags: string[] = [];
  if (recipe.steps.length <= 5) tags.push("Quick to make");
  if (recipe.steps.length <= 7) tags.push("Low effort");
  tags.push("Minimal cleanup", "College-friendly");
  return tags;
}

/* ---------- App ---------- */

function App() {
  const [scene, setScene] = useState<Scene>("kitchen");

  /* Inventory */
  const [inventory, setInventory] = useState<Inventory>({
    pantry: [],
    fridge: [],
  });

  /* Recipe */
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);

  /* Persist inventory */
  useEffect(() => {
    const saved = localStorage.getItem("inventory");
    if (saved) setInventory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("inventory", JSON.stringify(inventory));
  }, [inventory]);

  /* ---------- Add Item ---------- */
  const addItem = (
    section: "pantry" | "fridge",
    name: string,
    expiresAt?: string
  ) => {
    setInventory((inv) => ({
      ...inv,
      [section]: [...inv[section], { name, expiresAt }],
    }));
  };

  /* ---------- Generate ---------- */
  const handleGenerateMeal = async () => {
    if (
      inventory.pantry.length === 0 &&
      inventory.fridge.length === 0
    ) {
      alert("Add something to your kitchen first");
      return;
    }

    try {
      setLoading(true);
      setRecipe(null);
      setScene("recipe");

      const res = await fetch("http://localhost:5001/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventory }),
      });

      const data: Recipe = await res.json();
      setRecipe({
        ...data,
        used_from_pantry: data.used_from_pantry ?? [],
        used_from_fridge: data.used_from_fridge ?? [],
        needs_to_buy: data.needs_to_buy ?? [],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const realityTags = useMemo(
    () => (recipe ? getCollegeReality(recipe) : []),
    [recipe]
  );

  /* ---------- UI ---------- */

  return (
    <div className="page">
      <div className="card">
        <h1>Dorm Kitchen 🍳</h1>

        {scene === "kitchen" && (
          <>
            {/* Pantry */}
            <KitchenSection
              label="Pantry"
              emoji="🧺"
              items={inventory.pantry}
              onAdd={(name, date) => addItem("pantry", name, date)}
            />

            {/* Fridge */}
            <KitchenSection
              label="Fridge"
              emoji="❄️"
              items={inventory.fridge}
              onAdd={(name, date) => addItem("fridge", name, date)}
            />

            <button className="btn btnPrimary btnFull" onClick={handleGenerateMeal}>
              Cook something from my kitchen
            </button>
          </>
        )}

        {scene === "recipe" && (
          <>
            <button className="btn btnGhost" onClick={() => setScene("kitchen")}>
              ← Back to kitchen
            </button>

            {loading && <p>Simmering…</p>}

            {recipe && (
              <>
                <h2>{recipe.title}</h2>

                <h4>Steps</h4>
                <ol>
                  {recipe.steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>

                {/* Pantry Diff */}
                <div className="infoBox">
                  <strong>🧺 Used from your kitchen</strong>
                  <ul>
                    {recipe.used_from_pantry.map((i) => (
                      <li key={i}>Pantry: {i}</li>
                    ))}
                    {recipe.used_from_fridge.map((i) => (
                      <li key={i}>Fridge: {i}</li>
                    ))}
                  </ul>
                </div>

                {/* Shopping List */}
                {recipe.needs_to_buy.length > 0 && (
                  <div className="infoBox">
                    <strong>🛒 You may need to buy</strong>
                    <ul>
                      {recipe.needs_to_buy.map((item) => (
                        <li key={item}>
                          {item}{" "}
                          <button
                            className="btn btnMini"
                            onClick={() => addItem("pantry", item)}
                          >
                            Add to pantry
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Reality */}
                <div className="infoBox">
                  <strong>College Reality Check</strong>
                  <ul>
                    {realityTags.map((t) => (
                      <li key={t}>✔️ {t}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Kitchen Section ---------- */

function KitchenSection({
  label,
  emoji,
  items,
  onAdd,
}: {
  label: string;
  emoji: string;
  items: InventoryItem[];
  onAdd: (name: string, expiresAt?: string) => void;
}) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h3>{emoji} {label}</h3>

      <input
        className="input"
        placeholder="Item name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="date"
        className="input"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <button
        className="btn btnPrimary"
        onClick={() => {
          if (!name.trim()) return;
          onAdd(name.trim(), date || undefined);
          setName("");
          setDate("");
        }}
      >
        Add
      </button>

      <ul className="chips">
        {items.map((item, idx) => (
          <li key={idx} className="chip">
            {item.name}
            {item.expiresAt && (
              <span className="muted">
                {" "}
                ({daysUntil(item.expiresAt)}d)
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
