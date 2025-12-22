import { useEffect, useMemo, useState } from "react";
import "./App.css";

/* ---------- Types ---------- */

type Scene = "kitchen" | "recipe";

type InventoryItem = {
  name: string;
  expiresAt?: string; // yyyy-mm-dd
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = new Date(date).getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getCollegeReality(recipe: Recipe) {
  const tags: string[] = [];
  if (recipe.steps.length <= 5) tags.push("Quick to make");
  if (recipe.steps.length <= 7) tags.push("Low effort");
  tags.push("Minimal cleanup", "College-friendly");
  return tags;
}

/* ---------- Components ---------- */

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
    <div className="kitchenSection">
      <h3 className="sectionHeading">
        {emoji} {label}
      </h3>
      <p className="sectionHint">
        {items.length === 0
          ? "nothing here yet — add what you already have"
          : "things you can cook with"}
      </p>

      <div className="row">
        <input
          className="input"
          placeholder={`add to ${label.toLowerCase()}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="date"
          className="input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          title="optional expiration date"
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
          put away
        </button>
      </div>

      {items.length > 0 && (
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
      )}
    </div>
  );
}

/* ---------- App ---------- */

export default function App() {
  /* ---------- Scene ---------- */
  const [scene, setScene] = useState<Scene>("kitchen");

  /* ---------- Theme (THIS ENABLES DARK MODE) ---------- */
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  /* ---------- Inventory ---------- */
  const [inventory, setInventory] = useState<Inventory>({
    pantry: [],
    fridge: [],
  });

  useEffect(() => {
    const saved = localStorage.getItem("inventory");
    if (saved) setInventory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("inventory", JSON.stringify(inventory));
  }, [inventory]);

  /* ---------- Recipe ---------- */
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);

  const realityTags = useMemo(
    () => (recipe ? getCollegeReality(recipe) : []),
    [recipe]
  );

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
      alert("add something to your kitchen first ✨");
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
      alert("something went wrong generating the recipe");
      setScene("kitchen");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UI ---------- */

  return (
    <div className="page">
      <div className="card">
        {/* HEADER WITH DARK MODE TOGGLE */}
        <div className="headerRow">
          <div>
            <h1 className="title">Dorm Kitchen 🍳</h1>
            <p className="subtitle">
              cozy meals with what you already have
            </p>
          </div>

          <button
            className="toggle"
            onClick={() =>
              setTheme((t) => (t === "dark" ? "light" : "dark"))
            }
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? "🌙 Night" : "☀️ Day"}
          </button>
        </div>

        {scene === "kitchen" && (
          <>
            <KitchenSection
              label="Pantry"
              emoji="🧺"
              items={inventory.pantry}
              onAdd={(name, date) =>
                addItem("pantry", name, date)
              }
            />

            <KitchenSection
              label="Fridge"
              emoji="❄️"
              items={inventory.fridge}
              onAdd={(name, date) =>
                addItem("fridge", name, date)
              }
            />

            <button
              className="btn btnPrimary btnFull"
              onClick={handleGenerateMeal}
            >
              let’s cook something 🍲
            </button>
          </>
        )}

        {scene === "recipe" && (
          <>
            <button
              className="btn btnGhost"
              onClick={() => setScene("kitchen")}
            >
              ← back to kitchen
            </button>

            {loading && (
              <p className="muted">simmering…</p>
            )}

            {!loading && recipe && (
              <>
                <h2>{recipe.title}</h2>

                <h4>Steps</h4>
                <ol>
                  {recipe.steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>

                <div className="infoBox">
                  <strong>🧺 used from your kitchen</strong>
                  <ul>
                    {recipe.used_from_pantry.map((i) => (
                      <li key={i}>Pantry: {i}</li>
                    ))}
                    {recipe.used_from_fridge.map((i) => (
                      <li key={i}>Fridge: {i}</li>
                    ))}
                  </ul>
                </div>

                {recipe.needs_to_buy.length > 0 && (
                  <div className="infoBox">
                    <strong>🛒 you may need to buy</strong>
                    <ul>
                      {recipe.needs_to_buy.map((item) => (
                        <li key={item}>
                          {item}{" "}
                          <button
                            className="btn btnMini"
                            onClick={() =>
                              addItem("pantry", item)
                            }
                          >
                            add to pantry
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="infoBox">
                  <strong>college reality check</strong>
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
