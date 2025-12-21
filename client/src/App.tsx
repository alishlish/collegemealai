import { useEffect, useMemo, useState } from "react";
import "./App.css";

type Recipe = {
  title: string;
  ingredients: string[];
  steps: string[];
};

type Inventory = {
  pantry: string[];
  fridge: string[];
  tools: string[];
};

function getCollegeReality(recipe: Recipe) {
  const stepsCount = recipe.steps.length;
  const tags: string[] = [];

  if (stepsCount <= 5) tags.push("Quick to make");
  if (stepsCount <= 7) tags.push("Low effort");
  if (!recipe.ingredients.some((i) => i.toLowerCase().includes("oven"))) {
    tags.push("No oven needed");
  }

  tags.push("Minimal cleanup");
  tags.push("College-friendly");

  return tags;
}

function LoadingDots() {
  return (
    <span className="simmer">
      Generating something cozy
      <span className="dots">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </span>
    </span>
  );
}

/* ---------- Reusable Kitchen Section ---------- */
function KitchenSection({
  label,
  emoji,
  items,
  onAdd,
}: {
  label: string;
  emoji: string;
  items: string[];
  onAdd: (item: string) => void;
}) {
  const [input, setInput] = useState("");

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h3>{emoji} {label}</h3>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Add to ${label.toLowerCase()}`}
          className="input"
        />
        <button
          className="btn btnPrimary"
          onClick={() => {
            if (!input.trim()) return;
            onAdd(input.trim());
            setInput("");
          }}
        >
          Add
        </button>
      </div>

      <ul className="chips">
        {items.map((item, idx) => (
          <li key={idx} className="chip">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  /* ---------- Inventory ---------- */
  const [inventory, setInventory] = useState<Inventory>({
    pantry: [],
    fridge: [],
    tools: [],
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

  /* ---------- Dark mode ---------- */
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    localStorage.getItem("theme") === "dark" ? "dark" : "light"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const realityTags = useMemo(
    () => (recipe ? getCollegeReality(recipe) : []),
    [recipe]
  );

  /* ---------- Generate ---------- */
  const handleGenerateMeal = async () => {
    if (
      inventory.pantry.length === 0 &&
      inventory.fridge.length === 0
    ) {
      alert("Add some items to your pantry or fridge first!");
      return;
    }

    try {
      setLoading(true);
      setRecipe(null);

      const res = await fetch("http://localhost:5001/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventory }),
      });

      const data: Recipe = await res.json();
      setRecipe(data);
    } catch (err) {
      console.error("Error generating meal", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        {/* Header */}
        <div className="headerRow">
          <div>
            <h1 className="title">Dorm Kitchen 🍳</h1>
            <p className="subtitle">What can you make with what you already have?</p>
          </div>

          <button
            className="toggle"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
        </div>

        {/* Kitchen */}
        <KitchenSection
          label="Pantry"
          emoji="🧺"
          items={inventory.pantry}
          onAdd={(item) =>
            setInventory((inv) => ({
              ...inv,
              pantry: [...inv.pantry, item],
            }))
          }
        />

        <KitchenSection
          label="Fridge"
          emoji="❄️"
          items={inventory.fridge}
          onAdd={(item) =>
            setInventory((inv) => ({
              ...inv,
              fridge: [...inv.fridge, item],
            }))
          }
        />

        <KitchenSection
          label="Cooking Tools"
          emoji="🍳"
          items={inventory.tools}
          onAdd={(item) =>
            setInventory((inv) => ({
              ...inv,
              tools: [...inv.tools, item],
            }))
          }
        />

        {/* Generate */}
        <button className="btn btnPrimary btnFull" onClick={handleGenerateMeal}>
          Generate meal from my kitchen
        </button>

        {loading && <p className="muted"><LoadingDots /></p>}

        {recipe && (
          <div className="result">
            <h2>{recipe.title}</h2>

            <h4>Ingredients</h4>
            <ul>
              {recipe.ingredients.map((ing, idx) => (
                <li key={idx}>{ing}</li>
              ))}
            </ul>

            <h4>Steps</h4>
            <ol>
              {recipe.steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>

            <div className="infoBox">
              <strong>College Reality Check</strong>
              <ul>
                {realityTags.map((tag, idx) => (
                  <li key={idx}>✔️ {tag}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
